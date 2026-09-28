import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { VideoForm } from "@/components/studio/video-form";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Publish a video" };

export default async function UploadPage() {
  await requireViewer("/studio/upload");
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-6">
      <PageHeader title="Publish a video" />
      <VideoForm />
    </div>
  );
}
