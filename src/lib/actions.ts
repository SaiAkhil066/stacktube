"use server";

import { and, eq, sql } from "drizzle-orm";
import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { CATEGORIES, LEVELS, SNIPPET_LANGUAGES, TOPICS } from "@/lib/config";
import { getViewer, requireViewer } from "@/lib/session";
import { fetchOEmbed, parseYouTubeUrl } from "@/lib/youtube";

const { videos, snippets, reactions, subscriptions, comments, commentLikes, watchHistory, watchLater, playlists, playlistItems, notifications, users } =
  schema;

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const SIGN_IN_FIRST: Result = { ok: false, error: "Sign in to do that." };

// ---------- Reactions, subscriptions, watch later ----------

export async function setReaction(videoId: string, value: 1 | -1): Promise<Result> {
  const viewer = await getViewer();
  if (!viewer) return SIGN_IN_FIRST;
  const db = await getDb();
  const where = and(eq(reactions.userId, viewer.id), eq(reactions.videoId, videoId));
  const [existing] = await db.select().from(reactions).where(where);
  if (existing?.value === value) await db.delete(reactions).where(where);
  else
    await db
      .insert(reactions)
      .values({ userId: viewer.id, videoId, value })
      .onConflictDoUpdate({ target: [reactions.userId, reactions.videoId], set: { value, createdAt: new Date() } });
  return { ok: true };
}

export async function toggleSubscription(channelId: string): Promise<Result> {
  const viewer = await getViewer();
  if (!viewer) return SIGN_IN_FIRST;
  if (viewer.id === channelId) return { ok: false, error: "You can't subscribe to your own channel." };
  const db = await getDb();
  const where = and(eq(subscriptions.subscriberId, viewer.id), eq(subscriptions.channelId, channelId));
  const [existing] = await db.select().from(subscriptions).where(where);
  if (existing) await db.delete(subscriptions).where(where);
  else {
    await db.insert(subscriptions).values({ subscriberId: viewer.id, channelId });
    await db.insert(notifications).values({ userId: channelId, actorId: viewer.id, type: "subscribe" });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleWatchLater(videoId: string): Promise<Result<{ saved: boolean }>> {
  const viewer = await getViewer();
  if (!viewer) return SIGN_IN_FIRST;
  const db = await getDb();
  const where = and(eq(watchLater.userId, viewer.id), eq(watchLater.videoId, videoId));
  const [existing] = await db.select().from(watchLater).where(where);
  if (existing) await db.delete(watchLater).where(where);
  else await db.insert(watchLater).values({ userId: viewer.id, videoId });
  return { ok: true, data: { saved: !existing } };
}

// ---------- Views, history, duration ----------

export async function recordView(videoId: string) {
  const db = await getDb();
  await db.update(videos).set({ views: sql`${videos.views} + 1` }).where(eq(videos.id, videoId));
  const viewer = await getViewer();
  if (viewer) {
    await db
      .insert(watchHistory)
      .values({ userId: viewer.id, videoId })
      .onConflictDoUpdate({ target: [watchHistory.userId, watchHistory.videoId], set: { watchedAt: new Date() } });
  }
}

export async function saveProgress(videoId: string, seconds: number) {
  const viewer = await getViewer();
  if (!viewer || !Number.isFinite(seconds)) return;
  const db = await getDb();
  await db
    .update(watchHistory)
    .set({ progressSeconds: Math.max(0, Math.floor(seconds)) })
    .where(and(eq(watchHistory.userId, viewer.id), eq(watchHistory.videoId, videoId)));
}

// The player reports the real length; store it the first time we learn it.
export async function reportDuration(videoId: string, seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 60 * 60 * 24) return;
  const db = await getDb();
  await db
    .update(videos)
    .set({ durationSeconds: Math.round(seconds) })
    .where(and(eq(videos.id, videoId), sql`${videos.durationSeconds} is null`));
}

export async function removeFromHistory(videoId: string) {
  const viewer = await requireViewer("/feed/history");
  const db = await getDb();
  await db.delete(watchHistory).where(and(eq(watchHistory.userId, viewer.id), eq(watchHistory.videoId, videoId)));
  refresh();
}

export async function clearHistory() {
  const viewer = await requireViewer("/feed/history");
  const db = await getDb();
  await db.delete(watchHistory).where(eq(watchHistory.userId, viewer.id));
  refresh();
}

// ---------- Comments ----------

const commentSchema = z.object({
  videoId: z.string().min(1),
  parentId: z.string().min(1).nullable(),
  body: z.string().trim().min(1, "Write something first.").max(5000, "Keep comments under 5,000 characters."),
});

export async function addComment(input: z.input<typeof commentSchema>): Promise<Result> {
  const viewer = await getViewer();
  if (!viewer) return SIGN_IN_FIRST;
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { videoId, parentId, body } = parsed.data;
  const db = await getDb();
  const [video] = await db.select({ ownerId: videos.ownerId }).from(videos).where(eq(videos.id, videoId));
  if (!video) return { ok: false, error: "This video no longer exists." };

  // Replies to replies attach to the top-level thread, like YouTube.
  let threadId = parentId;
  let notifyUser = video.ownerId;
  if (parentId) {
    const [parent] = await db.select().from(comments).where(eq(comments.id, parentId));
    if (!parent) return { ok: false, error: "That comment was deleted." };
    threadId = parent.parentId ?? parent.id;
    notifyUser = parent.userId;
  }

  await db.insert(comments).values({ videoId, userId: viewer.id, parentId: threadId, body });
  if (notifyUser !== viewer.id) {
    await db.insert(notifications).values({ userId: notifyUser, actorId: viewer.id, videoId, type: parentId ? "reply" : "comment" });
  }
  refresh();
  return { ok: true };
}

export async function deleteComment(commentId: string): Promise<Result> {
  const viewer = await getViewer();
  if (!viewer) return SIGN_IN_FIRST;
  const db = await getDb();
  const [c] = await db
    .select({ userId: comments.userId, ownerId: videos.ownerId })
    .from(comments)
    .innerJoin(videos, eq(videos.id, comments.videoId))
    .where(eq(comments.id, commentId));
  if (!c) return { ok: true };
  // Authors and the video's owner can delete.
  if (c.userId !== viewer.id && c.ownerId !== viewer.id) return { ok: false, error: "You can only delete your own comments." };
  await db.delete(comments).where(eq(comments.parentId, commentId));
  await db.delete(comments).where(eq(comments.id, commentId));
  refresh();
  return { ok: true };
}

export async function toggleCommentLike(commentId: string): Promise<Result> {
  const viewer = await getViewer();
  if (!viewer) return SIGN_IN_FIRST;
  const db = await getDb();
  const where = and(eq(commentLikes.userId, viewer.id), eq(commentLikes.commentId, commentId));
  const [existing] = await db.select().from(commentLikes).where(where);
  if (existing) await db.delete(commentLikes).where(where);
  else await db.insert(commentLikes).values({ userId: viewer.id, commentId });
  return { ok: true };
}

export async function togglePin(commentId: string): Promise<Result> {
  const viewer = await getViewer();
  if (!viewer) return SIGN_IN_FIRST;
  const db = await getDb();
  const [c] = await db
    .select({ videoId: comments.videoId, pinned: comments.pinned, ownerId: videos.ownerId })
    .from(comments)
    .innerJoin(videos, eq(videos.id, comments.videoId))
    .where(eq(comments.id, commentId));
  if (!c || c.ownerId !== viewer.id) return { ok: false, error: "Only the video's owner can pin comments." };
  await db.update(comments).set({ pinned: false }).where(eq(comments.videoId, c.videoId));
  if (!c.pinned) await db.update(comments).set({ pinned: true }).where(eq(comments.id, commentId));
  refresh();
  return { ok: true };
}

// ---------- Playlists ----------

export async function createPlaylist(title: string, visibility: string, videoId?: string): Promise<Result<{ id: string }>> {
  const viewer = await getViewer();
  if (!viewer) return SIGN_IN_FIRST;
  const name = title.trim();
  if (!name) return { ok: false, error: "Give the playlist a name." };
  if (name.length > 150) return { ok: false, error: "Keep the name under 150 characters." };
  const db = await getDb();
  const [p] = await db
    .insert(playlists)
    .values({ ownerId: viewer.id, title: name, visibility: visibility === "private" ? "private" : "public" })
    .returning({ id: playlists.id });
  if (videoId) await db.insert(playlistItems).values({ playlistId: p.id, videoId, position: 0 });
  return { ok: true, data: { id: p.id } };
}

export async function togglePlaylistItem(playlistId: string, videoId: string): Promise<Result<{ added: boolean }>> {
  const viewer = await getViewer();
  if (!viewer) return SIGN_IN_FIRST;
  const db = await getDb();
  const [p] = await db.select().from(playlists).where(and(eq(playlists.id, playlistId), eq(playlists.ownerId, viewer.id)));
  if (!p) return { ok: false, error: "Playlist not found." };
  const where = and(eq(playlistItems.playlistId, playlistId), eq(playlistItems.videoId, videoId));
  const [existing] = await db.select().from(playlistItems).where(where);
  if (existing) {
    await db.delete(playlistItems).where(where);
    return { ok: true, data: { added: false } };
  }
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${playlistItems.position}) + 1, 0)::int` })
    .from(playlistItems)
    .where(eq(playlistItems.playlistId, playlistId));
  await db.insert(playlistItems).values({ playlistId, videoId, position: next });
  return { ok: true, data: { added: true } };
}

export async function deletePlaylist(playlistId: string) {
  const viewer = await requireViewer("/feed/playlists");
  const db = await getDb();
  await db.delete(playlists).where(and(eq(playlists.id, playlistId), eq(playlists.ownerId, viewer.id)));
  redirect("/feed/playlists");
}

// ---------- Publishing ----------

export async function lookupYouTube(url: string): Promise<Result<{ youtubeId: string; isShort: boolean; title: string; author: string }>> {
  const parsed = parseYouTubeUrl(url);
  if (!parsed) return { ok: false, error: "That doesn't look like a YouTube link. Paste a youtube.com or youtu.be URL." };
  const meta = await fetchOEmbed(parsed.youtubeId);
  if (!meta) return { ok: false, error: "YouTube didn't return this video. Check it's public and allows embedding." };
  return { ok: true, data: { ...parsed, title: meta.title, author: meta.author_name } };
}

const snippetSchema = z.object({
  atSeconds: z.number().int().min(0),
  title: z.string().trim().min(1, "Every snippet needs a title.").max(120),
  language: z.enum(SNIPPET_LANGUAGES),
  code: z.string().min(1, "A snippet can't be empty.").max(20_000),
});

const videoSchema = z.object({
  url: z.string().min(1, "Paste a YouTube link."),
  title: z.string().trim().min(1, "Add a title.").max(150, "Titles are limited to 150 characters."),
  description: z.string().max(10_000),
  topic: z.enum(TOPICS.map((t) => t.slug) as [string, ...string[]]).nullable(),
  category: z.enum(CATEGORIES.map((c) => c.slug) as [string, ...string[]]),
  level: z.enum(LEVELS),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(15),
  repoUrl: z
    .string()
    .trim()
    .url("The repository link must be a full URL.")
    .refine((u) => u.startsWith("https://"), "Use an https:// link.")
    .nullable(),
  originalAuthor: z.string().trim().max(100).nullable(),
  visibility: z.enum(["public", "unlisted", "private"]),
  snippets: z.array(snippetSchema).max(50),
});

export type VideoInput = z.input<typeof videoSchema>;

function newVideoId() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function saveVideo(input: VideoInput, editingId?: string): Promise<Result<{ id: string }>> {
  const viewer = await getViewer();
  if (!viewer) return SIGN_IN_FIRST;
  const parsed = videoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;
  const yt = parseYouTubeUrl(data.url);
  if (!yt) return { ok: false, error: "That doesn't look like a YouTube link." };

  const db = await getDb();
  const values = {
    youtubeId: yt.youtubeId,
    isShort: yt.isShort,
    title: data.title,
    description: data.description,
    topic: data.topic,
    category: data.category,
    level: data.level,
    tags: [...new Set(data.tags)],
    repoUrl: data.repoUrl,
    originalAuthor: data.originalAuthor,
    visibility: data.visibility,
  };

  let id = editingId;
  if (editingId) {
    const [owned] = await db
      .select({ youtubeId: videos.youtubeId })
      .from(videos)
      .where(and(eq(videos.id, editingId), eq(videos.ownerId, viewer.id)));
    if (!owned) return { ok: false, error: "You can only edit your own videos." };
    await db
      .update(videos)
      .set({ ...values, ...(owned.youtubeId !== yt.youtubeId ? { durationSeconds: null } : {}) })
      .where(eq(videos.id, editingId));
    await db.delete(snippets).where(eq(snippets.videoId, editingId));
  } else {
    id = newVideoId();
    await db.insert(videos).values({ id, ownerId: viewer.id, ...values });
    if (data.visibility === "public") {
      const subs = await db.select({ id: subscriptions.subscriberId }).from(subscriptions).where(eq(subscriptions.channelId, viewer.id));
      if (subs.length)
        await db.insert(notifications).values(subs.map((s) => ({ userId: s.id, actorId: viewer.id, videoId: id!, type: "upload" })));
    }
  }
  if (data.snippets.length) await db.insert(snippets).values(data.snippets.map((s) => ({ ...s, videoId: id! })));
  revalidatePath("/", "layout");
  return { ok: true, data: { id: id! } };
}

export async function deleteVideo(videoId: string) {
  const viewer = await requireViewer("/studio");
  const db = await getDb();
  await db.delete(videos).where(and(eq(videos.id, videoId), eq(videos.ownerId, viewer.id)));
  revalidatePath("/", "layout");
}

// ---------- Channel, notifications ----------

export async function updateChannel(formData: FormData): Promise<Result> {
  const viewer = await getViewer();
  if (!viewer) return SIGN_IN_FIRST;
  const name = String(formData.get("name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  if (!name) return { ok: false, error: "Your channel needs a name." };
  if (name.length > 60 || bio.length > 1000) return { ok: false, error: "Name is limited to 60 characters and bio to 1,000." };
  const db = await getDb();
  await db.update(users).set({ name, bio: bio || null }).where(eq(users.id, viewer.id));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markNotificationsRead() {
  const viewer = await getViewer();
  if (!viewer) return;
  const db = await getDb();
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, viewer.id));
  revalidatePath("/", "layout");
}

