"use client";

import { usePlayer } from "@/components/watch/player";
import { cn, formatDuration, type Chapter } from "@/lib/format";

// A segmented timeline under the player: one segment per chapter, filled as the video plays.
export function ChapterStrip({ chapters }: { chapters: Chapter[] }) {
  const { time, duration, seek } = usePlayer();
  if (!chapters.length || !duration) return null;
  const current = chapters.findLast((c) => time >= c.at) ?? chapters[0];

  return (
    <nav aria-label="Chapters" className="mt-3 px-4 sm:px-0">
      <div className="flex h-2 gap-[3px]">
        {chapters.map((c, i) => {
          const end = chapters[i + 1]?.at ?? duration;
          const fill = Math.max(0, Math.min(1, (time - c.at) / Math.max(1, end - c.at)));
          return (
            <button
              key={c.at}
              onClick={() => seek(c.at)}
              title={`${formatDuration(c.at)} ${c.title}`}
              aria-label={`Chapter ${i + 1}: ${c.title}, ${formatDuration(c.at)}`}
              className="relative h-full overflow-hidden rounded-full bg-surface-2 hover:bg-line"
              style={{ flexGrow: Math.max(1, end - c.at) }}
            >
              <span className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${fill * 100}%` }} />
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-sm">
        <span className="font-mono text-xs text-muted">{formatDuration(current.at)}</span>{" "}
        <span className={cn("font-medium")}>{current.title}</span>
      </p>
    </nav>
  );
}
