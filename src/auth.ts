import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

declare module "next-auth" {
  interface Session {
    user: { id: string; handle: string } & DefaultSession["user"];
  }
}

export const githubConfigured = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);

// Until a GitHub OAuth app is set up, local dev offers a one-click demo account.
export const demoLoginEnabled = !githubConfigured && process.env.NODE_ENV !== "production";

type GitHubProfile = { id: number | string; login: string; name?: string | null; avatar_url?: string; html_url?: string; bio?: string | null };

async function upsertGitHubUser(profile: GitHubProfile) {
  const db = await getDb();
  const githubId = String(profile.id);
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.githubId, githubId));
  if (existing) {
    await db
      .update(schema.users)
      .set({ image: profile.avatar_url ?? existing.image, githubUrl: profile.html_url ?? existing.githubUrl })
      .where(eq(schema.users.id, existing.id));
    return existing;
  }

  // GitHub logins are unique, but a seeded channel could already hold the handle.
  let handle = profile.login.toLowerCase();
  const [taken] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.handle, handle));
  if (taken) handle = `${handle}-${githubId.slice(-4)}`;

  const [created] = await db
    .insert(schema.users)
    .values({
      githubId,
      handle,
      name: profile.name || profile.login,
      image: profile.avatar_url,
      bio: profile.bio ?? null,
      githubUrl: profile.html_url,
    })
    .returning();
  return created;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    GitHub,
    ...(demoLoginEnabled
      ? [
          Credentials({
            id: "demo",
            name: "Demo developer",
            credentials: {},
            authorize: async () => ({ id: "u_demo", name: "Demo Developer" }),
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "github" && profile) {
        const row = await upsertGitHubUser(profile as unknown as GitHubProfile);
        token.uid = row.id;
        token.handle = row.handle;
        token.name = row.name;
        token.picture = row.image;
      } else if (account?.provider === "demo" && user?.id) {
        token.uid = user.id;
        token.handle = "demo";
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.uid === "string") {
        session.user.id = token.uid;
        session.user.handle = typeof token.handle === "string" ? token.handle : "";
      }
      return session;
    },
  },
});
