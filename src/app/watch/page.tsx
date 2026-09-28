import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Lock } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Markdown } from "@/components/markdown";
import { SubscribeButton } from "@/components/subscribe-button";
import { TopicTag } from "@/components/topic-tag";
import { VideoRow } from "@/components/video-card";
import { ChapterStrip } from "@/components/watch/chapters";
import { CodePanel } from "@/components/watch/code-panel";
import { Comments } from "@/components/watch/comments";
import { DescriptionBox } from "@/components/watch/description";
import { PlayerFrame, PlayerProvider, SeekLinks } from "@/components/watch/player";
import { VideoActions } from "@/components/watch/video-actions";
import { formatCount, parseChapters, timeAgo } from "@/lib/format";
import { highlight } from "@/lib/highlight";
import { getComments, getPlaylists, getSnippets, getVideo, listUpNext } from "@/lib/queries";
import { getViewer } from "@/lib/session";
import { thumbnailUrl } from "@/lib/youtube";

type Props = PageProps<"/watch">;

function param(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const id = param((await searchParams).v);
  const data = id ? await getVideo(id) : null;
  if (!data) return { title: "Video not found" };
  return {
    title: data.video.title,
    description: data.video.description.slice(0, 160),
    openGraph: { images: [thumbnailUrl(data.video.youtubeId)] },
  };
}

export default async function WatchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const id = param(sp.v);
  if (!id) notFound();
  const viewer = await getViewer();
  const data = await getVideo(id, viewer?.id);
  if (!data) notFound();

  const { video, owner } = data;
  const sort = param(sp.sort) === "newest" ? "newest" : "top";
  const [snippets, upNext, { comments, total }, playlists] = await Promise.all([
    getSnippets(video.id),
    listUpNext(video),
    getComments(video.id, viewer?.id, sort),
    viewer ? getPlaylists(viewer.id, { containing: video.id }) : Promise.resolve([]),
  ]);

  // ?t= from a shared link wins; otherwise resume where the viewer left off.
  const t = Number(param(sp.t));
  const resume = data.resumeAt > 10 && (!video.durationSeconds || data.resumeAt < video.durationSeconds - 15) ? data.resumeAt : 0;
  const start = Number.isFinite(t) && t > 0 ? Math.floor(t) : resume;
  const chapters = parseChapters(video.description);
  const panelSnippets = snippets.map((s) => ({ ...s, html: highlight(s.code, s.language) }));

  return (
    <PlayerProvider
      key={video.id}
      videoId={video.id}
      youtubeId={video.youtubeId}
      start={start}
      knownDuration={video.durationSeconds}
      signedIn={Boolean(viewer)}
    >
      <div className="mx-auto flex max-w-[110rem] flex-col gap-6 pb-16 sm:px-6 sm:pt-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <PlayerFrame />
          <ChapterStrip chapters={chapters} />

          <div className="px-4 sm:px-0">
            <h1 className="mt-4 text-xl leading-snug font-bold tracking-[-0.01em]">{video.title}</h1>

            <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <Link href={`/@${owner.handle}`} className="rounded-full">
                  <Avatar name={owner.name} image={owner.image} size={40} />
                </Link>
                <div className="mr-3 min-w-0">
                  <Link href={`/@${owner.handle}`} className="block truncate font-semibold">
                    {owner.name}
                  </Link>
                  <p className="text-xs text-muted">{formatCount(data.subscribers)} subscribers</p>
                </div>
                <SubscribeButton channelId={owner.id} subscribed={data.subscribed} signedIn={Boolean(viewer)} isSelf={viewer?.id === owner.id} />
              </div>
              <VideoActions
                videoId={video.id}
                likes={data.likes}
                dislikes={data.dislikes}
                myReaction={data.myReaction}
                inWatchLater={data.inWatchLater}
                repoUrl={video.repoUrl}
                playlists={playlists.map((p) => ({ id: p.id, title: p.title, visibility: p.visibility, hasVideo: p.hasVideo }))}
                signedIn={Boolean(viewer)}
              />
            </div>

            <div className="mt-4">
              <DescriptionBox
                meta={
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>{video.views.toLocaleString("en")} views</span>
                    <span>{timeAgo(video.createdAt)}</span>
                    <span className="font-normal text-muted">
                      <TopicTag slug={video.topic} />
                    </span>
                    <span className="font-normal text-muted capitalize">{video.level}</span>
                    {video.visibility !== "public" && (
                      <span className="flex items-center gap-1 font-normal text-muted capitalize">
                        <Lock className="size-3.5" aria-hidden="true" />
                        {video.visibility}
                      </span>
                    )}
                  </span>
                }
              >
                <SeekLinks>
                  {video.description ? <Markdown timestamps>{video.description}</Markdown> : <p className="text-muted">No description.</p>}
                </SeekLinks>
                {video.tags.length > 0 && (
                  <p className="mt-3 flex flex-wrap gap-2">
                    {video.tags.map((tag) => (
                      <Link key={tag} href={`/results?q=${encodeURIComponent(tag)}`} className="text-accent hover:underline">
                        #{tag}
                      </Link>
                    ))}
                  </p>
                )}
                {video.originalAuthor && (
                  <a
                    href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex w-fit items-center gap-1.5 text-muted hover:text-fg"
                  >
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                    Originally by {video.originalAuthor} on YouTube
                  </a>
                )}
              </DescriptionBox>
            </div>

            <div className="lg:hidden">{panelSnippets.length > 0 && <div className="mt-6"><CodePanel snippets={panelSnippets} /></div>}</div>

            <SeekLinks>
              <Comments
                comments={comments}
                total={total}
                sort={sort}
                ctx={{ videoId: video.id, ownerId: owner.id, ownerName: owner.name, viewer }}
              />
            </SeekLinks>
          </div>
        </div>

        <aside className="w-full shrink-0 px-4 sm:px-0 lg:w-[24rem] xl:w-[26rem]">
          {panelSnippets.length > 0 && (
            <div className="mb-6 hidden lg:block">
              <CodePanel snippets={panelSnippets} />
            </div>
          )}
          <h2 className="mb-3 text-base font-semibold">Up next</h2>
          <div className="space-y-3">
            {upNext.map((v) => (
              <VideoRow key={v.id} video={v} size="sm" />
            ))}
          </div>
        </aside>
      </div>
    </PlayerProvider>
  );
}
