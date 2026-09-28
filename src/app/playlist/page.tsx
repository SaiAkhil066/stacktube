import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Play, Trash2 } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { EmptyState, VideoRow } from "@/components/video-card";
import { deletePlaylist } from "@/lib/actions";
import { getLiked, getPlaylist, getWatchLater, type VideoCardData } from "@/lib/queries";
import { getViewer, requireViewer } from "@/lib/session";
import { thumbnailUrl } from "@/lib/youtube";

type Props = PageProps<"/playlist">;

async function load(list: string) {
  if (list === "WL" || list === "LL") {
    const viewer = await requireViewer(`/playlist?list=${list}`);
    const items = list === "WL" ? await getWatchLater(viewer.id) : await getLiked(viewer.id);
    return {
      title: list === "WL" ? "Watch later" : "Liked videos",
      owner: { id: viewer.id, handle: viewer.handle, name: viewer.name, image: viewer.image },
      visibility: "private",
      items,
      deletable: null as string | null,
    };
  }
  const viewer = await getViewer();
  const p = await getPlaylist(list, viewer?.id);
  if (!p) return null;
  return {
    title: p.playlist.title,
    owner: p.owner,
    visibility: p.playlist.visibility,
    items: p.items as VideoCardData[],
    deletable: viewer?.id === p.owner.id ? p.playlist.id : null,
  };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const list = (await searchParams).list;
  if (list === "WL") return { title: "Watch later" };
  if (list === "LL") return { title: "Liked videos" };
  return { title: "Playlist" };
}

export default async function PlaylistPage({ searchParams }: Props) {
  const list = (await searchParams).list;
  if (typeof list !== "string") notFound();
  const data = await load(list);
  if (!data) notFound();
  const cover = data.items[0];

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-16 sm:px-6 lg:flex-row lg:items-start">
      <aside className="shrink-0 overflow-hidden rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-20 lg:w-[22rem]">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-2">
          {cover && <Image src={thumbnailUrl(cover.youtubeId)} alt="" fill sizes="352px" className="object-cover" />}
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-[-0.02em]">{data.title}</h1>
        <Link href={`/@${data.owner.handle}`} className="mt-3 flex w-fit items-center gap-2 text-sm font-medium">
          <Avatar name={data.owner.name} image={data.owner.image} size={24} />
          {data.owner.name}
        </Link>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted">
          {data.visibility === "private" && <Lock className="size-3.5" aria-hidden="true" />}
          <span className="capitalize">{data.visibility}</span>, {data.items.length} {data.items.length === 1 ? "video" : "videos"}
        </p>
        <div className="mt-4 flex gap-2">
          {cover && (
            <Link
              href={`/watch?v=${cover.id}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-fg px-4 py-2 text-sm font-medium text-bg hover:opacity-85"
            >
              <Play className="size-4 fill-current" aria-hidden="true" />
              Play all
            </Link>
          )}
          {data.deletable && (
            <form action={deletePlaylist.bind(null, data.deletable)}>
              <ConfirmSubmit message="Delete this playlist? The videos stay on StackTube." label="Delete playlist" className="rounded-full bg-surface-2 p-2.5 hover:bg-line">
                <Trash2 className="size-4" />
              </ConfirmSubmit>
            </form>
          )}
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        {data.items.length ? (
          <ol className="space-y-3">
            {data.items.map((v, i) => (
              <li key={v.id} className="flex items-center gap-3">
                <span className="w-6 shrink-0 text-right font-mono text-sm text-muted">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <VideoRow video={v} />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState title="This playlist is empty">
            <p>Add videos with the Save button on any video.</p>
          </EmptyState>
        )}
      </div>
    </div>
  );
}
