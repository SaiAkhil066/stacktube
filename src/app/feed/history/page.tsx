import type { Metadata } from "next";
import { X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, VideoRow } from "@/components/video-card";
import { clearHistory, removeFromHistory } from "@/lib/actions";
import { getHistory } from "@/lib/queries";
import { requireViewer } from "@/lib/session";

export const metadata: Metadata = { title: "History" };

function dayLabel(d: Date) {
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return new Date(d).toLocaleDateString("en", { weekday: "long" });
  return new Date(d).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" });
}

export default async function HistoryPage() {
  const viewer = await requireViewer("/feed/history");
  const rows = await getHistory(viewer.id);

  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = dayLabel(r.watchedAt);
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 pb-16 sm:px-6">
      <PageHeader title="Watch history">
        {rows.length > 0 && (
          <form action={clearHistory}>
            <button className="rounded-full bg-surface-2 px-4 py-2 text-sm font-semibold hover:bg-line">Clear all history</button>
          </form>
        )}
      </PageHeader>
      {rows.length === 0 ? (
        <EmptyState title="No watch history yet">
          <p>Videos you watch while signed in show up here, with where you stopped.</p>
        </EmptyState>
      ) : (
        [...groups].map(([label, items]) => (
          <section key={label} className="mb-8">
            <h2 className="mb-4 text-lg font-bold">{label}</h2>
            <div className="space-y-4">
              {items.map((v) => (
                <div key={v.id} className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <VideoRow video={v} size="lg" />
                  </div>
                  <form action={removeFromHistory.bind(null, v.id)}>
                    <button className="rounded-full p-2 text-muted hover:bg-surface-2 hover:text-fg" aria-label={`Remove ${v.title} from history`}>
                      <X className="size-5" />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
