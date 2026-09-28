import { topicBySlug } from "@/lib/config";

export function TopicTag({ slug }: { slug: string | null }) {
  const topic = topicBySlug(slug);
  if (!topic) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ background: topic.color }} aria-hidden="true" />
      {topic.label}
    </span>
  );
}
