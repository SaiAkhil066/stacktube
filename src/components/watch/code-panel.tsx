"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Code2, Copy } from "lucide-react";
import { usePlayer } from "@/components/watch/player";
import { cn, formatDuration } from "@/lib/format";

export type PanelSnippet = { id: string; atSeconds: number; title: string; language: string; code: string; html: string };

// The signature feature: code from the video, lit up at the moment it appears on screen.
export function CodePanel({ snippets }: { snippets: PanelSnippet[] }) {
  const { time, seek } = usePlayer();
  const [follow, setFollow] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const headingId = useId();

  let activeIndex = -1;
  snippets.forEach((s, i) => {
    if (time >= s.atSeconds) activeIndex = i;
  });
  const active = snippets[activeIndex];

  useEffect(() => {
    if (!follow || !active) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-id="${active.id}"]`);
    const list = listRef.current;
    if (el && list) list.scrollTo({ top: el.offsetTop - list.offsetTop - 8, behavior: "smooth" });
  }, [active, follow]);

  async function copy(s: PanelSnippet) {
    await navigator.clipboard.writeText(s.code);
    setCopied(s.id);
    window.setTimeout(() => setCopied((c) => (c === s.id ? null : c)), 1500);
  }

  return (
    <section aria-labelledby={headingId} className="overflow-hidden rounded-xl border border-line bg-surface">
      <header className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <Code2 className="size-4 text-str" aria-hidden="true" />
        <h2 id={headingId} className="text-sm font-medium">
          Code in this video
        </h2>
        <span className="text-xs text-muted">{snippets.length}</span>
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} className="accent-[var(--link)]" />
          Follow video
        </label>
      </header>
      <ol ref={listRef} className="max-h-[min(60vh,32rem)] space-y-2 overflow-y-auto p-2 scrollbar-thin">
        {snippets.map((s, i) => {
          const isActive = i === activeIndex;
          const upcoming = i > activeIndex;
          return (
            <li
              key={s.id}
              data-id={s.id}
              className={cn(
                "relative overflow-hidden rounded-lg border bg-code transition-colors",
                isActive ? "border-str/60" : "border-line",
              )}
            >
              {/* Editor-style "current line" gutter */}
              <span className={cn("absolute inset-y-0 left-0 w-[3px]", isActive ? "bg-str" : "bg-transparent")} aria-hidden="true" />
              <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                <button
                  onClick={() => seek(s.atSeconds)}
                  className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-link hover:bg-line"
                  aria-label={`Jump to ${formatDuration(s.atSeconds)}`}
                >
                  {formatDuration(s.atSeconds)}
                </button>
                <h3 className={cn("min-w-0 flex-1 truncate text-sm font-medium", upcoming && "text-muted")}>{s.title}</h3>
                <span className="font-mono text-[11px] text-muted">{s.language}</span>
                <button
                  onClick={() => copy(s)}
                  className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg"
                  aria-label={copied === s.id ? "Copied" : `Copy ${s.title}`}
                >
                  {copied === s.id ? <Check className="size-4 text-str" /> : <Copy className="size-4" />}
                </button>
              </div>
              <pre className={cn("overflow-x-auto px-3 pb-3 font-mono text-[12.5px] leading-relaxed", upcoming && "opacity-55")}>
                <code dangerouslySetInnerHTML={{ __html: s.html }} />
              </pre>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
