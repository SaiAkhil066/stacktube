import Link from "next/link";
import { ChipBar } from "@/components/chips";
import { EmptyState, VideoGrid } from "@/components/video-card";
import { LEVELS, TOPICS, topicBySlug } from "@/lib/config";
import { listVideos } from "@/lib/queries";

export default async function Home({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const topic = topicBySlug(typeof sp.topic === "string" ? sp.topic : null);
  const level = typeof sp.level === "string" && (LEVELS as readonly string[]).includes(sp.level) ? sp.level : undefined;
  const videos = await listVideos({ topic: topic?.slug, level, shorts: false });

  const withLevel = (href: string) => (level ? `${href}${href.includes("?") ? "&" : "?"}level=${level}` : href);
  const chips = [
    { href: withLevel("/"), label: "All", active: !topic },
    ...TOPICS.map((t) => ({ href: withLevel(`/?topic=${t.slug}`), label: t.label, color: t.color, active: topic?.slug === t.slug })),
  ];

  return (
    <div className="px-4 pb-16 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 flex items-center gap-4 bg-bg/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <ChipBar chips={chips} className="min-w-0 flex-1" />
        <nav aria-label="Level" className="hidden shrink-0 items-center gap-1 rounded-lg bg-surface-2 p-1 text-xs md:flex">
          {[undefined, ...LEVELS].map((l) => {
            const params = new URLSearchParams();
            if (topic) params.set("topic", topic.slug);
            if (l) params.set("level", l);
            const href = params.size ? `/?${params}` : "/";
            return (
              <Link
                key={l ?? "any"}
                href={href}
                aria-current={level === l ? "page" : undefined}
                className={level === l ? "rounded-md bg-bg px-2.5 py-1 font-semibold capitalize" : "rounded-md px-2.5 py-1 text-muted capitalize hover:text-fg"}
              >
                {l ?? "Any level"}
              </Link>
            );
          })}
        </nav>
      </div>

      {videos.length ? (
        <div className="pt-3">
          <VideoGrid videos={videos} />
        </div>
      ) : (
        <EmptyState title={topic ? `No ${topic.label} videos yet` : "No videos yet"}>
          <p>
            Be the first to publish one.{" "}
            <Link href="/studio/upload" className="text-accent hover:underline">
              Add a video
            </Link>
          </p>
        </EmptyState>
      )}
    </div>
  );
}
