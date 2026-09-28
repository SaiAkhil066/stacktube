import Link from "next/link";
import { ChipBar } from "@/components/chips";
import { ShortsShelf } from "@/components/shorts-shelf";
import { EmptyState, VideoGrid } from "@/components/video-card";
import { CATEGORIES, TOPICS, categoryBySlug, topicBySlug } from "@/lib/config";
import { listVideos } from "@/lib/queries";

export default async function Home({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const topic = topicBySlug(typeof sp.topic === "string" ? sp.topic : null);
  const category = categoryBySlug(typeof sp.category === "string" ? sp.category : null);
  const filtered = Boolean(topic || category);

  const [videos, shorts] = await Promise.all([
    listVideos({ topic: topic?.slug, category: category?.slug, shorts: false }),
    // The shelf shows on the unfiltered feed and under "Funny".
    !topic && (!category || category.slug === "comedy") ? listVideos({ shorts: true, limit: 12 }) : Promise.resolve([]),
  ]);

  const chips = [
    { href: "/", label: "All", active: !filtered },
    ...CATEGORIES.map((c) => ({ href: `/?category=${c.slug}`, label: c.label, active: category?.slug === c.slug })),
    ...TOPICS.map((t) => ({ href: `/?topic=${t.slug}`, label: t.label, active: topic?.slug === t.slug })),
  ];

  // Like YouTube: a couple of rows, the Shorts shelf, then the rest.
  const firstRows = videos.slice(0, 8);
  const rest = videos.slice(8);

  return (
    <div className="px-4 pb-16 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 bg-bg px-4 py-3 sm:-mx-6 sm:px-6">
        <ChipBar chips={chips} />
      </div>

      {videos.length ? (
        <div className="space-y-10 pt-3">
          <VideoGrid videos={firstRows} />
          <ShortsShelf shorts={shorts} />
          {rest.length > 0 && <VideoGrid videos={rest} />}
        </div>
      ) : (
        <EmptyState title={topic ? `No ${topic.label} videos yet` : "No videos here yet"}>
          <p>
            Be the first to publish one.{" "}
            <Link href="/studio/upload" className="text-link hover:underline">
              Add a video
            </Link>
          </p>
        </EmptyState>
      )}
    </div>
  );
}
