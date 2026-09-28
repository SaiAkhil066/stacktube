// Rename the whole app from here.
export const APP_NAME = "StackTube";
export const APP_TAGLINE = "Video for people who ship code";
export const GITHUB_REPO = "https://github.com/SaiAkhil066/stacktube";

// What kind of video it is. Shown as the first chips on the home page.
export const CATEGORIES = [
  { slug: "comedy", label: "Funny" },
  { slug: "tutorial", label: "Tutorials" },
  { slug: "talk", label: "Talks" },
] as const;
export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function categoryBySlug(slug: string | null | undefined) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type Level = (typeof LEVELS)[number];

// Topics shown as filter chips. `color` follows the language's usual brand colour.
export const TOPICS = [
  { slug: "javascript", label: "JavaScript", color: "#F7DF1E" },
  { slug: "typescript", label: "TypeScript", color: "#3178C6" },
  { slug: "react", label: "React", color: "#61DAFB" },
  { slug: "nextjs", label: "Next.js", color: "#A1A1AA" },
  { slug: "python", label: "Python", color: "#4B8BBE" },
  { slug: "rust", label: "Rust", color: "#DEA584" },
  { slug: "go", label: "Go", color: "#00ADD8" },
  { slug: "cpp", label: "C++", color: "#F34B7D" },
  { slug: "sql", label: "SQL", color: "#E38C00" },
  { slug: "docker", label: "Docker", color: "#2496ED" },
  { slug: "kubernetes", label: "Kubernetes", color: "#326CE5" },
  { slug: "linux", label: "Linux", color: "#FCC624" },
  { slug: "git", label: "Git", color: "#F05032" },
] as const;

export type TopicSlug = (typeof TOPICS)[number]["slug"];

export function topicBySlug(slug: string | null | undefined) {
  return TOPICS.find((t) => t.slug === slug);
}

// Languages offered for code snippets (highlight.js names).
export const SNIPPET_LANGUAGES = [
  "javascript",
  "typescript",
  "tsx",
  "python",
  "rust",
  "go",
  "cpp",
  "sql",
  "bash",
  "dockerfile",
  "yaml",
  "json",
  "plaintext",
] as const;
