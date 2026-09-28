import Link from "next/link";
import { Pin } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Markdown } from "@/components/markdown";
import { CommentComposer, CommentControls, RepliesToggle } from "@/components/watch/comment-controls";
import { cn, timeAgo } from "@/lib/format";
import type { CommentData } from "@/lib/queries";
import type { Viewer } from "@/lib/session";

type Ctx = { videoId: string; ownerId: string; ownerName: string; viewer: Viewer | null };

function Comment({ c, ctx, isReply }: { c: CommentData; ctx: Ctx; isReply?: boolean }) {
  const isOwner = c.author.id === ctx.ownerId;
  return (
    <article className="flex gap-3">
      <Link href={`/@${c.author.handle}`} className="h-fit rounded-full">
        <Avatar name={c.author.name} image={c.author.image} size={isReply ? 24 : 40} />
      </Link>
      <div className="min-w-0 flex-1">
        {c.pinned && (
          <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
            <Pin className="size-3.5" aria-hidden="true" /> Pinned by {ctx.ownerName}
          </p>
        )}
        <p className="flex flex-wrap items-center gap-x-2 text-[13px]">
          <Link
            href={`/@${c.author.handle}`}
            className={cn("font-semibold", isOwner && "rounded-full bg-surface-2 px-2 py-0.5")}
          >
            @{c.author.handle}
          </Link>
          <span className="text-muted">{timeAgo(c.createdAt)}</span>
        </p>
        <div className="mt-1 text-sm">
          <Markdown timestamps>{c.body}</Markdown>
        </div>
        <CommentControls
          videoId={ctx.videoId}
          commentId={c.id}
          likes={c.likes}
          likedByMe={c.likedByMe}
          pinned={c.pinned}
          canDelete={ctx.viewer != null && (ctx.viewer.id === c.author.id || ctx.viewer.id === ctx.ownerId)}
          canPin={!isReply && ctx.viewer?.id === ctx.ownerId}
          viewer={ctx.viewer}
        />
        {c.replies.length > 0 && (
          <RepliesToggle count={c.replies.length}>
            {c.replies.map((r) => (
              <Comment key={r.id} c={r} ctx={ctx} isReply />
            ))}
          </RepliesToggle>
        )}
      </div>
    </article>
  );
}

export function Comments({
  comments,
  total,
  sort,
  ctx,
}: {
  comments: CommentData[];
  total: number;
  sort: "top" | "newest";
  ctx: Ctx;
}) {
  const sortLink = (s: "top" | "newest") => `/watch?v=${ctx.videoId}${s === "newest" ? "&sort=newest" : ""}#comments`;
  return (
    <section id="comments" aria-labelledby="comments-heading" className="mt-6 scroll-mt-20">
      <div className="mb-5 flex items-center gap-6">
        <h2 id="comments-heading" className="text-lg font-bold">
          {total} {total === 1 ? "comment" : "comments"}
        </h2>
        <nav aria-label="Sort comments" className="flex gap-1 text-sm">
          {(["top", "newest"] as const).map((s) => (
            <Link
              key={s}
              href={sortLink(s)}
              scroll={false}
              aria-current={sort === s ? "true" : undefined}
              className={cn("rounded-full px-3 py-1", sort === s ? "bg-surface-2 font-semibold" : "text-muted hover:text-fg")}
            >
              {s === "top" ? "Top" : "Newest"}
            </Link>
          ))}
        </nav>
      </div>
      <CommentComposer videoId={ctx.videoId} viewer={ctx.viewer} />
      <div className="mt-6 space-y-6">
        {comments.map((c) => (
          <Comment key={c.id} c={c} ctx={ctx} />
        ))}
      </div>
    </section>
  );
}
