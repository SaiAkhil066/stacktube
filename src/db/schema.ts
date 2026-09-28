import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// A user is also their channel.
export const users = pgTable(
  "users",
  {
    id: id(),
    githubId: text("github_id"),
    handle: text("handle").notNull(),
    name: text("name").notNull(),
    image: text("image"),
    bio: text("bio"),
    githubUrl: text("github_url"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_handle_idx").on(t.handle), uniqueIndex("users_github_idx").on(t.githubId)],
);

export const videos = pgTable(
  "videos",
  {
    // Short public id used in /watch?v=
    id: text("id").primaryKey(),
    youtubeId: text("youtube_id").notNull(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    topic: text("topic"),
    level: text("level").notNull().default("beginner"),
    tags: text("tags").array().notNull().default([]),
    repoUrl: text("repo_url"),
    // Credit when the video was made by someone else on YouTube.
    originalAuthor: text("original_author"),
    durationSeconds: integer("duration_seconds"),
    isShort: boolean("is_short").notNull().default(false),
    visibility: text("visibility").notNull().default("public"),
    views: integer("views").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("videos_owner_idx").on(t.ownerId), index("videos_topic_idx").on(t.topic)],
);

// Code shown next to the player, highlighted when the video reaches `atSeconds`.
export const snippets = pgTable(
  "snippets",
  {
    id: id(),
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    atSeconds: integer("at_seconds").notNull(),
    title: text("title").notNull(),
    language: text("language").notNull().default("plaintext"),
    code: text("code").notNull(),
  },
  (t) => [index("snippets_video_idx").on(t.videoId)],
);

export const reactions = pgTable(
  "reactions",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    // 1 = like, -1 = dislike
    value: smallint("value").notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.videoId] })],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    subscriberId: text("subscriber_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channelId: text("channel_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.subscriberId, t.channelId] })],
);

export const comments = pgTable(
  "comments",
  {
    id: id(),
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: text("parent_id"),
    body: text("body").notNull(),
    pinned: boolean("pinned").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("comments_video_idx").on(t.videoId), index("comments_parent_idx").on(t.parentId)],
);

export const commentLikes = pgTable(
  "comment_likes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    commentId: text("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.commentId] })],
);

export const watchHistory = pgTable(
  "watch_history",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    progressSeconds: integer("progress_seconds").notNull().default(0),
    watchedAt: timestamp("watched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.videoId] })],
);

export const watchLater = pgTable(
  "watch_later",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.videoId] })],
);

export const playlists = pgTable("playlists", {
  id: id(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  visibility: text("visibility").notNull().default("public"),
  createdAt: createdAt(),
});

export const playlistItems = pgTable(
  "playlist_items",
  {
    playlistId: text("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.playlistId, t.videoId] })],
);

export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => users.id, { onDelete: "cascade" }),
    // "upload" | "comment" | "reply" | "subscribe"
    type: text("type").notNull(),
    videoId: text("video_id").references(() => videos.id, { onDelete: "cascade" }),
    read: boolean("read").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_user_idx").on(t.userId)],
);

export type User = typeof users.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type Snippet = typeof snippets.$inferSelect;
export type Playlist = typeof playlists.$inferSelect;
