import Image from "next/image";
import Link from "next/link";
import { Code2 } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { TopicTag } from "@/components/topic-tag";
import type { VideoCardData } from "@/lib/queries";
import { cn, formatDuration, formatViews, timeAgo } from "@/lib/format";
import { thumbnailUrl } from "@/lib/youtube";

export function Thumbnail({ video, className, sizes }: { video: VideoCardData; className?: string; sizes: string }) {
  const duration = formatDuration(video.durationSeconds);
  const progress =
    video.progressSeconds && video.durationSeconds ? Math.min(100, (video.progressSeconds / video.durationSeconds) * 100) : 0;
  return (
    <div className={cn("relative aspect-video overflow-hidden rounded-xl bg-surface-2", className)}>
      <Image
        src={thumbnailUrl(video.youtubeId)}
        alt=""
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
      {video.snippetCount > 0 && (
        <span className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-[#7fdbca]">
          <Code2 className="size-3.5" aria-hidden="true" />
          {video.snippetCount} {video.snippetCount === 1 ? "snippet" : "snippets"}
        </span>
      )}
      {duration && (
        <span className="absolute right-2 bottom-2 rounded-md bg-black/80 px-1.5 py-0.5 font-mono text-[11px] font-medium text-white">
          {duration}
        </span>
      )}
      {progress > 0 && (
        <span className="absolute inset-x-0 bottom-0 h-1 bg-white/30">
          <span className="block h-full bg-accent" style={{ width: `${progress}%` }} />
        </span>
      )}
    </div>
  );
}

function Meta({ video, className }: { video: VideoCardData; className?: string }) {
  return (
    <p className={cn("text-[13px] text-muted", className)}>
      {formatViews(video.views)}, {timeAgo(video.createdAt)}
    </p>
  );
}

export function VideoCard({ video }: { video: VideoCardData }) {
  return (
    <article className="group flex flex-col gap-3">
      <Link href={`/watch?v=${video.id}`} className="rounded-xl" aria-label={video.title}>
        <Thumbnail video={video} sizes="(min-width: 1536px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" />
      </Link>
      <div className="flex gap-3">
        <Link href={`/@${video.owner.handle}`} className="mt-0.5 h-fit rounded-full">
          <Avatar name={video.owner.name} image={video.owner.image} size={36} />
          <span className="sr-only">{video.owner.name}</span>
        </Link>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 leading-snug font-semibold">
            <Link href={`/watch?v=${video.id}`}>{video.title}</Link>
          </h3>
          <p className="mt-1 text-[13px] text-muted">
            <Link href={`/@${video.owner.handle}`} className="hover:text-fg">
              {video.owner.name}
            </Link>
          </p>
          <Meta video={video} />
          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted">
            <TopicTag slug={video.topic} />
            <span className="capitalize">{video.level}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

// Horizontal layout for search results, history, playlists and up next.
export function VideoRow({
  video,
  size = "md",
  children,
}: {
  video: VideoCardData;
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
}) {
  const thumb = { sm: "w-40 sm:w-44", md: "w-44 sm:w-64", lg: "w-full sm:w-[22rem]" }[size];
  return (
    <article className={cn("group flex gap-3", size === "lg" && "flex-col sm:flex-row sm:gap-4")}>
      <Link href={`/watch?v=${video.id}`} className={cn("shrink-0 self-start rounded-xl", thumb)} aria-label={video.title}>
        <Thumbnail video={video} sizes={size === "lg" ? "360px" : "256px"} className={size === "sm" ? "rounded-lg" : undefined} />
      </Link>
      <div className="min-w-0 flex-1">
        <h3 className={cn("line-clamp-2 leading-snug font-semibold", size === "sm" ? "text-sm" : size === "lg" && "text-lg")}>
          <Link href={`/watch?v=${video.id}`}>{video.title}</Link>
        </h3>
        {size === "lg" ? (
          <>
            <Meta video={video} className="mt-1" />
            <Link href={`/@${video.owner.handle}`} className="my-2.5 flex w-fit items-center gap-2 text-[13px] text-muted hover:text-fg">
              <Avatar name={video.owner.name} image={video.owner.image} size={24} />
              {video.owner.name}
            </Link>
            <div className="flex items-center gap-3 text-xs text-muted">
              <TopicTag slug={video.topic} />
              <span className="capitalize">{video.level}</span>
            </div>
          </>
        ) : (
          <>
            <p className="mt-1 text-xs text-muted">
              <Link href={`/@${video.owner.handle}`} className="hover:text-fg">
                {video.owner.name}
              </Link>
            </p>
            <p className="text-xs text-muted">
              {formatViews(video.views)}, {timeAgo(video.createdAt)}
            </p>
          </>
        )}
        {children}
      </div>
    </article>
  );
}

export function VideoGrid({ videos }: { videos: VideoCardData[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
      <svg viewBox="0 0 64 20" width="64" height="20" aria-hidden="true">
        <rect x="0" y="0" width="30" height="5" rx="2.5" fill="var(--kw)" />
        <rect x="0" y="7.5" width="46" height="5" rx="2.5" fill="var(--str)" />
        <rect x="0" y="15" width="22" height="5" rx="2.5" fill="var(--fn)" />
      </svg>
      <h2 className="text-lg font-semibold">{title}</h2>
      {children && <div className="text-sm text-muted">{children}</div>}
    </div>
  );
}
