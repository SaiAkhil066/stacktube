"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { formatViews } from "@/lib/format";
import { thumbnailUrl } from "@/lib/youtube";

type Short = {
  id: string;
  youtubeId: string;
  title: string;
  views: number;
  owner: { handle: string; name: string; image: string | null };
};

// Vertical snap feed. Only the short in view gets a live player.
export function ShortsFeed({ shorts }: { shorts: Short[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      { threshold: 0.6 },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [shorts.length]);

  return (
    <div className="h-[calc(100dvh-3.5rem)] snap-y snap-mandatory overflow-y-auto scrollbar-none">
      {shorts.map((s, i) => (
        <section
          key={s.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          data-index={i}
          aria-label={s.title}
          className="flex h-full snap-start items-center justify-center gap-4 py-4"
        >
          <div className="relative aspect-[9/16] h-full max-h-[52rem] overflow-hidden rounded-2xl bg-black">
            {i === active ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${s.youtubeId}?autoplay=1&loop=1&playlist=${s.youtubeId}&playsinline=1&rel=0`}
                title={s.title}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 size-full"
              />
            ) : (
              <Image src={thumbnailUrl(s.youtubeId)} alt="" fill sizes="400px" className="object-cover opacity-60" />
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16 text-white">
              <Link href={`/@${s.owner.handle}`} className="pointer-events-auto flex w-fit items-center gap-2 text-sm font-semibold">
                <Avatar name={s.owner.name} image={s.owner.image} size={28} />@{s.owner.handle}
              </Link>
              <p className="mt-2 line-clamp-2 text-sm">{s.title}</p>
              <p className="text-xs text-white/70">{formatViews(s.views)}</p>
            </div>
          </div>
          <Link
            href={`/watch?v=${s.id}#comments`}
            className="flex flex-col items-center gap-1 self-end pb-6 text-xs"
            aria-label="Open comments"
          >
            <span className="grid size-12 place-items-center rounded-full bg-surface-2 hover:bg-line">
              <MessageSquare className="size-5" />
            </span>
            Comments
          </Link>
        </section>
      ))}
    </div>
  );
}
