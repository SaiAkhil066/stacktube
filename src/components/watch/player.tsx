"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { recordView, reportDuration, saveProgress } from "@/lib/actions";

// Minimal slice of the YouTube IFrame API that we use.
type YTPlayer = {
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  destroy(): void;
};
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      host?: string;
      playerVars?: Record<string, string | number>;
      events?: { onReady?: () => void; onStateChange?: (e: { data: number }) => void };
    },
  ) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const PLAYING = 1;
const PAUSED = 2;
const ENDED = 0;

let apiPromise: Promise<YTNamespace> | null = null;
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  apiPromise ??= new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT!);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.append(script);
  });
  return apiPromise;
}

type PlayerState = { time: number; duration: number; seek: (seconds: number) => void };

const PlayerContext = createContext<PlayerState>({ time: 0, duration: 0, seek: () => {} });

export const usePlayer = () => useContext(PlayerContext);

export function PlayerProvider({
  videoId,
  youtubeId,
  start,
  knownDuration,
  signedIn,
  children,
}: {
  videoId: string;
  youtubeId: string;
  start: number;
  knownDuration: number | null;
  signedIn: boolean;
  children: React.ReactNode;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [time, setTime] = useState(start);
  const [duration, setDuration] = useState(knownDuration ?? 0);

  useEffect(() => {
    let cancelled = false;
    let counted = false;
    let lastSaved = 0;
    const el = document.createElement("div");
    mountRef.current?.append(el);

    loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      playerRef.current = new YT.Player(el, {
        videoId: youtubeId,
        host: "https://www.youtube-nocookie.com",
        playerVars: { autoplay: 1, rel: 0, playsinline: 1, start: Math.floor(start) },
        events: {
          onReady: () => {
            const d = playerRef.current?.getDuration() ?? 0;
            if (d > 0) {
              setDuration(d);
              if (!knownDuration) void reportDuration(videoId, d);
            }
          },
          onStateChange: ({ data }) => {
            const p = playerRef.current;
            if (!p) return;
            if (data === PLAYING && !counted) {
              counted = true;
              void recordView(videoId);
              const d = p.getDuration();
              if (d > 0) setDuration(d);
            }
            if (signedIn && (data === PAUSED || data === ENDED)) {
              void saveProgress(videoId, data === ENDED ? 0 : p.getCurrentTime());
            }
          },
        },
      });
    });

    const tick = window.setInterval(() => {
      const p = playerRef.current;
      if (!p?.getCurrentTime) return;
      const t = p.getCurrentTime();
      setTime(t);
      if (signedIn && counted && Math.abs(t - lastSaved) >= 15) {
        lastSaved = t;
        void saveProgress(videoId, t);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearInterval(tick);
      playerRef.current?.destroy();
      playerRef.current = null;
      el.remove();
    };
  }, [videoId, youtubeId, start, knownDuration, signedIn]);

  const seek = useCallback((seconds: number) => {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(seconds, true);
    p.playVideo();
    setTime(seconds);
    // Bring the player into view on small screens.
    mountRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  return (
    <PlayerContext.Provider value={{ time, duration, seek }}>
      <PlayerSlot.Provider value={mountRef}>{children}</PlayerSlot.Provider>
    </PlayerContext.Provider>
  );
}

const PlayerSlot = createContext<React.RefObject<HTMLDivElement | null> | null>(null);

// Where the iframe renders. Kept separate so the layout decides the position.
export function PlayerFrame() {
  const ref = useContext(PlayerSlot);
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black sm:rounded-xl">
      <div ref={ref} className="absolute inset-0 [&>div]:size-full [&_iframe]:size-full" />
    </div>
  );
}

// Clicks on links like "#t=90" (timestamps in descriptions and comments) seek the player.
export function SeekLinks({ children, className }: { children: React.ReactNode; className?: string }) {
  const { seek } = usePlayer();
  return (
    <div
      className={className}
      onClick={(e) => {
        const a = (e.target as HTMLElement).closest("a");
        const m = a?.getAttribute("href")?.match(/^#t=(\d+)$/);
        if (!m) return;
        e.preventDefault();
        seek(Number(m[1]));
      }}
    >
      {children}
    </div>
  );
}
