"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, GitFork, Link2, ListPlus, Lock, Plus, Share2, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { usePlayer } from "@/components/watch/player";
import { createPlaylist, setReaction, toggleWatchLater, togglePlaylistItem } from "@/lib/actions";
import { cn, formatCount, formatDuration } from "@/lib/format";

type PlaylistOption = { id: string; title: string; visibility: string; hasVideo: boolean };

const pill = "flex items-center gap-2 rounded-full bg-surface-2 px-3.5 py-2 text-sm font-medium hover:bg-line";

export function VideoActions({
  videoId,
  likes,
  dislikes,
  myReaction,
  inWatchLater,
  repoUrl,
  playlists,
  signedIn,
}: {
  videoId: string;
  likes: number;
  dislikes: number;
  myReaction: number;
  inWatchLater: boolean;
  repoUrl: string | null;
  playlists: PlaylistOption[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const [reaction, setReactionState] = useState(myReaction);
  const [saved, setSaved] = useState(inWatchLater);
  const [dialog, setDialog] = useState<"share" | "save" | null>(null);
  const [, startTransition] = useTransition();

  const base = { likes: likes - (myReaction === 1 ? 1 : 0), dislikes: dislikes - (myReaction === -1 ? 1 : 0) };
  const shownLikes = base.likes + (reaction === 1 ? 1 : 0);

  function react(value: 1 | -1) {
    if (!signedIn) return router.push("/signin");
    const next = reaction === value ? 0 : value;
    setReactionState(next);
    startTransition(async () => {
      const res = await setReaction(videoId, value);
      if (!res.ok) setReactionState(reaction);
    });
  }

  return (
    <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0 [&>*]:shrink-0">
      <div className="flex overflow-hidden rounded-full bg-surface-2">
        <button
          onClick={() => react(1)}
          aria-pressed={reaction === 1}
          className="flex items-center gap-2 py-2 pr-3 pl-3.5 text-sm font-medium hover:bg-line"
          aria-label={`Like, ${shownLikes} likes`}
        >
          <ThumbsUp className={cn("size-[18px]", reaction === 1 && "fill-current")} />
          {formatCount(shownLikes)}
        </button>
        <span className="my-2 w-px bg-line" aria-hidden="true" />
        <button
          onClick={() => react(-1)}
          aria-pressed={reaction === -1}
          className="px-3.5 py-2 hover:bg-line"
          aria-label="Dislike"
        >
          <ThumbsDown className={cn("size-[18px]", reaction === -1 && "fill-current")} />
        </button>
      </div>
      <button className={pill} onClick={() => setDialog("share")}>
        <Share2 className="size-[18px]" />
        Share
      </button>
      {repoUrl && (
        <a href={repoUrl} target="_blank" rel="noopener noreferrer" className={pill}>
          <GitFork className="size-[18px]" />
          Source code
        </a>
      )}
      <button
        className={pill}
        aria-pressed={saved}
        onClick={() => {
          if (!signedIn) return router.push("/signin");
          setSaved(!saved);
          startTransition(async () => {
            const res = await toggleWatchLater(videoId);
            if (!res.ok) setSaved(saved);
          });
        }}
      >
        {saved ? <Check className="size-[18px]" /> : <Clock className="size-[18px]" />}
        {saved ? "In Watch later" : "Watch later"}
      </button>
      <button
        className={pill}
        onClick={() => (signedIn ? setDialog("save") : router.push("/signin"))}
      >
        <ListPlus className="size-[18px]" />
        Save
      </button>

      {dialog === "share" && <ShareDialog videoId={videoId} onClose={() => setDialog(null)} />}
      {dialog === "save" && <SaveDialog videoId={videoId} playlists={playlists} onClose={() => setDialog(null)} />}
    </div>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-[var(--overlay)]"
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h2 className="font-medium">{title}</h2>
        <button onClick={() => ref.current?.close()} className="rounded-full p-1.5 hover:bg-surface-2" aria-label="Close">
          <X className="size-5" />
        </button>
      </div>
      <div className="px-5 pb-5">{children}</div>
    </dialog>
  );
}

function ShareDialog({ videoId, onClose }: { videoId: string; onClose: () => void }) {
  const { time } = usePlayer();
  const [atTime, setAtTime] = useState(false);
  const [copied, setCopied] = useState(false);
  const [startAt] = useState(Math.floor(time));
  const url = `${window.location.origin}/watch?v=${videoId}${atTime && startAt > 0 ? `&t=${startAt}` : ""}`;

  return (
    <Dialog title="Share" onClose={onClose}>
      <div className="flex items-center gap-2 rounded-lg border border-line bg-code p-1.5 pl-3">
        <Link2 className="size-4 shrink-0 text-muted" aria-hidden="true" />
        <input readOnly value={url} className="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none" onFocus={(e) => e.target.select()} />
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          }}
          className="rounded-md bg-link px-3 py-1.5 text-sm font-medium text-white hover:bg-link-hover"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {startAt > 0 && (
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={atTime}
            onChange={(e) => {
              setAtTime(e.target.checked);
              setCopied(false);
            }}
            className="accent-[var(--link)]"
          />
          Start at {formatDuration(startAt)}
        </label>
      )}
    </Dialog>
  );
}

function SaveDialog({ videoId, playlists, onClose }: { videoId: string; playlists: PlaylistOption[]; onClose: () => void }) {
  const router = useRouter();
  const [items, setItems] = useState(playlists);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog title="Save to playlist" onClose={onClose}>
      {items.length === 0 && !creating && <p className="pb-3 text-sm text-muted">You don&apos;t have any playlists yet.</p>}
      <ul className="max-h-64 space-y-1 overflow-y-auto">
        {items.map((p) => (
          <li key={p.id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2">
              <input
                type="checkbox"
                checked={p.hasVideo}
                className="size-4 accent-[var(--link)]"
                onChange={() => {
                  setItems((all) => all.map((x) => (x.id === p.id ? { ...x, hasVideo: !x.hasVideo } : x)));
                  startTransition(async () => {
                    await togglePlaylistItem(p.id, videoId);
                  });
                }}
              />
              <span className="flex-1 truncate text-sm">{p.title}</span>
              {p.visibility === "private" && <Lock className="size-4 text-muted" aria-label="Private" />}
            </label>
          </li>
        ))}
      </ul>
      {creating ? (
        <form
          className="mt-3 space-y-3 border-t border-line pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            startTransition(async () => {
              const res = await createPlaylist(name, visibility, videoId);
              if (!res.ok) return setError(res.error);
              setItems((all) => [{ id: res.data!.id, title: name.trim(), visibility, hasVideo: true }, ...all]);
              setCreating(false);
              setName("");
              router.refresh();
            });
          }}
        >
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={150}
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 outline-none focus:border-link"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Visibility</span>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg px-3 py-2"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCreating(false)} className="rounded-full px-4 py-2 text-sm font-medium hover:bg-surface-2">
              Cancel
            </button>
            <button
              disabled={pending || !name.trim()}
              className="rounded-full bg-link px-4 py-2 text-sm font-medium text-white hover:bg-link-hover disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setCreating(true)} className="mt-3 flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium hover:bg-surface-2">
          <Plus className="size-5" />
          New playlist
        </button>
      )}
    </Dialog>
  );
}
