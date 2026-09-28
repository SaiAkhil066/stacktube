"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { lookupYouTube, saveVideo, type VideoInput } from "@/lib/actions";
import { LEVELS, SNIPPET_LANGUAGES, TOPICS } from "@/lib/config";
import { formatDuration, parseTimestamp } from "@/lib/format";
import { parseYouTubeUrl, thumbnailUrl } from "@/lib/youtube";

type SnippetDraft = { key: string; at: string; title: string; language: string; code: string };

export type VideoFormInitial = {
  id?: string;
  url: string;
  title: string;
  description: string;
  topic: string | null;
  level: string;
  tags: string[];
  repoUrl: string | null;
  originalAuthor: string | null;
  visibility: string;
  snippets: { atSeconds: number; title: string; language: string; code: string }[];
};

const field = "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent";
const label = "mb-1.5 block text-sm font-medium";

let keySeq = 0;
const newKey = () => `s${++keySeq}`;

export function VideoForm({ initial }: { initial?: VideoFormInitial }) {
  const router = useRouter();
  const editing = Boolean(initial?.id);
  const [url, setUrl] = useState(initial?.url ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [level, setLevel] = useState(initial?.level ?? "beginner");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [repoUrl, setRepoUrl] = useState(initial?.repoUrl ?? "");
  const [originalAuthor, setOriginalAuthor] = useState(initial?.originalAuthor ?? "");
  const [visibility, setVisibility] = useState(initial?.visibility ?? "public");
  const [snippets, setSnippets] = useState<SnippetDraft[]>(
    initial?.snippets.map((s) => ({ key: newKey(), at: formatDuration(s.atSeconds) ?? "0:00", title: s.title, language: s.language, code: s.code })) ?? [],
  );
  const [lookupNote, setLookupNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [looking, startLookup] = useTransition();
  const [saving, startSave] = useTransition();

  const parsed = parseYouTubeUrl(url);

  function lookup() {
    setError(null);
    startLookup(async () => {
      const res = await lookupYouTube(url);
      if (!res.ok) return setError(res.error);
      const d = res.data!;
      if (!title) setTitle(d.title);
      setLookupNote(`Found "${d.title}" by ${d.author}${d.isShort ? " (a Short)" : ""}.`);
      if (!originalAuthor) setOriginalAuthor(d.author);
    });
  }

  function updateSnippet(key: string, patch: Partial<SnippetDraft>) {
    setSnippets((all) => all.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  function move(index: number, dir: -1 | 1) {
    setSnippets((all) => {
      const next = [...all];
      const [item] = next.splice(index, 1);
      next.splice(index + dir, 0, item);
      return next;
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const snippetInput: VideoInput["snippets"] = [];
    for (const [i, s] of snippets.entries()) {
      const at = parseTimestamp(s.at);
      if (at == null) return setError(`Snippet ${i + 1}: use a time like 1:05 or 1:02:03.`);
      snippetInput.push({ atSeconds: at, title: s.title, language: s.language as VideoInput["snippets"][number]["language"], code: s.code });
    }
    const input: VideoInput = {
      url,
      title,
      description,
      topic: topic || null,
      level: level as VideoInput["level"],
      tags: tags
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean),
      repoUrl: repoUrl.trim() || null,
      originalAuthor: originalAuthor.trim() || null,
      visibility: visibility as VideoInput["visibility"],
      snippets: snippetInput.sort((a, b) => a.atSeconds - b.atSeconds),
    };
    startSave(async () => {
      const res = await saveVideo(input, initial?.id);
      if (!res.ok) return setError(res.error);
      router.push(`/watch?v=${res.data!.id}`);
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <div>
          <label htmlFor="url" className={label}>
            YouTube link
          </label>
          <div className="flex gap-2">
            <input
              id="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setLookupNote(null);
              }}
              onBlur={() => parsed && !title && lookup()}
              placeholder="https://www.youtube.com/watch?v=..."
              className={field}
              required
            />
            <button
              type="button"
              onClick={lookup}
              disabled={!url || looking}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-surface-2 px-4 text-sm font-semibold hover:bg-line disabled:opacity-50"
            >
              {looking && <Loader2 className="size-4 animate-spin" />}
              Fetch details
            </button>
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {lookupNote ?? "Videos play from YouTube, so hosting is free. Shorts links work too."}
          </p>
        </div>

        <div>
          <label htmlFor="title" className={label}>
            Title
          </label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} className={field} required />
          <p className="mt-1 text-right text-xs text-muted">{title.length}/150</p>
        </div>

        <div>
          <label htmlFor="description" className={label}>
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            maxLength={10000}
            className={`${field} font-mono text-[13px] leading-relaxed`}
            placeholder={"What will viewers learn?\n\nChapters\n0:00 Intro\n1:30 Setting up the project"}
          />
          <p className="mt-1.5 text-xs text-muted">
            Markdown works. Lines starting with timestamps (first one at 0:00) become chapters.
          </p>
        </div>

        <section aria-labelledby="snippets-heading" className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="snippets-heading" className="font-semibold">
                Code snippets
              </h2>
              <p className="mt-1 text-sm text-muted">
                Each snippet lights up beside the player when the video reaches its time, so viewers can copy it.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSnippets((all) => [...all, { key: newKey(), at: "0:00", title: "", language: "javascript", code: "" }])}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-sm font-semibold hover:bg-line"
            >
              <Plus className="size-4" />
              Add snippet
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {snippets.map((s, i) => (
              <fieldset key={s.key} className="rounded-lg border border-line bg-bg p-3">
                <legend className="sr-only">Snippet {i + 1}</legend>
                <div className="flex flex-wrap gap-2">
                  <input
                    aria-label="Time"
                    value={s.at}
                    onChange={(e) => updateSnippet(s.key, { at: e.target.value })}
                    className={`${field} w-20 font-mono`}
                    placeholder="1:05"
                  />
                  <input
                    aria-label="Snippet title"
                    value={s.title}
                    onChange={(e) => updateSnippet(s.key, { title: e.target.value })}
                    className={`${field} min-w-40 flex-1`}
                    placeholder="What this code does"
                    maxLength={120}
                  />
                  <select
                    aria-label="Language"
                    value={s.language}
                    onChange={(e) => updateSnippet(s.key, { language: e.target.value })}
                    className={`${field} w-36`}
                  >
                    {SNIPPET_LANGUAGES.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                  <div className="flex">
                    <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-2 hover:bg-surface-2 disabled:opacity-30" aria-label="Move up">
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={i === snippets.length - 1}
                      onClick={() => move(i, 1)}
                      className="rounded p-2 hover:bg-surface-2 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSnippets((all) => all.filter((x) => x.key !== s.key))}
                      className="rounded p-2 text-muted hover:bg-surface-2 hover:text-danger"
                      aria-label="Remove snippet"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                <textarea
                  aria-label="Code"
                  value={s.code}
                  onChange={(e) => updateSnippet(s.key, { code: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key !== "Tab") return;
                    e.preventDefault();
                    const el = e.currentTarget;
                    const { selectionStart: a, selectionEnd: b } = el;
                    updateSnippet(s.key, { code: s.code.slice(0, a) + "  " + s.code.slice(b) });
                    requestAnimationFrame(() => el.setSelectionRange(a + 2, a + 2));
                  }}
                  rows={5}
                  spellCheck={false}
                  className={`${field} mt-2 bg-code font-mono text-[13px] leading-relaxed`}
                  placeholder="// paste the code shown at this moment"
                />
              </fieldset>
            ))}
            {snippets.length === 0 && <p className="text-sm text-muted">No snippets yet. They&apos;re optional, but they&apos;re what makes a video useful here.</p>}
          </div>
        </section>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-2">
          {parsed ? (
            <Image src={thumbnailUrl(parsed.youtubeId)} alt="Thumbnail preview" fill sizes="320px" className="object-cover" />
          ) : (
            <p className="grid h-full place-items-center px-6 text-center text-sm text-muted">The thumbnail shows up when the link is valid.</p>
          )}
        </div>

        <div>
          <label htmlFor="visibility" className={label}>
            Visibility
          </label>
          <select id="visibility" value={visibility} onChange={(e) => setVisibility(e.target.value)} className={field}>
            <option value="public">Public: anyone can find it</option>
            <option value="unlisted">Unlisted: anyone with the link</option>
            <option value="private">Private: only you</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="topic" className={label}>
              Stack
            </label>
            <select id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} className={field}>
              <option value="">Other</option>
              {TOPICS.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="level" className={label}>
              Level
            </label>
            <select id="level" value={level} onChange={(e) => setLevel(e.target.value)} className={`${field} capitalize`}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="tags" className={label}>
            Tags
          </label>
          <input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} className={field} placeholder="hooks, state, beginner" />
          <p className="mt-1 text-xs text-muted">Separate with commas.</p>
        </div>

        <div>
          <label htmlFor="repo" className={label}>
            Source code repository
          </label>
          <input id="repo" type="url" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} className={field} placeholder="https://github.com/you/project" />
        </div>

        <div>
          <label htmlFor="author" className={label}>
            Original creator
          </label>
          <input id="author" value={originalAuthor} onChange={(e) => setOriginalAuthor(e.target.value)} className={field} placeholder="Leave empty if you made it" />
          <p className="mt-1 text-xs text-muted">Credited on the watch page when you share someone else&apos;s video.</p>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        )}
        <button
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-fg hover:bg-accent-hover disabled:opacity-50"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {editing ? "Save changes" : "Publish"}
        </button>
      </aside>
    </form>
  );
}
