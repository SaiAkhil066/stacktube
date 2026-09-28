import type { Metadata } from "next";
import Link from "next/link";
import { ShortsFeed } from "@/components/shorts-feed";
import { EmptyState } from "@/components/video-card";
import { listVideos } from "@/lib/queries";

export const metadata: Metadata = { title: "Shorts" };

export default async function ShortsPage() {
  const shorts = await listVideos({ shorts: true, limit: 50 });
  if (!shorts.length) {
    return (
      <EmptyState title="No shorts yet">
        <p>
          Publish one from{" "}
          <Link href="/studio/upload" className="text-accent hover:underline">
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
