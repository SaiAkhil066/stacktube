import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { PageHeader } from "@/components/page-header";
import { EmptyState, VideoGrid } from "@/components/video-card";
import { getSubscribedChannels, getSubscriptionFeed } from "@/lib/queries";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Subscriptions" };

export default async function SubscriptionsPage() {
  const viewer = await requireViewer("/feed/subscriptions");
  const [channels, videos] = await Promise.all([getSubscribedChannels(viewer.id), getSubscriptionFeed(viewer.id)]);

  return (
    <div className="px-4 pt-6 pb-16 sm:px-6">
      <PageHeader title="Subscriptions" />
      {channels.length > 0 && (
        <div className="mb-8 flex gap-5 overflow-x-auto pb-2 scrollbar-none">
          {channels.map((c) => (
            <Link key={c.id} href={`/@${c.handle}`} className="flex w-20 shrink-0 flex-col items-center gap-2 text-center">
              <Avatar name={c.name} image={c.image} size={64} />
              <span className="line-clamp-2 text-xs">{c.name}</span>
            </Link>
          ))}
        </div>
      )}
      {videos.length ? (
        <VideoGrid videos={videos} />
      ) : (
        <EmptyState title="Nothing here yet">
          <p>Subscribe to channels and their newest videos show up here.</p>
        </EmptyState>
      )}
    </div>
  );
}
