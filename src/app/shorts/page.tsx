import type { Metadata } from "next";
import Link from "next/link";
import { ShortsFeed } from "@/components/shorts-feed";
import { EmptyState } from "@/components/video-card";
import { listVideos } from "@/lib/queries";

export const metadata: Metadata = { title: "Shorts" };

export default async function ShortsPage({ searchParams }: PageProps<"/shorts">) {
  const { s: startId } = await searchParams;
  const all = await listVideos({ shorts: true, limit: 50 });
  // Opened from the shelf: start at that short, keep the rest in order after it.
  const i = all.findIndex((v) => v.id === startId);
  const shorts = i > 0 ? [...all.slice(i), ...all.slice(0, i)] : all;
  if (!shorts.length) {
    return (
      <EmptyState title="No shorts yet">
        <p>
          Publish one from{" "}
          <Link href="/studio/upload" className="text-link hover:underline">
            Studio
          </Link>{" "}
          with a youtube.com/shorts/ link.
        </p>
      </EmptyState>
    );
  }
  return (
    <ShortsFeed
      shorts={shorts.map((s) => ({ id: s.id, youtubeId: s.youtubeId, title: s.title, owner: s.owner, views: s.views }))}
    />
  );
}
