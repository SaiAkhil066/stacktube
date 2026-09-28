import { and, eq, inArray, isNull } from "drizzle-orm";
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
  { id: "u_stackunderflow", handle: "stackunderflow", name: "Stack Underflow", bio: "Tech comedy we rewatch instead of fixing bugs." },
  { id: "u_segfault", handle: "segfault", name: "Segfault Studios", bio: "Sketches, shorts and the occasional existential crisis about production." },
];

type SeedVideo = {
  id: string;
  youtubeId: string;
  owner: string;
  title: string;
  author: string;
  category?: "tutorial" | "comedy" | "talk";
  topic?: string;
  level?: "beginner" | "intermediate" | "advanced";
  tags: string[];
  views: number;
  daysAgo: number;
  duration?: number;
  isShort?: boolean;
  description?: string;
  snippets?: { at: number; title: string; language: string; code: string }[];
};

const TUTORIALS: SeedVideo[] = [
  {
    id: "js100s", youtubeId: "DHjqpvDnNGE", owner: "u_bytegarden", title: "JavaScript in 100 Seconds", author: "Fireship",
    topic: "javascript", level: "beginner", tags: ["javascript", "web"], views: 18420, daysAgo: 2, duration: 156,
    description: "The language of the web in under two minutes.\n\nChapters\n0:00 Where JavaScript came from\n0:40 Dynamic typing\n1:10 The event loop",
    snippets: [
      { at: 20, title: "Variables", language: "javascript", code: "let count = 0;\nconst name = 'StackTube';\nvar legacy = true; // avoid var" },
      { at: 60, title: "Functions are values", language: "javascript", code: "const add = (a, b) => a + b;\n\nfunction run(fn) {\n  return fn(2, 3);\n}\n\nrun(add); // 5" },
      { at: 95, title: "The event loop", language: "javascript", code: "console.log('first');\nsetTimeout(() => console.log('third'), 0);\nconsole.log('second');" },
    ],
  },
  {
    id: "ts100s", youtubeId: "zQnBQ4tB3ZA", owner: "u_bytegarden", title: "TypeScript in 100 Seconds", author: "Fireship",
    topic: "typescript", level: "beginner", tags: ["typescript", "types"], views: 12011, daysAgo: 4, duration: 145,
    snippets: [
      { at: 30, title: "Type annotations", language: "typescript", code: "let port: number = 3000;\nlet host: string = 'localhost';" },
      { at: 70, title: "Interfaces", language: "typescript", code: "interface Video {\n  id: string;\n  title: string;\n  views?: number;\n}\n\nconst v: Video = { id: 'ts100s', title: 'TS' };" },
    ],
  },
  {
    id: "react100s", youtubeId: "Tn6-PIqc4UM", owner: "u_bytegarden", title: "React in 100 Seconds", author: "Fireship",
    topic: "react", level: "beginner", tags: ["react", "frontend"], views: 22950, daysAgo: 6, duration: 128,
    snippets: [
      { at: 35, title: "A component", language: "tsx", code: "function Hello({ name }: { name: string }) {\n  return <h1>Hello, {name}</h1>;\n}" },
      { at: 65, title: "State with useState", language: "tsx", code: "const [count, setCount] = useState(0);\n\nreturn (\n  <button onClick={() => setCount(count + 1)}>\n    Clicked {count} times\n  </button>\n);" },
    ],
  },
  {
    id: "rust100s", youtubeId: "5C_HPTJg5ek", owner: "u_bytegarden", title: "Rust in 100 Seconds", author: "Fireship",
    topic: "rust", level: "intermediate", tags: ["rust", "systems"], views: 15877, daysAgo: 9, duration: 149,
    snippets: [
      { at: 45, title: "Ownership", language: "rust", code: "let a = String::from(\"hi\");\nlet b = a;        // a is moved\n// println!(\"{a}\"); // compile error" },
      { at: 75, title: "Borrowing", language: "rust", code: "fn len(s: &String) -> usize {\n    s.len()\n}\n\nlet s = String::from(\"borrow me\");\nlet n = len(&s); // s is still usable" },
    ],
  },
  {
    id: "go100s", youtubeId: "446E-r0rXHI", owner: "u_bytegarden", title: "Go in 100 Seconds", author: "Fireship",
    topic: "go", level: "beginner", tags: ["go", "backend"], views: 9120, daysAgo: 11, duration: 150,
    snippets: [{ at: 60, title: "Goroutines", language: "go", code: "go func() {\n    fmt.Println(\"running concurrently\")\n}()" }],
  },
  {
    id: "py100s", youtubeId: "x7X9w_GIm1s", owner: "u_bytegarden", title: "Python in 100 Seconds", author: "Fireship",
    topic: "python", level: "beginner", tags: ["python"], views: 20533, daysAgo: 13, duration: 144,
    snippets: [{ at: 50, title: "List comprehension", language: "python", code: "squares = [n * n for n in range(10) if n % 2 == 0]\nprint(squares)  # [0, 4, 16, 36, 64]" }],
  },
  {
    id: "git100s", youtubeId: "hwP7WQkmECE", owner: "u_deployfriday", title: "Git Explained in 100 Seconds", author: "Fireship",
    topic: "git", level: "beginner", tags: ["git", "tooling"], views: 11204, daysAgo: 3, duration: 117,
    snippets: [{ at: 40, title: "Everyday commands", language: "bash", code: "git init\ngit add .\ngit commit -m \"first commit\"\ngit switch -c feature/player" }],
  },
  {
    id: "docker100s", youtubeId: "Gjnup-PuquQ", owner: "u_deployfriday", title: "Docker in 100 Seconds", author: "Fireship",
    topic: "docker", level: "intermediate", tags: ["docker", "devops"], views: 14390, daysAgo: 5, duration: 127,
    snippets: [
      { at: 50, title: "A Dockerfile", language: "dockerfile", code: "FROM node:22-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nCMD [\"npm\", \"start\"]" },
      { at: 85, title: "Build and run", language: "bash", code: "docker build -t stacktube .\ndocker run -p 3000:3000 stacktube" },
    ],
  },
  {
    id: "k8s100s", youtubeId: "PziYflu8cB8", owner: "u_deployfriday", title: "Kubernetes Explained in 100 Seconds", author: "Fireship",
    topic: "kubernetes", level: "advanced", tags: ["kubernetes", "devops"], views: 8804, daysAgo: 8, duration: 127,
    snippets: [
      {
        at: 60, title: "A Deployment", language: "yaml",
        code: "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web\nspec:\n  replicas: 3\n  selector:\n    matchLabels: { app: web }\n  template:\n    metadata:\n      labels: { app: web }\n    spec:\n      containers:\n        - name: web\n          image: stacktube:latest",
      },
    ],
  },
  {
    id: "linux100s", youtubeId: "rrB13utjYV4", owner: "u_deployfriday", title: "Linux in 100 Seconds", author: "Fireship",
    topic: "linux", level: "beginner", tags: ["linux", "shell"], views: 10032, daysAgo: 15, duration: 162,
  },
  {
    id: "sql100s", youtubeId: "zsjvFFKOm3c", owner: "u_bytegarden", title: "SQL Explained in 100 Seconds", author: "Fireship",
    topic: "sql", level: "beginner", tags: ["sql", "databases"], views: 9760, daysAgo: 17, duration: 143,
    snippets: [
      { at: 55, title: "Join two tables", language: "sql", code: "SELECT v.title, u.name\nFROM videos v\nJOIN users u ON u.id = v.owner_id\nWHERE v.views > 1000\nORDER BY v.views DESC;" },
    ],
  },
  {
    id: "next100s", youtubeId: "Sklc_fQBmcs", owner: "u_bytegarden", title: "Next.js in 100 Seconds, plus a beginner tutorial", author: "Fireship",
    topic: "nextjs", level: "intermediate", tags: ["nextjs", "react"], views: 13555, daysAgo: 20, duration: 712,
  },
  {
    id: "js100concepts", youtubeId: "lkIFF4maKMU", owner: "u_bytegarden", title: "100+ JavaScript Concepts you Need to Know", author: "Fireship",
    topic: "javascript", level: "intermediate", tags: ["javascript"], views: 31002, daysAgo: 25, duration: 744,
  },
  {
    id: "pycourse", youtubeId: "rfscVS0vtbw", owner: "u_nullpointer", title: "Learn Python: Full Course for Beginners", author: "freeCodeCamp.org",
    topic: "python", level: "beginner", tags: ["python", "course"], views: 44120, daysAgo: 30, duration: 16012,
  },
  {
    id: "jscourse", youtubeId: "PkZNo7MFNFg", owner: "u_nullpointer", title: "Learn JavaScript: Full Course for Beginners", author: "freeCodeCamp.org",
    topic: "javascript", level: "beginner", tags: ["javascript", "course"], views: 38110, daysAgo: 34, duration: 12403,
  },
  {
    id: "tscourse", youtubeId: "30LWjhZzg50", owner: "u_nullpointer", title: "Learn TypeScript: Full Tutorial", author: "freeCodeCamp.org",
    topic: "typescript", level: "intermediate", tags: ["typescript", "course"], views: 17340, daysAgo: 40, duration: 17185,
  },
  {
    id: "cppcourse", youtubeId: "vLnPwxZdW4Y", owner: "u_nullpointer", title: "C++ Tutorial for Beginners: Full Course", author: "freeCodeCamp.org",
    topic: "cpp", level: "beginner", tags: ["cpp", "course"], views: 27015, daysAgo: 45, duration: 14479,
  },
  {
    id: "nextcourse", youtubeId: "1WmNXEVia8I", owner: "u_nullpointer", title: "Next.js for Beginners: Full Course", author: "freeCodeCamp.org",
    topic: "nextjs", level: "beginner", tags: ["nextjs", "course"], views: 12099, daysAgo: 12, duration: 9505,
  },
  {
    id: "gitcourse", youtubeId: "RGOj5yH7evk", owner: "u_deployfriday", title: "Git and GitHub for Beginners: Crash Course", author: "freeCodeCamp.org",
    topic: "git", level: "beginner", tags: ["git", "github", "course"], views: 21870, daysAgo: 50, duration: 4110,
  },
  {
    id: "sqlcourse", youtubeId: "HXV3zeQKqGY", owner: "u_nullpointer", title: "SQL Tutorial: Full Database Course for Beginners", author: "freeCodeCamp.org",
    topic: "sql", level: "beginner", tags: ["sql", "course"], views: 19450, daysAgo: 55, duration: 15639,
  },
  {
    id: "reactmosh", youtubeId: "SqcY0GlETPk", owner: "u_nullpointer", title: "React Tutorial for Beginners", author: "Programming with Mosh",
    topic: "react", level: "beginner", tags: ["react", "course"], views: 16230, daysAgo: 18, duration: 4804,
  },
  {
    id: "reactcourse", youtubeId: "bMknfKXIFA8", owner: "u_nullpointer", title: "React Course: Beginner's Tutorial", author: "freeCodeCamp.org",
    topic: "react", level: "beginner", tags: ["react", "course"], views: 14002, daysAgo: 60, duration: 42928,
  },
];

const FUN: SeedVideo[] = [
  { id: "microservices", youtubeId: "y8OnoxKotPQ", owner: "u_stackunderflow", title: "Microservices", author: "KRAZAM", category: "comedy", tags: ["microservices", "architecture", "comedy"], views: 48210, daysAgo: 1, duration: 189 },
  { id: "theexpert", youtubeId: "BKorP55Aqvg", owner: "u_segfault", title: "The Expert (Short Comedy Sketch)", author: "Lauris Beinerts", category: "comedy", tags: ["meetings", "comedy"], views: 61730, daysAgo: 2, duration: 455 },
  { id: "seniorjs", youtubeId: "Uo3cL4nrGOk", owner: "u_stackunderflow", title: "Interview with Senior JS Developer", author: "Kai Lentit", category: "comedy", topic: "javascript", tags: ["javascript", "interview", "comedy"], views: 35980, daysAgo: 3, duration: 328 },
  { id: "progsanime", youtubeId: "pKO9UjSeLew", owner: "u_segfault", title: "If Programming Was An Anime", author: "Joma Tech", category: "comedy", tags: ["anime", "comedy"], views: 52340, daysAgo: 4, duration: 206 },
  { id: "websitedown", youtubeId: "uRGljemfwUE", owner: "u_stackunderflow", title: "The Website is Down #1: Sales Guy vs. Web Dude", author: "Josh Weinberg", category: "comedy", tags: ["sysadmin", "comedy"], views: 27115, daysAgo: 5, duration: 624 },
  { id: "seniorrust", youtubeId: "TGfQu0bQTKc", owner: "u_stackunderflow", title: "Interview with Senior Rust Developer", author: "Kai Lentit", category: "comedy", topic: "rust", tags: ["rust", "interview", "comedy"], views: 30112, daysAgo: 7, duration: 586 },
  { id: "hackerman", youtubeId: "KEkrWRHCDQU", owner: "u_segfault", title: "Hackerman's Hacking Tutorials: How To Hack Time", author: "LaserUnicorns", category: "comedy", tags: ["hacking", "80s", "comedy"], views: 24870, daysAgo: 8, duration: 225 },
  { id: "deliveredvalue", youtubeId: "DYvhC_RdIwQ", owner: "u_stackunderflow", title: "I Have Delivered Value... But At What Cost?", author: "KRAZAM", category: "comedy", tags: ["agile", "comedy"], views: 19640, daysAgo: 9, duration: 169 },
  { id: "dayinlife", youtubeId: "Rgx8dpiPwpA", owner: "u_segfault", title: "A day in the life of an engineer working from home", author: "Joma Tech", category: "comedy", tags: ["remote", "comedy"], views: 44800, daysAgo: 10, duration: 472 },
  { id: "twoidiots", youtubeId: "u8qgehH3kEQ", owner: "u_segfault", title: "NCIS: 2 idiots, 1 keyboard", author: "Ricardo Figueiredo", category: "comedy", tags: ["hacking", "tv", "comedy"], views: 39020, daysAgo: 11, duration: 51 },
  { id: "seniorpy", youtubeId: "BgxklT94W0I", owner: "u_stackunderflow", title: "Interview with a Senior Python Developer, Part 1", author: "Kai Lentit", category: "comedy", topic: "python", tags: ["python", "interview", "comedy"], views: 21400, daysAgo: 14, duration: 297 },
  { id: "expertit", youtubeId: "ZOzzRlc_qho", owner: "u_segfault", title: "The Expert: IT Support (Short Comedy Sketch)", author: "Lauris Beinerts", category: "comedy", tags: ["it-support", "comedy"], views: 17330, daysAgo: 16, duration: 232 },
  { id: "progsanime2", youtubeId: "OTfp2_SwxHk", owner: "u_segfault", title: "If Programming Was An Anime 2", author: "Joma Tech", category: "comedy", tags: ["anime", "comedy"], views: 28960, daysAgo: 19, duration: 365 },
  { id: "leadershipsync", youtubeId: "1RAMRukKqQg", owner: "u_stackunderflow", title: "Leadership Sync", author: "KRAZAM", category: "comedy", tags: ["meetings", "comedy"], views: 15225, daysAgo: 21, duration: 135 },
  { id: "thinkvsis", youtubeId: "HluANRwPyNo", owner: "u_segfault", title: "What people think programming is vs. how it actually is", author: "Jombo", category: "comedy", tags: ["comedy"], views: 57110, daysAgo: 23, duration: 30 },
  { id: "artofcode", youtubeId: "6avJHaC3C2U", owner: "u_deployfriday", title: "The Art of Code", author: "NDC Conferences (Dylan Beattie)", category: "talk", tags: ["talk", "creative-coding"], views: 22480, daysAgo: 27, duration: 3649 },
];

const SHORTS: SeedVideo[] = [
  { id: "sh_runsco", youtubeId: "rk8wnnhuSDw", owner: "u_stackunderflow", title: "The engineer that secretly runs your company", author: "Kai Lentit", tags: ["shorts"], views: 88100, daysAgo: 1 },
  { id: "sh_juniorsenior", youtubeId: "BWV6Iq3m4q0", owner: "u_segfault", title: "Junior developer vs senior software engineer", author: "Sean Aslam", tags: ["shorts"], views: 120400, daysAgo: 2 },
  { id: "sh_meeting", youtubeId: "ZMYPdClFvA8", owner: "u_stackunderflow", title: "That one guy in tech meetings", author: "Kai Lentit", tags: ["shorts"], views: 64200, daysAgo: 3 },
  { id: "sh_anime", youtubeId: "qDEOEDevM-w", owner: "u_segfault", title: "If programming was an anime", author: "Joma Clips", tags: ["shorts"], views: 41800, daysAgo: 4 },
  { id: "sh_2am", youtubeId: "ydHF3Z0oLos", owner: "u_stackunderflow", title: "That engineer at 2am...", author: "Kai Lentit", tags: ["shorts"], views: 37500, daysAgo: 5 },
  { id: "sh_python", youtubeId: "T4VodZe3ISQ", owner: "u_segfault", title: "Wait for Python's turn", author: "Vast Coding", tags: ["shorts", "python"], views: 29900, daysAgo: 6 },
  { id: "sh_ditl", youtubeId: "xebh-RK3GAg", owner: "u_stackunderflow", title: "Day in the life videos are back", author: "Kai Lentit", tags: ["shorts"], views: 25300, daysAgo: 8 },
].map((s) => ({ ...s, category: "comedy" as const, isShort: true }));

const ALL = [...TUTORIALS, ...FUN, ...SHORTS];

const COMMENTS: { video: string; user: string; body: string }[] = [
  { video: "js100s", user: "u_nullpointer", body: "The event loop part finally clicked for me. Quick demo:\n\n```js\nPromise.resolve().then(() => console.log('microtask'));\nsetTimeout(() => console.log('macrotask'));\n```\n\nMicrotasks always run first." },
  { video: "js100s", user: "u_deployfriday", body: "Worth adding: `typeof null === 'object'` is a 30-year-old bug we all live with." },
  { video: "rust100s", user: "u_bytegarden", body: "If the borrow checker yells at you, it's usually right. Try `cargo clippy` too." },
  { video: "docker100s", user: "u_nullpointer", body: "Use multi-stage builds to keep images small:\n\n```dockerfile\nFROM node:22 AS build\nRUN npm ci && npm run build\n\nFROM node:22-alpine\nCOPY --from=build /app/.next ./.next\n```" },
  { video: "microservices", user: "u_deployfriday", body: "Sent this to my whole team after someone asked why fetching a user's birthday takes 11 services." },
  { video: "microservices", user: "u_bytegarden", body: "Galactus is real and he's in our architecture diagram." },
  { video: "theexpert", user: "u_nullpointer", body: "Seven red lines, all strictly perpendicular, some with green ink. Still more realistic than our last sprint planning." },
  { video: "seniorrust", user: "u_segfault", body: "\"Have you tried rewriting it in Rust?\" is now my answer to every standup question." },
  { video: "seniorjs", user: "u_bytegarden", body: "The part at 1:30 is every `node_modules` folder I've ever opened." },
  { video: "twoidiots", user: "u_deployfriday", body: "Two people typing on one keyboard to stop a hack is my new incident response plan." },
];

// Safe to run repeatedly: adds missing channels and videos, and fills in
// durations that are still unknown. Existing rows are left alone.
export async function seed(db: DB) {
  const now = Date.now();
  await db.insert(schema.users).values(CHANNELS).onConflictDoNothing();

  const inserted = await db
    .insert(schema.videos)
    .values(
      ALL.map((v) => ({
        id: v.id,
        youtubeId: v.youtubeId,
        ownerId: v.owner,
        title: v.title,
        description:
          v.description ??
          (v.category === "comedy"
            ? `Originally published on YouTube by ${v.author}. Shared here because we all need a break from debugging.`
            : `Originally published on YouTube by ${v.author}.`),
        topic: v.topic ?? null,
        category: v.category ?? "tutorial",
        level: v.level ?? "beginner",
        tags: v.tags,
        originalAuthor: v.author,
        durationSeconds: v.duration ?? null,
        isShort: v.isShort ?? false,
        views: v.views,
        createdAt: new Date(now - v.daysAgo * 86_400_000),
      })),
    )
    .onConflictDoNothing()
    .returning({ id: schema.videos.id });
  const fresh = new Set(inserted.map((r) => r.id));

  const newSnippets = ALL.filter((v) => fresh.has(v.id)).flatMap((v) =>
    (v.snippets ?? []).map((s) => ({ videoId: v.id, atSeconds: s.at, title: s.title, language: s.language, code: s.code })),
  );
  if (newSnippets.length) await db.insert(schema.snippets).values(newSnippets);

  const newComments = COMMENTS.filter((c) => fresh.has(c.video)).map((c) => ({ videoId: c.video, userId: c.user, body: c.body }));
  if (newComments.length) await db.insert(schema.comments).values(newComments);

  for (const v of ALL) {
    if (!v.duration || fresh.has(v.id)) continue;
    await db
      .update(schema.videos)
      .set({ durationSeconds: v.duration })
      .where(and(eq(schema.videos.id, v.id), isNull(schema.videos.durationSeconds)));
  }

  const channelIds = CHANNELS.map((c) => c.id);
  const existing = await db.select({ id: schema.users.id }).from(schema.users).where(inArray(schema.users.id, channelIds));
  if (existing.length === channelIds.length) {
    await db
      .insert(schema.subscriptions)
      .values([
        { subscriberId: "u_demo", channelId: "u_bytegarden" },
        { subscriberId: "u_demo", channelId: "u_deployfriday" },
        { subscriberId: "u_demo", channelId: "u_stackunderflow" },
        { subscriberId: "u_nullpointer", channelId: "u_bytegarden" },
        { subscriberId: "u_bytegarden", channelId: "u_stackunderflow" },
        { subscriberId: "u_deployfriday", channelId: "u_segfault" },
      ])
      .onConflictDoNothing();
  }
  return { added: fresh.size };
}
