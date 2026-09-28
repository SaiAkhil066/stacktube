import type { Metadata } from "next";
import { Clock, ListVideo, Lock, ThumbsUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getLiked, getPlaylists, getWatchLater } from "@/lib/queries";
import { requireViewer } from "@/lib/session";
import { PlaylistTile, type Tile } from "@/components/playlist-tile";

export const metadata: Metadata = { title: "Playlists" };

export default async function PlaylistsPage() {
  const viewer = await requireViewer("/feed/playlists");
  const [playlists, liked, later] = await Promise.all([getPlaylists(viewer.id), getLiked(viewer.id), getWatchLater(viewer.id)]);

  const tiles: Tile[] = [
    { href: "/playlist?list=WL", title: "Watch later", count: later.length, cover: later[0]?.youtubeId ?? null, icon: <Clock className="size-8" />, note: "Private" },
    { href: "/playlist?list=LL", title: "Liked videos", count: liked.length, cover: liked[0]?.youtubeId ?? null, icon: <ThumbsUp className="size-8" />, note: "Private" },
    ...playlists.map((p) => ({
      href: `/playlist?list=${p.id}`,
      title: p.title,
      count: p.count,
      cover: p.cover,
      icon: <ListVideo className="size-8" />,
      note: p.visibility === "private" ? "Private" : "Public",
    })),
  ];

  return (
    <div className="px-4 pt-6 pb-16 sm:px-6">
      <PageHeader title="Playlists" />
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {tiles.map((t) => (
          <PlaylistTile key={t.href} t={t} />
        ))}
      </div>
      {playlists.length === 0 && (
        <p className="mt-10 flex items-center gap-2 text-sm text-muted">
          <Lock className="size-4" aria-hidden="true" />
          Create playlists from any video with the Save button.
        </p>
      )}
    </div>
  );
}
