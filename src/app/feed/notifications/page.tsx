import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/video-card";
import { MarkRead } from "@/components/mark-read";
import { cn, timeAgo } from "@/lib/format";
import { getNotifications } from "@/lib/queries";
import { requireViewer } from "@/lib/session";
import { thumbnailUrl } from "@/lib/youtube";

export const metadata: Metadata = { title: "Notifications" };

const TEXT: Record<string, string> = {
  upload: "uploaded",
  comment: "commented on",
  reply: "replied to your comment on",
  subscribe: "subscribed to your channel",
};

export default async function NotificationsPage() {
  const viewer = await requireViewer("/feed/notifications");
  const items = await getNotifications(viewer.id);
  const hasUnread = items.some((n) => !n.read);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-16 sm:px-6">
      {hasUnread && <MarkRead />}
      <PageHeader title="Notifications" />
      {items.length === 0 ? (
        <EmptyState title="You're all caught up">
          <p>New uploads from your subscriptions, comments and replies land here.</p>
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line/70">
          {items.map((n) => {
            const href = n.video?.id ? `/watch?v=${n.video.id}${n.type !== "upload" ? "#comments" : ""}` : n.actor ? `/@${n.actor.handle}` : "#";
            return (
              <li key={n.id}>
                <Link href={href} className="flex items-center gap-4 rounded-lg px-2 py-3 hover:bg-surface">
                  <span className={cn("size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-accent")} aria-label={n.read ? undefined : "Unread"} />
                  {n.actor && <Avatar name={n.actor.name} image={n.actor.image} size={44} />}
                  <div className="min-w-0 flex-1 text-sm">
                    <p>
                      <span className="font-semibold">{n.actor?.name ?? "Someone"}</span> {TEXT[n.type] ?? n.type}
                      {n.video?.title && <span className="font-semibold"> {n.video.title}</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{timeAgo(n.createdAt)}</p>
                  </div>
                  {n.video?.youtubeId && (
                    <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-surface-2">
                      <Image src={thumbnailUrl(n.video.youtubeId, "mq")} alt="" fill sizes="112px" className="object-cover" />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
