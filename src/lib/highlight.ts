import "server-only";
import hljs from "highlight.js/lib/common";
import dockerfile from "highlight.js/lib/languages/dockerfile";

hljs.registerLanguage("dockerfile", dockerfile);

const ALIASES: Record<string, string> = { tsx: "typescript", jsx: "javascript" };

// Returns safe HTML (highlight.js escapes the source).
export function highlight(code: string, language: string) {
  const lang = ALIASES[language] ?? language;
  if (hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value;
  return hljs.highlightAuto(code).value;
}
