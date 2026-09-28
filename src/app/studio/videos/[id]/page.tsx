import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { VideoForm } from "@/components/studio/video-form";
import { getVideoForEdit } from "@/lib/queries";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Edit video" };

export default async function EditVideoPage({ params }: PageProps<"/studio/videos/[id]">) {
  const { id } = await params;
  const viewer = await requireViewer(`/studio/videos/${id}`);
  const data = await getVideoForEdit(id, viewer.id);
  if (!data) notFound();
  const { video } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-6">
      <PageHeader title="Edit video" />
      <VideoForm
        initial={{
          id: video.id,
          url: video.isShort ? `https://www.youtube.com/shorts/${video.youtubeId}` : `https://www.youtube.com/watch?v=${video.youtubeId}`,
          title: video.title,
          description: video.description,
          topic: video.topic,
          category: video.category,
          level: video.level,
          tags: video.tags,
          repoUrl: video.repoUrl,
          originalAuthor: video.originalAuthor,
          visibility: video.visibility,
          snippets: data.snippets,
        }}
      />
    </div>
  );
}
