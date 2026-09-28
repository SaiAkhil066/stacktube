import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { parseTimestamp } from "@/lib/format";

// Turn "1:23" into a "#t=83" link so <SeekLinks> can jump the player.
function linkTimestamps(text: string) {
  return text.replace(/(^|[\s(])((?:\d{1,2}:)?\d{1,2}:\d{2})(?=$|[\s),.])/gm, (match, pre: string, ts: string) => {
    const seconds = parseTimestamp(ts);
    return seconds == null ? match : `${pre}[${ts}](#t=${seconds})`;
  });
}

export function Markdown({ children, timestamps = false }: { children: string; timestamps?: boolean }) {
  return (
    <div className="prose-dev">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{
          a: ({ href, children }) =>
            href?.startsWith("#") ? (
              <a href={href}>{children}</a>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer nofollow">
                {children}
              </a>
            ),
          h1: ({ children }) => <p className="font-medium">{children}</p>,
          h2: ({ children }) => <p className="font-medium">{children}</p>,
          h3: ({ children }) => <p className="font-medium">{children}</p>,
          img: ({ alt }) => <span>{alt}</span>,
        }}
      >
        {timestamps ? linkTimestamps(children) : children}
      </ReactMarkdown>
    </div>
  );
}
