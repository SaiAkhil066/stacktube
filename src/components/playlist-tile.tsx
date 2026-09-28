import Image from "next/image";
import Link from "next/link";
import { ListVideo } from "lucide-react";
import { thumbnailUrl } from "@/lib/youtube";

export type Tile = { href: string; title: string; count: number; cover: string | null; icon: React.ReactNode; note?: string };

export function PlaylistTile({ t }: { t: Tile }) {
  return (
    <Link href={t.href} className="group">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-2">
        {t.cover ? (
          <Image src={thumbnailUrl(t.cover)} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-muted">{t.icon}</div>
        )}
        <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
          <ListVideo className="size-3.5" aria-hidden="true" />
          {t.count} {t.count === 1 ? "video" : "videos"}
        </span>
      </div>
      <p className="mt-2 font-semibold group-hover:underline">{t.title}</p>
      {t.note && <p className="flex items-center gap-1 text-xs text-muted">{t.note}</p>}
    </Link>
  );
}
