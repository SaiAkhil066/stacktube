import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { VideoCard } from "@/components/video-card";
import { getHistory, getLiked, getWatchLater } from "@/lib/queries";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "You" };

function Shelf({ title, href, videos }: { title: string; href: string; videos: Awaited<ReturnType<typeof getLiked>> }) {
  if (!videos.length) return null;
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <Link href={href} className="rounded-full border border-line px-3.5 py-1.5 text-sm font-medium hover:bg-surface-2">
          View all
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {videos.slice(0, 4).map((v) => (
          <VideoCard key={v.id} video={v} />
        ))}
      </div>
    </section>
  );
}

export default async function YouPage() {
  const viewer = await requireViewer("/feed/you");
  const [history, later, liked] = await Promise.all([getHistory(viewer.id, 4), getWatchLater(viewer.id), getLiked(viewer.id)]);

  return (
    <div className="px-4 pt-6 pb-16 sm:px-6">
      <div className="mb-10 flex items-center gap-4">
        <Avatar name={viewer.name} image={viewer.image} size={96} />
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.02em]">{viewer.name}</h1>
          <Link href={`/@${viewer.handle}`} className="text-sm text-muted hover:text-fg">
            @{viewer.handle}, view channel
          </Link>
        </div>
      </div>
      <Shelf title="History" href="/feed/history" videos={history} />
      <Shelf title="Watch later" href="/playlist?list=WL" videos={later} />
      <Shelf title="Liked videos" href="/playlist?list=LL" videos={liked} />
      <Link href="/feed/playlists" className="text-link hover:underline">
        See all your playlists
      </Link>
    </div>
  );
}
