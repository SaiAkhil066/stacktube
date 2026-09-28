import { clsx, type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export function formatCount(n: number) {
  return compact.format(n);
}

export function formatViews(n: number) {
  return `${formatCount(n)} ${n === 1 ? "view" : "views"}`;
}

export function formatDuration(total: number | null | undefined) {
  if (total == null) return null;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

// "1:05" / "01:02:03" → seconds. Returns null for anything else.
export function parseTimestamp(value: string): number | null {
  const parts = value.trim().split(":");
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !/^\d{1,2}$/.test(p))) return null;
  return parts.reduce((acc, p) => acc * 60 + Number(p), 0);
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

export function timeAgo(date: Date | string) {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

export type Chapter = { at: number; title: string };

// YouTube-style chapters: lines starting with a timestamp, the first at 0:00.
export function parseChapters(description: string): Chapter[] {
  const chapters: Chapter[] = [];
  for (const line of description.split("\n")) {
    const m = line.match(/^\s*\(?((?:\d{1,2}:)?\d{1,2}:\d{2})\)?\s+[-–:]?\s*(.+)$/);
    if (!m) continue;
    const at = parseTimestamp(m[1]);
    if (at != null) chapters.push({ at, title: m[2].trim() });
  }
  return chapters.length >= 2 && chapters[0].at === 0 ? chapters : [];
}
