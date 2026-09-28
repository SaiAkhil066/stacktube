"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Pin, ThumbsUp, Trash2 } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { addComment, deleteComment, toggleCommentLike, togglePin } from "@/lib/actions";
import { cn, formatCount } from "@/lib/format";
import type { Viewer } from "@/lib/session";

export function CommentComposer({
  videoId,
  parentId = null,
  viewer,
  autoFocus,
  onDone,
}: {
  videoId: string;
  parentId?: string | null;
  viewer: Viewer | null;
  autoFocus?: boolean;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [focused, setFocused] = useState(Boolean(autoFocus));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const reply = Boolean(parentId);

  if (!viewer) {
    return (
      <button onClick={() => router.push("/signin")} className="w-full border-b border-line pb-2 text-left text-sm text-muted">
        Sign in to add a comment...
      </button>
    );
  }

  return (
    <form
      className="flex gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await addComment({ videoId, parentId, body });
          if (!res.ok) return setError(res.error);
          setBody("");
          setFocused(false);
          onDone?.();
        });
      }}
    >
      <Avatar name={viewer.name} image={viewer.image} size={reply ? 24 : 40} />
      <div className="flex-1">
        <label className="sr-only" htmlFor={`c-${parentId ?? "root"}`}>
          {reply ? "Reply" : "Add a comment"}
        </label>
        <textarea
          id={`c-${parentId ?? "root"}`}
          value={body}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) e.currentTarget.form?.requestSubmit();
          }}
          rows={focused ? 3 : 1}
          placeholder={reply ? "Add a reply..." : "Add a comment..."}
          className="w-full resize-y border-b border-line bg-transparent py-1 text-sm outline-none focus:border-fg"
        />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        {focused && (
          <div className="mt-2 flex items-center gap-2">
            <p className="mr-auto text-xs text-muted">
              Markdown and <code className="font-mono">```code blocks```</code> work. Ctrl+Enter to post.
            </p>
            <button
              type="button"
              onClick={() => {
                setBody("");
                setFocused(false);
                onDone?.();
              }}
              className="rounded-full px-3.5 py-1.5 text-sm font-semibold hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              disabled={pending || !body.trim()}
              className="rounded-full bg-accent px-3.5 py-1.5 text-sm font-semibold text-accent-fg hover:bg-accent-hover disabled:opacity-40"
            >
              {reply ? "Reply" : "Comment"}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}

export function CommentControls({
  videoId,
  commentId,
  likes,
  likedByMe,
  pinned,
  canDelete,
  canPin,
  viewer,
}: {
  videoId: string;
  commentId: string;
  likes: number;
  likedByMe: boolean;
  pinned: boolean;
  canDelete: boolean;
  canPin: boolean;
  viewer: Viewer | null;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(likedByMe);
  const [replying, setReplying] = useState(false);
  const [, startTransition] = useTransition();
  const count = likes - (likedByMe ? 1 : 0) + (liked ? 1 : 0);

  return (
    <div>
      <div className="mt-1 flex items-center gap-1 text-xs">
        <button
          aria-pressed={liked}
          aria-label="Like comment"
          onClick={() => {
            if (!viewer) return router.push("/signin");
            setLiked(!liked);
            startTransition(async () => {
              await toggleCommentLike(commentId);
            });
          }}
          className="rounded-full p-1.5 hover:bg-surface-2"
        >
          <ThumbsUp className={cn("size-4", liked && "fill-current")} />
        </button>
        {count > 0 && <span className="mr-2 text-muted">{formatCount(count)}</span>}
        <button onClick={() => (viewer ? setReplying(true) : router.push("/signin"))} className="rounded-full px-3 py-1.5 font-semibold hover:bg-surface-2">
          Reply
        </button>
        {canPin && (
          <button
            onClick={() => startTransition(async () => void (await togglePin(commentId)))}
            className="rounded-full p-1.5 text-muted hover:bg-surface-2 hover:text-fg"
            aria-label={pinned ? "Unpin comment" : "Pin comment"}
          >
            <Pin className={cn("size-4", pinned && "fill-current")} />
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => {
              if (confirm("Delete this comment and its replies?")) startTransition(async () => void (await deleteComment(commentId)));
            }}
            className="rounded-full p-1.5 text-muted hover:bg-surface-2 hover:text-danger"
            aria-label="Delete comment"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
      {replying && (
        <div className="mt-2">
          <CommentComposer videoId={videoId} parentId={commentId} viewer={viewer} autoFocus onDone={() => setReplying(false)} />
        </div>
      )}
    </div>
  );
}

export function RepliesToggle({ count, children }: { count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-accent hover:bg-accent/10"
      >
        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        {count} {count === 1 ? "reply" : "replies"}
      </button>
      {open && <div className="mt-2 space-y-4">{children}</div>}
    </div>
  );
}
