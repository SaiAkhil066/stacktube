import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;

// Demo channels are fictional curators. Every video is a real YouTube upload,
// credited to its original creator via `originalAuthor`.
const CHANNELS = [
  { id: "u_demo", handle: "demo", name: "Demo Developer", bio: "The account you use when signing in locally without GitHub." },
  { id: "u_bytegarden", handle: "bytegarden", name: "Byte Garden", bio: "Short, dense explainers. One concept per video." },
  { id: "u_nullpointer", handle: "nullpointer", name: "Null Pointer Club", bio: "Full-length courses for when you have a weekend." },
  { id: "u_deployfriday", handle: "deployfriday", name: "Deploy Friday", bio: "Infra, containers and shipping to production." },
];

type SeedVideo = {
  id: string;
  youtubeId: string;
  owner: string;
  title: string;
  author: string;
  topic: string;
  level: "beginner" | "intermediate" | "advanced";
  tags: string[];
  views: number;
  daysAgo: number;
  description?: string;
  repoUrl?: string;
  snippets?: { at: number; title: string; language: string; code: string }[];
};

const VIDEOS: SeedVideo[] = [
  {
    id: "js100s", youtubeId: "DHjqpvDnNGE", owner: "u_bytegarden", title: "JavaScript in 100 Seconds", author: "Fireship",
    topic: "javascript", level: "beginner", tags: ["javascript", "web"], views: 18420, daysAgo: 2,
    description: "The language of the web in under two minutes.\n\nChapters\n0:00 Where JavaScript came from\n0:40 Dynamic typing\n1:10 The event loop",
    snippets: [
      { at: 20, title: "Variables", language: "javascript", code: "let count = 0;\nconst name = 'StackTube';\nvar legacy = true; // avoid var" },
      { at: 60, title: "Functions are values", language: "javascript", code: "const add = (a, b) => a + b;\n\nfunction run(fn) {\n  return fn(2, 3);\n}\n\nrun(add); // 5" },
      { at: 95, title: "The event loop", language: "javascript", code: "console.log('first');\nsetTimeout(() => console.log('third'), 0);\nconsole.log('second');" },
    ],
  },
  {
    id: "ts100s", youtubeId: "zQnBQ4tB3ZA", owner: "u_bytegarden", title: "TypeScript in 100 Seconds", author: "Fireship",
    topic: "typescript", level: "beginner", tags: ["typescript", "types"], views: 12011, daysAgo: 4,
    snippets: [
      { at: 30, title: "Type annotations", language: "typescript", code: "let port: number = 3000;\nlet host: string = 'localhost';" },
      { at: 70, title: "Interfaces", language: "typescript", code: "interface Video {\n  id: string;\n  title: string;\n  views?: number;\n}\n\nconst v: Video = { id: 'ts100s', title: 'TS' };" },
    ],
  },
  {
    id: "react100s", youtubeId: "Tn6-PIqc4UM", owner: "u_bytegarden", title: "React in 100 Seconds", author: "Fireship",
    topic: "react", level: "beginner", tags: ["react", "frontend"], views: 22950, daysAgo: 6,
    snippets: [
      { at: 35, title: "A component", language: "tsx", code: "function Hello({ name }: { name: string }) {\n  return <h1>Hello, {name}</h1>;\n}" },
      { at: 65, title: "State with useState", language: "tsx", code: "const [count, setCount] = useState(0);\n\nreturn (\n  <button onClick={() => setCount(count + 1)}>\n    Clicked {count} times\n  </button>\n);" },
    ],
  },
  {
    id: "rust100s", youtubeId: "5C_HPTJg5ek", owner: "u_bytegarden", title: "Rust in 100 Seconds", author: "Fireship",
    topic: "rust", level: "intermediate", tags: ["rust", "systems"], views: 15877, daysAgo: 9,
    snippets: [
      { at: 45, title: "Ownership", language: "rust", code: "let a = String::from(\"hi\");\nlet b = a;        // a is moved\n// println!(\"{a}\"); // compile error" },
      { at: 75, title: "Borrowing", language: "rust", code: "fn len(s: &String) -> usize {\n    s.len()\n}\n\nlet s = String::from(\"borrow me\");\nlet n = len(&s); // s is still usable" },
    ],
  },
  {
    id: "go100s", youtubeId: "446E-r0rXHI", owner: "u_bytegarden", title: "Go in 100 Seconds", author: "Fireship",
    topic: "go", level: "beginner", tags: ["go", "backend"], views: 9120, daysAgo: 11,
    snippets: [
      { at: 60, title: "Goroutines", language: "go", code: "go func() {\n    fmt.Println(\"running concurrently\")\n}()" },
    ],
  },
  {
    id: "py100s", youtubeId: "x7X9w_GIm1s", owner: "u_bytegarden", title: "Python in 100 Seconds", author: "Fireship",
    topic: "python", level: "beginner", tags: ["python"], views: 20533, daysAgo: 13,
    snippets: [
      { at: 50, title: "List comprehension", language: "python", code: "squares = [n * n for n in range(10) if n % 2 == 0]\nprint(squares)  # [0, 4, 16, 36, 64]" },
    ],
  },
  {
    id: "git100s", youtubeId: "hwP7WQkmECE", owner: "u_deployfriday", title: "Git Explained in 100 Seconds", author: "Fireship",
    topic: "git", level: "beginner", tags: ["git", "tooling"], views: 11204, daysAgo: 3,
    snippets: [
      { at: 40, title: "Everyday commands", language: "bash", code: "git init\ngit add .\ngit commit -m \"first commit\"\ngit switch -c feature/player" },
    ],
  },
  {
    id: "docker100s", youtubeId: "Gjnup-PuquQ", owner: "u_deployfriday", title: "Docker in 100 Seconds", author: "Fireship",
    topic: "docker", level: "intermediate", tags: ["docker", "devops"], views: 14390, daysAgo: 5,
    snippets: [
      { at: 50, title: "A Dockerfile", language: "dockerfile", code: "FROM node:22-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nCMD [\"npm\", \"start\"]" },
      { at: 85, title: "Build and run", language: "bash", code: "docker build -t stacktube .\ndocker run -p 3000:3000 stacktube" },
    ],
  },
  {
    id: "k8s100s", youtubeId: "PziYflu8cB8", owner: "u_deployfriday", title: "Kubernetes Explained in 100 Seconds", author: "Fireship",
    topic: "kubernetes", level: "advanced", tags: ["kubernetes", "devops"], views: 8804, daysAgo: 8,
    snippets: [
      { at: 60, title: "A Deployment", language: "yaml", code: "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web\nspec:\n  replicas: 3\n  selector:\n    matchLabels: { app: web }\n  template:\n    metadata:\n      labels: { app: web }\n    spec:\n      containers:\n        - name: web\n          image: stacktube:latest" },
    ],
  },
  {
    id: "linux100s", youtubeId: "rrB13utjYV4", owner: "u_deployfriday", title: "Linux in 100 Seconds", author: "Fireship",
    topic: "linux", level: "beginner", tags: ["linux", "shell"], views: 10032, daysAgo: 15,
  },
  {
    id: "sql100s", youtubeId: "zsjvFFKOm3c", owner: "u_bytegarden", title: "SQL Explained in 100 Seconds", author: "Fireship",
    topic: "sql", level: "beginner", tags: ["sql", "databases"], views: 9760, daysAgo: 17,
    snippets: [
      { at: 55, title: "Join two tables", language: "sql", code: "SELECT v.title, u.name\nFROM videos v\nJOIN users u ON u.id = v.owner_id\nWHERE v.views > 1000\nORDER BY v.views DESC;" },
    ],
  },
  {
    id: "next100s", youtubeId: "Sklc_fQBmcs", owner: "u_bytegarden", title: "Next.js in 100 Seconds, plus a beginner tutorial", author: "Fireship",
    topic: "nextjs", level: "intermediate", tags: ["nextjs", "react"], views: 13555, daysAgo: 20,
  },
  {
    id: "js100concepts", youtubeId: "lkIFF4maKMU", owner: "u_bytegarden", title: "100+ JavaScript Concepts you Need to Know", author: "Fireship",
    topic: "javascript", level: "intermediate", tags: ["javascript"], views: 31002, daysAgo: 25,
  },
  {
    id: "pycourse", youtubeId: "rfscVS0vtbw", owner: "u_nullpointer", title: "Learn Python: Full Course for Beginners", author: "freeCodeCamp.org",
    topic: "python", level: "beginner", tags: ["python", "course"], views: 44120, daysAgo: 30,
  },
  {
    id: "jscourse", youtubeId: "PkZNo7MFNFg", owner: "u_nullpointer", title: "Learn JavaScript: Full Course for Beginners", author: "freeCodeCamp.org",
    topic: "javascript", level: "beginner", tags: ["javascript", "course"], views: 38110, daysAgo: 34,
  },
  {
    id: "tscourse", youtubeId: "30LWjhZzg50", owner: "u_nullpointer", title: "Learn TypeScript: Full Tutorial", author: "freeCodeCamp.org",
    topic: "typescript", level: "intermediate", tags: ["typescript", "course"], views: 17340, daysAgo: 40,
  },
  {
    id: "cppcourse", youtubeId: "vLnPwxZdW4Y", owner: "u_nullpointer", title: "C++ Tutorial for Beginners: Full Course", author: "freeCodeCamp.org",
    topic: "cpp", level: "beginner", tags: ["cpp", "course"], views: 27015, daysAgo: 45,
  },
  {
    id: "nextcourse", youtubeId: "1WmNXEVia8I", owner: "u_nullpointer", title: "Next.js for Beginners: Full Course", author: "freeCodeCamp.org",
    topic: "nextjs", level: "beginner", tags: ["nextjs", "course"], views: 12099, daysAgo: 12,
  },
  {
    id: "gitcourse", youtubeId: "RGOj5yH7evk", owner: "u_deployfriday", title: "Git and GitHub for Beginners: Crash Course", author: "freeCodeCamp.org",
    topic: "git", level: "beginner", tags: ["git", "github", "course"], views: 21870, daysAgo: 50,
  },
  {
    id: "sqlcourse", youtubeId: "HXV3zeQKqGY", owner: "u_nullpointer", title: "SQL Tutorial: Full Database Course for Beginners", author: "freeCodeCamp.org",
    topic: "sql", level: "beginner", tags: ["sql", "course"], views: 19450, daysAgo: 55,
  },
  {
    id: "reactmosh", youtubeId: "SqcY0GlETPk", owner: "u_nullpointer", title: "React Tutorial for Beginners", author: "Programming with Mosh",
    topic: "react", level: "beginner", tags: ["react", "course"], views: 16230, daysAgo: 18,
  },
  {
    id: "reactcourse", youtubeId: "bMknfKXIFA8", owner: "u_nullpointer", title: "React Course: Beginner's Tutorial", author: "freeCodeCamp.org",
    topic: "react", level: "beginner", tags: ["react", "course"], views: 14002, daysAgo: 60,
  },
];

const COMMENTS: { video: string; user: string; body: string }[] = [
  { video: "js100s", user: "u_nullpointer", body: "The event loop part finally clicked for me. Quick demo:\n\n```js\nPromise.resolve().then(() => console.log('microtask'));\nsetTimeout(() => console.log('macrotask'));\n```\n\nMicrotasks always run first." },
  { video: "js100s", user: "u_deployfriday", body: "Worth adding: `typeof null === 'object'` is a 30-year-old bug we all live with." },
  { video: "rust100s", user: "u_bytegarden", body: "If the borrow checker yells at you, it's usually right. Try `cargo clippy` too." },
  { video: "docker100s", user: "u_nullpointer", body: "Use multi-stage builds to keep images small:\n\n```dockerfile\nFROM node:22 AS build\nRUN npm ci && npm run build\n\nFROM node:22-alpine\nCOPY --from=build /app/.next ./.next\n```" },
];

export async function seed(db: DB) {
  const now = Date.now();
  await db.insert(schema.users).values(CHANNELS).onConflictDoNothing();

  for (const v of VIDEOS) {
    const description =
      v.description ?? `Originally published on YouTube by ${v.author}. Curated here for the ${v.topic} track.`;
    await db
      .insert(schema.videos)
      .values({
        id: v.id,
        youtubeId: v.youtubeId,
        ownerId: v.owner,
        title: v.title,
        description,
        topic: v.topic,
        level: v.level,
        tags: v.tags,
        originalAuthor: v.author,
        views: v.views,
        createdAt: new Date(now - v.daysAgo * 86_400_000),
      })
      .onConflictDoNothing();
    if (v.snippets?.length) {
      await db
        .insert(schema.snippets)
        .values(v.snippets.map((s) => ({ videoId: v.id, atSeconds: s.at, title: s.title, language: s.language, code: s.code })));
    }
  }

  await db.insert(schema.comments).values(COMMENTS.map((c) => ({ videoId: c.video, userId: c.user, body: c.body })));
  await db
    .insert(schema.subscriptions)
    .values([
      { subscriberId: "u_demo", channelId: "u_bytegarden" },
      { subscriberId: "u_demo", channelId: "u_deployfriday" },
      { subscriberId: "u_nullpointer", channelId: "u_bytegarden" },
    ])
    .onConflictDoNothing();
}

export async function seedIfEmpty(db: DB) {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.videos);
  if (count === 0) await seed(db);
}
