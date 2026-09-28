import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, ListVideo } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { SubscribeButton } from "@/components/subscribe-button";
import { EmptyState, VideoGrid } from "@/components/video-card";
import { ChannelEditor } from "@/components/channel-editor";
import { cn, formatCount } from "@/lib/format";
import { getChannel, getPlaylists, listVideos } from "@/lib/queries";
import { getViewer } from "@/lib/session";
import { thumbnailUrl } from "@/lib/youtube";
import Image from "next/image";

type Props = PageProps<"/channel/[handle]">;

const TABS = ["videos", "playlists", "about"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const channel = await getChannel(decodeURIComponent(handle));
  return { title: channel ? channel.user.name : "Channel not found" };
}

// A banner generated from the handle: rows of "code" in the syntax colours.
function bannerSegments(seed: string) {
  let h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rand = () => ((h = (h * 1103515245 + 12345) >>> 0) % 1000) / 1000;
  const colors = ["var(--kw)", "var(--str)", "var(--fn)", "var(--muted)"];
  const rows = Array.from({ length: 7 }, (_, row) => {
    let x = 20 + Math.floor(rand() * 4) * 24;
    return Array.from({ length: 2 + Math.floor(rand() * 4) }, () => {
      const w = 30 + Math.floor(rand() * 140);
      const seg = { x, y: 14 + row * 20, w, color: colors[Math.floor(rand() * colors.length)] };
      x += w + 10;
      return seg;
    });
  }).flat();
  return rows;
}

function Banner({ seed }: { seed: string }) {
  const rows = bannerSegments(seed);
  return (
    <svg viewBox="0 0 1200 160" preserveAspectRatio="xMinYMid slice" className="h-full w-full" aria-hidden="true">
      <rect width="1200" height="160" fill="var(--surface)" />
      {rows.map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width={s.w} height="8" rx="4" fill={s.color} opacity="0.55" />
      ))}
      {rows.map((s, i) => (
        <rect key={`r${i}`} x={s.x + 620} y={s.y} width={s.w} height="8" rx="4" fill={s.color} opacity="0.3" />
      ))}
    </svg>
  );
}

export default async function ChannelPage({ params, searchParams }: Props) {
  const { handle } = await params;
  const sp = await searchParams;
  const viewer = await getViewer();
  const channel = await getChannel(decodeURIComponent(handle), viewer?.id);
  if (!channel) notFound();

  const { user } = channel;
  const isSelf = viewer?.id === user.id;
  const tab = TABS.find((t) => t === sp.tab) ?? "videos";
  const sort = sp.sort === "popular" ? "popular" : sp.sort === "oldest" ? "oldest" : "latest";

  const [videos, playlists] = await Promise.all([
    tab === "videos" ? listVideos({ ownerId: user.id, sort, includePrivate: false }) : Promise.resolve([]),
    tab === "playlists" ? getPlaylists(user.id, { publicOnly: !isSelf }) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-[96rem] px-4 pb-16 sm:px-6">
      <div className="mt-4 h-28 overflow-hidden rounded-2xl sm:h-40">
        <Banner seed={user.handle} />
      </div>

      <header className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <Avatar name={user.name} image={user.image} size={120} className="size-20 sm:size-[120px]" />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-[-0.02em]">{user.name}</h1>
          <p className="mt-1 text-sm text-muted">
            <span className="font-medium text-fg">@{user.handle}</span>, {formatCount(channel.subscribers)} subscribers,{" "}
            {channel.videoCount} videos
          </p>
          {user.bio && <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-muted">{user.bio}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {isSelf ? (
              <>
                <ChannelEditor name={user.name} bio={user.bio ?? ""} />
                <Link href="/studio" className="rounded-full bg-surface-2 px-4 py-2 text-sm font-medium hover:bg-line">
                  Manage videos
                </Link>
              </>
            ) : (
              <SubscribeButton channelId={user.id} subscribed={channel.subscribed} signedIn={Boolean(viewer)} isSelf={false} />
            )}
          </div>
        </div>
      </header>

      <nav aria-label="Channel" className="mt-6 flex gap-6 border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t}
            href={t === "videos" ? `/@${user.handle}` : `/@${user.handle}/${t}`}
            aria-current={tab === t ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 pb-3 text-[15px] font-medium capitalize",
              tab === t ? "border-fg" : "border-transparent text-muted hover:text-fg",
            )}
          >
            {t}
          </Link>
        ))}
      </nav>

      <div className="pt-6">
        {tab === "videos" &&
          (videos.length ? (
            <>
              <div className="mb-5 flex gap-2">
                {(["latest", "popular", "oldest"] as const).map((s) => (
                  <Link
                    key={s}
                    href={`/@${user.handle}${s === "latest" ? "" : `?sort=${s}`}`}
                    aria-current={sort === s ? "true" : undefined}
                    className={cn("rounded-lg px-3 py-1.5 text-sm font-medium capitalize", sort === s ? "bg-fg text-bg" : "bg-surface-2 hover:bg-line")}
                  >
                    {s}
                  </Link>
                ))}
              </div>
              <VideoGrid videos={videos} />
            </>
          ) : (
            <EmptyState title={isSelf ? "You haven't published anything yet" : "This channel has no videos yet"}>
              {isSelf && (
                <Link href="/studio/upload" className="text-link hover:underline">
                  Publish your first video
                </Link>
              )}
            </EmptyState>
          ))}

        {tab === "playlists" &&
          (playlists.length ? (
            <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {playlists.map((p) => (
                <Link key={p.id} href={`/playlist?list=${p.id}`} className="group">
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-2">
                    {p.cover && <Image src={thumbnailUrl(p.cover)} alt="" fill sizes="25vw" className="object-cover" />}
                    <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                      <ListVideo className="size-3.5" aria-hidden="true" />
                      {p.count} videos
                    </span>
                  </div>
                  <p className="mt-2 font-medium group-hover:underline">{p.title}</p>
                  {p.visibility === "private" && <p className="text-xs text-muted">Private</p>}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No playlists yet" />
          ))}

        {tab === "about" && (
          <div className="max-w-2xl space-y-4">
            <p className="whitespace-pre-line">{user.bio || "No description yet."}</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted">Joined</dt>
              <dd>{user.createdAt.toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}</dd>
              <dt className="text-muted">Total views</dt>
              <dd>{channel.totalViews.toLocaleString("en")}</dd>
              {user.githubUrl && (
                <>
                  <dt className="text-muted">GitHub</dt>
                  <dd>
                    <a href={user.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-link hover:underline">
                      {user.githubUrl.replace("https://", "")}
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  </dd>
                </>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
