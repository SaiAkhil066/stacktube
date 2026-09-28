<p align="center">
  <img src="brand/stacktube-logo-dark.svg" alt="StackTube" width="300">
</p>

<p align="center">A YouTube-style video platform for developers, where the code in a video sits beside the player and lights up at the second it appears.</p>

---

StackTube is a learning project. Videos stream from YouTube (so hosting is free), and everything around them is built here: channels, subscriptions, comments, playlists, history, search, a studio for publishing, and a few features made for programmers.

## What's different from YouTube

- **Code panel synced to the video.** Creators attach snippets at timestamps. While you watch, the current snippet is highlighted like the active line in an editor, and one click copies it.
- **Comments speak Markdown.** Fenced code blocks are syntax-highlighted, and timestamps like `1:23` jump the player.
- **Browse by stack and level.** Filter by language or tool (Rust, React, Docker...) and by beginner, intermediate or advanced.
- **Source code link** on every video that has a repository.
- **Chapters** from `0:00 Title` lines in the description, shown as a segmented timeline under the player.
- **Press `/`** anywhere to search.

## Everything else you'd expect

Home feed, watch page with up next, likes and dislikes, subscribe, subscriptions feed, trending, channel pages (`/@handle`) with videos, playlists and about tabs, watch history with resume, Watch later, liked videos, playlists (public or private), notifications, Shorts, a studio to publish, edit and delete videos, and dark and light themes.

## Tech stack

| Part | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | Postgres with Drizzle ORM. Locally: PGlite (Postgres in WASM, zero setup) |
| Auth | Auth.js with GitHub OAuth |
| Video | YouTube IFrame Player API (privacy-enhanced `youtube-nocookie.com`) |

## Run it locally

Requires Node.js 22+ and pnpm.

```bash
pnpm install
cp .env.example .env.local
npx auth secret            # writes AUTH_SECRET into .env.local
pnpm dev
```

Open http://localhost:3000. With no `DATABASE_URL`, the app creates a local database in `.data/`, migrates it and seeds demo channels and videos. Without GitHub credentials, the sign-in page offers a local-only demo account.

To start over with fresh demo data, stop the dev server and delete `.data/`.

## Set up GitHub sign-in

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Homepage URL: `http://localhost:3000`
3. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy the Client ID and a new client secret into `.env.local`:

```bash
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
```

For production, create a second OAuth app with your deployed URL, since each GitHub OAuth app allows one callback URL.

## Use a hosted database

Set `DATABASE_URL` to any Postgres connection string (for example a free Neon database), then:

```bash
pnpm db:migrate   # create tables
pnpm db:seed      # optional demo data
```

`pnpm build` runs migrations automatically, so deploys stay in sync.

## Deploy to Vercel

Import the repository in Vercel and set `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` and `DATABASE_URL` as environment variables. The demo account is disabled in production.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Migrate the database (if `DATABASE_URL` is set) and build |
| `pnpm typecheck` | Type-check the project |
| `pnpm lint` | Lint |
| `pnpm db:generate` | Create a migration after changing `src/db/schema.ts` |
| `pnpm db:migrate` / `pnpm db:seed` | Apply migrations / add demo data to `DATABASE_URL` |
| `pnpm db:studio` | Browse the database in Drizzle Studio |

## Project layout

```
src/
  app/                 routes (watch, results, channel, feed/*, playlist, shorts, studio, signin)
  components/          UI (shell, video cards, watch page pieces, studio form)
  db/                  schema, client (Postgres or PGlite), seed data
  lib/                 queries, server actions, config, formatting, YouTube helpers
  auth.ts              Auth.js config
drizzle/               SQL migrations
brand/                 logo files
```

To rename the app, change `APP_NAME` in `src/lib/config.ts`.

## Credits

Demo videos are public YouTube uploads by Fireship, freeCodeCamp.org and Programming with Mosh, embedded with credit to their creators. The demo channels that list them are fictional.
