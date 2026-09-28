import Image from "next/image";
import Link from "next/link";
import { LogoMark } from "@/components/logo";
import type { VideoCardData } from "@/lib/queries";
import { formatViews } from "@/lib/format";
import { thumbnailUrl } from "@/lib/youtube";

export function ShortsShelf({ shorts }: { shorts: VideoCardData[] }) {
  if (!shorts.length) return null;
  return (
    <section aria-labelledby="shorts-heading" className="border-y border-line/60 py-6">
      <h2 id="shorts-heading" className="mb-4 flex items-center gap-2 text-xl font-bold">
        <LogoMark size={18} />
        Shorts
      </h2>
      <div className="grid auto-cols-[minmax(10rem,1fr)] grid-flow-col gap-3 overflow-x-auto pb-1 scrollbar-none sm:auto-cols-[minmax(11rem,13rem)]">
        {shorts.map((s) => (
          <Link key={s.id} href={`/shorts?s=${s.id}`} className="group">
            <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-surface-2">
              <Image src={thumbnailUrl(s.youtubeId)} alt="" fill sizes="208px" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
            </div>
            <h3 className="mt-2 line-clamp-2 leading-snug font-medium">{s.title}</h3>
            <p className="text-sm text-muted">{formatViews(s.views)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
