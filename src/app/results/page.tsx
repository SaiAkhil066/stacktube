import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { ChipBar } from "@/components/chips";
import { EmptyState, VideoRow } from "@/components/video-card";
import { LEVELS, TOPICS, topicBySlug } from "@/lib/config";
import { formatCount } from "@/lib/format";
import { listVideos, searchChannels } from "@/lib/queries";

type Props = PageProps<"/results">;

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = str((await searchParams).q);
  return { title: q ? `${q}` : "Search" };
}

export default async function ResultsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = str(sp.q).slice(0, 200);
  const topic = topicBySlug(str(sp.topic));
  const level = (LEVELS as readonly string[]).includes(str(sp.level)) ? str(sp.level) : undefined;
  const sort = str(sp.sort) === "popular" ? "popular" : "latest";

  const [videos, channels] = await Promise.all([
    listVideos({ q: q || undefined, topic: topic?.slug, level, sort, limit: 60 }),
    q && !topic && !level ? searchChannels(q) : Promise.resolve([]),
  ]);

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q, topic: topic?.slug, level, sort: sort === "latest" ? undefined : sort, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/results?${p}`;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pt-4 pb-16 sm:px-6">
      <div className="space-y-2">
        <ChipBar
          chips={[
            { href: href({ topic: undefined }), label: "All stacks", active: !topic },
            ...TOPICS.map((t) => ({ href: href({ topic: t.slug }), label: t.label, color: t.color, active: topic?.slug === t.slug })),
          ]}
        />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[undefined, ...LEVELS].map((l) => (
            <Link
              key={l ?? "any"}
              href={href({ level: l })}
              aria-current={level === l ? "true" : undefined}
              className={level === l ? "rounded-full bg-surface-2 px-3 py-1 font-medium capitalize" : "rounded-full px-3 py-1 text-muted capitalize hover:text-fg"}
            >
              {l ?? "Any level"}
            </Link>
          ))}
          <span className="mx-2 h-4 w-px bg-line" aria-hidden="true" />
          {(["latest", "popular"] as const).map((s) => (
            <Link
              key={s}
              href={href({ sort: s === "latest" ? undefined : s })}
              aria-current={sort === s ? "true" : undefined}
              className={sort === s ? "rounded-full bg-surface-2 px-3 py-1 font-medium" : "rounded-full px-3 py-1 text-muted hover:text-fg"}
            >
              {s === "latest" ? "Newest" : "Most viewed"}
            </Link>
          ))}
        </div>
      </div>

      {channels.length > 0 && (
        <div className="mt-6 space-y-4 border-b border-line pb-6">
          {channels.map((c) => (
            <Link key={c.id} href={`/@${c.handle}`} className="flex items-center gap-4 rounded-xl p-2 hover:bg-surface">
              <Avatar name={c.name} image={c.image} size={72} />
              <div className="min-w-0">
                <p className="text-lg font-medium">{c.name}</p>
                <p className="text-sm text-muted">
                  @{c.handle}, {formatCount(c.subscribers)} subscribers
                </p>
                {c.bio && <p className="mt-1 line-clamp-1 text-sm text-muted">{c.bio}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {videos.length ? (
        <div className="mt-6 space-y-5">
          {videos.map((v) => (
            <VideoRow key={v.id} video={v} size="lg" />
          ))}
        </div>
      ) : (
        <EmptyState title={q ? `Nothing matches "${q}"` : "No videos match these filters"}>
          <p>Try fewer words, a different stack, or any level.</p>
        </EmptyState>
      )}
    </div>
  );
}
