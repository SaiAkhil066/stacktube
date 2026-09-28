import "server-only";
import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";

const { users, videos, snippets, reactions, subscriptions, comments, watchHistory, watchLater, playlists, playlistItems, notifications } = schema;

const cardFields = {
  id: videos.id,
  youtubeId: videos.youtubeId,
  title: videos.title,
  views: videos.views,
  createdAt: videos.createdAt,
  durationSeconds: videos.durationSeconds,
  topic: videos.topic,
  level: videos.level,
  isShort: videos.isShort,
  originalAuthor: videos.originalAuthor,
  visibility: videos.visibility,
  snippetCount: sql<number>`(select count(*)::int from snippets s where s.video_id = ${videos.id})`,
  owner: { id: users.id, handle: users.handle, name: users.name, image: users.image },
};

export type VideoCardData = {
  id: string;
  youtubeId: string;
  title: string;
  views: number;
  createdAt: Date;
  durationSeconds: number | null;
  topic: string | null;
  level: string;
  isShort: boolean;
  originalAuthor: string | null;
  visibility: string;
  snippetCount: number;
  owner: { id: string; handle: string; name: string; image: string | null };
  progressSeconds?: number;
};

const isPublic = eq(videos.visibility, "public");

function searchCondition(q: string): SQL | undefined {
  const term = `%${q.trim().replace(/[%_]/g, "\\$&")}%`;
  return or(
    ilike(videos.title, term),
    ilike(videos.description, term),
    ilike(users.name, term),
    sql`array_to_string(${videos.tags}, ' ') ilike ${term}`,
  );
}

export async function listVideos(opts: {
  topic?: string;
  q?: string;
  level?: string;
  ownerId?: string;
  shorts?: boolean;
  excludeId?: string;
  sort?: "latest" | "popular" | "oldest";
  includePrivate?: boolean;
  limit?: number;
} = {}): Promise<VideoCardData[]> {
  const db = await getDb();
  const where: (SQL | undefined)[] = [];
  if (!opts.includePrivate) where.push(isPublic);
  if (opts.topic) where.push(eq(videos.topic, opts.topic));
  if (opts.level) where.push(eq(videos.level, opts.level));
  if (opts.ownerId) where.push(eq(videos.ownerId, opts.ownerId));
  if (opts.shorts !== undefined) where.push(eq(videos.isShort, opts.shorts));
  if (opts.excludeId) where.push(sql`${videos.id} <> ${opts.excludeId}`);
  if (opts.q) where.push(searchCondition(opts.q));

  const order =
    opts.sort === "popular" ? [desc(videos.views)] : opts.sort === "oldest" ? [asc(videos.createdAt)] : [desc(videos.createdAt)];

  return db
    .select(cardFields)
    .from(videos)
    .innerJoin(users, eq(users.id, videos.ownerId))
    .where(and(...where))
    .orderBy(...order)
    .limit(opts.limit ?? 48);
}

// Same topic first, then everything else by popularity.
export async function listUpNext(video: { id: string; topic: string | null }) {
  const db = await getDb();
  return db
    .select(cardFields)
    .from(videos)
    .innerJoin(users, eq(users.id, videos.ownerId))
    .where(and(isPublic, sql`${videos.id} <> ${video.id}`, eq(videos.isShort, false)))
    .orderBy(sql`case when ${videos.topic} = ${video.topic ?? ""} then 0 else 1 end`, desc(videos.views))
    .limit(20);
}

export async function getVideo(id: string, viewerId?: string) {
  const db = await getDb();
  const [row] = await db
    .select({
      video: videos,
      owner: { id: users.id, handle: users.handle, name: users.name, image: users.image },
      likes: sql<number>`(select count(*)::int from reactions r where r.video_id = ${videos.id} and r.value = 1)`,
      dislikes: sql<number>`(select count(*)::int from reactions r where r.video_id = ${videos.id} and r.value = -1)`,
      subscribers: sql<number>`(select count(*)::int from subscriptions s where s.channel_id = ${videos.ownerId})`,
    })
    .from(videos)
    .innerJoin(users, eq(users.id, videos.ownerId))
    .where(eq(videos.id, id));
  if (!row) return null;
  if (row.video.visibility === "private" && row.owner.id !== viewerId) return null;

  let myReaction = 0;
  let subscribed = false;
  let inWatchLater = false;
  let resumeAt = 0;
  if (viewerId) {
    const [[r], [s], [w], [h]] = await Promise.all([
      db.select({ value: reactions.value }).from(reactions).where(and(eq(reactions.userId, viewerId), eq(reactions.videoId, id))),
      db
        .select({ x: subscriptions.channelId })
        .from(subscriptions)
        .where(and(eq(subscriptions.subscriberId, viewerId), eq(subscriptions.channelId, row.owner.id))),
      db.select({ x: watchLater.videoId }).from(watchLater).where(and(eq(watchLater.userId, viewerId), eq(watchLater.videoId, id))),
      db
        .select({ p: watchHistory.progressSeconds })
        .from(watchHistory)
        .where(and(eq(watchHistory.userId, viewerId), eq(watchHistory.videoId, id))),
    ]);
    myReaction = r?.value ?? 0;
    subscribed = Boolean(s);
    inWatchLater = Boolean(w);
    resumeAt = h?.p ?? 0;
  }
  return { ...row, myReaction, subscribed, inWatchLater, resumeAt };
}

export type WatchData = NonNullable<Awaited<ReturnType<typeof getVideo>>>;

export async function getSnippets(videoId: string) {
  const db = await getDb();
  return db.select().from(snippets).where(eq(snippets.videoId, videoId)).orderBy(asc(snippets.atSeconds));
}

export type CommentData = {
  id: string;
  body: string;
  pinned: boolean;
  createdAt: Date;
  parentId: string | null;
  likes: number;
  likedByMe: boolean;
  author: { id: string; handle: string; name: string; image: string | null };
  replies: CommentData[];
};

export async function getComments(videoId: string, viewerId: string | undefined, sort: "top" | "newest" = "top") {
  const db = await getDb();
  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      pinned: comments.pinned,
      createdAt: comments.createdAt,
      parentId: comments.parentId,
      likes: sql<number>`(select count(*)::int from comment_likes cl where cl.comment_id = ${comments.id})`,
      likedByMe: viewerId
        ? sql<boolean>`exists(select 1 from comment_likes cl where cl.comment_id = ${comments.id} and cl.user_id = ${viewerId})`
        : sql<boolean>`false`,
      author: { id: users.id, handle: users.handle, name: users.name, image: users.image },
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .where(eq(comments.videoId, videoId))
    .orderBy(asc(comments.createdAt));

  const byId = new Map<string, CommentData>(rows.map((r) => [r.id, { ...r, replies: [] }]));
  const top: CommentData[] = [];
  for (const c of byId.values()) {
    const parent = c.parentId ? byId.get(c.parentId) : undefined;
    if (parent) parent.replies.push(c);
    else top.push(c);
  }
  top.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "top" && a.likes !== b.likes) return b.likes - a.likes;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
  return { comments: top, total: rows.length };
}

export async function getChannel(handle: string, viewerId?: string) {
  const db = await getDb();
  const [channel] = await db
    .select({
      user: users,
      subscribers: sql<number>`(select count(*)::int from subscriptions s where s.channel_id = "users"."id")`,
      videoCount: sql<number>`(select count(*)::int from videos v where v.owner_id = "users"."id" and v.visibility = 'public')`,
      totalViews: sql<number>`(select coalesce(sum(v.views), 0)::int from videos v where v.owner_id = "users"."id" and v.visibility = 'public')`,
    })
    .from(users)
    .where(eq(users.handle, handle.toLowerCase()));
  if (!channel) return null;
  let subscribed = false;
  if (viewerId) {
    const [s] = await db
      .select({ x: subscriptions.channelId })
      .from(subscriptions)
      .where(and(eq(subscriptions.subscriberId, viewerId), eq(subscriptions.channelId, channel.user.id)));
    subscribed = Boolean(s);
  }
  return { ...channel, subscribed };
}

export async function getSubscribedChannels(viewerId: string) {
  const db = await getDb();
  return db
    .select({ id: users.id, handle: users.handle, name: users.name, image: users.image })
    .from(subscriptions)
    .innerJoin(users, eq(users.id, subscriptions.channelId))
    .where(eq(subscriptions.subscriberId, viewerId))
    .orderBy(asc(users.name));
}

export async function getSubscriptionFeed(viewerId: string) {
  const db = await getDb();
  return db
    .select(cardFields)
    .from(videos)
    .innerJoin(users, eq(users.id, videos.ownerId))
    .innerJoin(subscriptions, and(eq(subscriptions.channelId, videos.ownerId), eq(subscriptions.subscriberId, viewerId)))
    .where(isPublic)
    .orderBy(desc(videos.createdAt))
    .limit(60);
}

export async function getHistory(viewerId: string, limit = 100) {
  const db = await getDb();
  const rows = await db
    .select({ ...cardFields, progressSeconds: watchHistory.progressSeconds, watchedAt: watchHistory.watchedAt })
    .from(watchHistory)
    .innerJoin(videos, eq(videos.id, watchHistory.videoId))
    .innerJoin(users, eq(users.id, videos.ownerId))
    .where(eq(watchHistory.userId, viewerId))
    .orderBy(desc(watchHistory.watchedAt))
    .limit(limit);
  return rows;
}

export async function getLiked(viewerId: string) {
  const db = await getDb();
  return db
    .select(cardFields)
    .from(reactions)
    .innerJoin(videos, eq(videos.id, reactions.videoId))
    .innerJoin(users, eq(users.id, videos.ownerId))
    .where(and(eq(reactions.userId, viewerId), eq(reactions.value, 1)))
    .orderBy(desc(reactions.createdAt));
}

export async function getWatchLater(viewerId: string) {
  const db = await getDb();
  return db
    .select(cardFields)
    .from(watchLater)
    .innerJoin(videos, eq(videos.id, watchLater.videoId))
    .innerJoin(users, eq(users.id, videos.ownerId))
    .where(eq(watchLater.userId, viewerId))
    .orderBy(desc(watchLater.addedAt));
}

export async function getPlaylists(ownerId: string, opts: { publicOnly?: boolean; containing?: string } = {}) {
  const db = await getDb();
  return db
    .select({
      id: playlists.id,
      title: playlists.title,
      visibility: playlists.visibility,
      createdAt: playlists.createdAt,
      count: sql<number>`(select count(*)::int from playlist_items pi where pi.playlist_id = "playlists"."id")`,
      cover: sql<string | null>`(select v.youtube_id from playlist_items pi join videos v on v.id = pi.video_id where pi.playlist_id = "playlists"."id" order by pi.position limit 1)`,
      hasVideo: opts.containing
        ? sql<boolean>`exists(select 1 from playlist_items pi where pi.playlist_id = "playlists"."id" and pi.video_id = ${opts.containing})`
        : sql<boolean>`false`,
    })
    .from(playlists)
    .where(and(eq(playlists.ownerId, ownerId), opts.publicOnly ? eq(playlists.visibility, "public") : undefined))
    .orderBy(desc(playlists.createdAt));
}

export async function getPlaylist(id: string, viewerId?: string) {
  const db = await getDb();
  const [row] = await db
    .select({ playlist: playlists, owner: { id: users.id, handle: users.handle, name: users.name, image: users.image } })
    .from(playlists)
    .innerJoin(users, eq(users.id, playlists.ownerId))
    .where(eq(playlists.id, id));
  if (!row) return null;
  if (row.playlist.visibility === "private" && row.owner.id !== viewerId) return null;
  const items = await db
    .select(cardFields)
    .from(playlistItems)
    .innerJoin(videos, eq(videos.id, playlistItems.videoId))
    .innerJoin(users, eq(users.id, videos.ownerId))
    .where(eq(playlistItems.playlistId, id))
    .orderBy(asc(playlistItems.position));
  return { ...row, items };
}

export async function getStudioVideos(ownerId: string) {
  const db = await getDb();
  return db
    .select({
      ...cardFields,
      likes: sql<number>`(select count(*)::int from reactions r where r.video_id = ${videos.id} and r.value = 1)`,
      commentCount: sql<number>`(select count(*)::int from comments c where c.video_id = ${videos.id})`,
    })
    .from(videos)
    .innerJoin(users, eq(users.id, videos.ownerId))
    .where(eq(videos.ownerId, ownerId))
    .orderBy(desc(videos.createdAt));
}

export async function getNotifications(viewerId: string) {
  const db = await getDb();
  return db
    .select({
      id: notifications.id,
      type: notifications.type,
      read: notifications.read,
      createdAt: notifications.createdAt,
      actor: { handle: users.handle, name: users.name, image: users.image },
      video: { id: videos.id, title: videos.title, youtubeId: videos.youtubeId },
    })
    .from(notifications)
    .leftJoin(users, eq(users.id, notifications.actorId))
    .leftJoin(videos, eq(videos.id, notifications.videoId))
    .where(eq(notifications.userId, viewerId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function getUnreadCount(viewerId: string) {
  const db = await getDb();
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, viewerId), eq(notifications.read, false)));
  return n;
}

export async function searchChannels(q: string) {
  const db = await getDb();
  const term = `%${q.trim()}%`;
  return db
    .select({
      id: users.id,
      handle: users.handle,
      name: users.name,
      image: users.image,
      bio: users.bio,
      subscribers: sql<number>`(select count(*)::int from subscriptions s where s.channel_id = "users"."id")`,
    })
    .from(users)
    .where(or(ilike(users.name, term), ilike(users.handle, term)))
    .limit(3);
}

export async function getVideoForEdit(id: string, ownerId: string) {
  const db = await getDb();
  const [video] = await db.select().from(videos).where(and(eq(videos.id, id), eq(videos.ownerId, ownerId)));
  if (!video) return null;
  return { video, snippets: await getSnippets(id) };
}
