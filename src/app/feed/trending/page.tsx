import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { VideoRow } from "@/components/video-card";
import { listVideos } from "@/lib/queries";

export const metadata: Metadata = { title: "Trending" };

export default async function TrendingPage() {
  const videos = await listVideos({ sort: "popular", shorts: false, limit: 30 });
  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 pb-16 sm:px-6">
      <PageHeader title="Trending" />
      <ol className="space-y-5">
        {videos.map((v, i) => (
          <li key={v.id} className="flex gap-3 sm:gap-5">
            {/* Rank is a real ordering here */}
            <span className="w-6 shrink-0 pt-1 text-right font-mono text-sm text-muted sm:w-8 sm:text-base">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <VideoRow video={v} size="lg" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
