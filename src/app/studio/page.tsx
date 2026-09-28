import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Eye, Lock, MessageSquare, Pencil, Plus, ThumbsUp, Trash2 } from "lucide-react";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/video-card";
import { deleteVideo } from "@/lib/actions";
import { formatCount } from "@/lib/format";
import { getStudioVideos } from "@/lib/queries";
import { requireViewer } from "@/lib/session";
import { thumbnailUrl } from "@/lib/youtube";

export const metadata: Metadata = { title: "Studio" };

export default async function StudioPage() {
  const viewer = await requireViewer("/studio");
  const videos = await getStudioVideos(viewer.id);
  const totals = videos.reduce(
    (acc, v) => ({ views: acc.views + v.views, likes: acc.likes + v.likes, comments: acc.comments + v.commentCount }),
    { views: 0, likes: 0, comments: 0 },
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-6">
      <PageHeader title="Studio">
        <Link
          href="/studio/upload"
          className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:bg-accent-hover"
        >
          <Plus className="size-4" />
          Publish a video
        </Link>
      </PageHeader>

      {videos.length > 0 && (
        <dl className="mb-8 grid grid-cols-3 divide-x divide-line rounded-xl border border-line bg-surface">
          {[
            ["Views", totals.views],
            ["Likes", totals.likes],
            ["Comments", totals.comments],
          ].map(([k, v]) => (
            <div key={k} className="px-5 py-4">
              <dt className="text-sm text-muted">{k}</dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums">{formatCount(v as number)}</dd>
            </div>
          ))}
        </dl>
      )}

      {videos.length === 0 ? (
        <EmptyState title="Nothing published yet">
          <p>Paste a YouTube link, add the code from the video, and it&apos;s live.</p>
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line/70 rounded-xl border border-line">
          {videos.map((v) => (
            <li key={v.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
              <Link href={`/watch?v=${v.id}`} className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:w-40">
                <Image src={thumbnailUrl(v.youtubeId, "mq")} alt="" fill sizes="160px" className="object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/watch?v=${v.id}`} className="line-clamp-2 font-semibold hover:underline">
                  {v.title}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                  <span className="flex items-center gap-1 capitalize">
                    {v.visibility !== "public" && <Lock className="size-3.5" aria-hidden="true" />}
                    {v.visibility}
                  </span>
                  <span>{v.createdAt.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="size-3.5" aria-hidden="true" />
                    {formatCount(v.views)}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="size-3.5" aria-hidden="true" />
                    {formatCount(v.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="size-3.5" aria-hidden="true" />
                    {formatCount(v.commentCount)}
                  </span>
                  <span>{v.snippetCount} snippets</span>
                </p>
              </div>
              <div className="flex gap-1">
                <Link href={`/studio/videos/${v.id}`} className="rounded-full p-2 hover:bg-surface-2" aria-label={`Edit ${v.title}`}>
                  <Pencil className="size-4" />
                </Link>
                <form action={deleteVideo.bind(null, v.id)}>
                  <ConfirmSubmit
                    message={`Delete "${v.title}"? Its comments and snippets are deleted too.`}
                    label={`Delete ${v.title}`}
                    className="rounded-full p-2 text-muted hover:bg-surface-2 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </ConfirmSubmit>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
