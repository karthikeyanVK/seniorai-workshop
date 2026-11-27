"use client";
import { memo, useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const CITE_RE = /\[(S\d+(?:\s*[,;]\s*S\d+)*)\]/g;

/** [S1] / [S1, S2] -> markdown links with a #cite- target, rendered as clickable chips below. */
export const linkCitations = (t: string): string =>
  t.replace(CITE_RE, (_m, g: string) =>
    g.split(/[,;]\s*/).map((id) => `[${id.trim()}](#cite-${id.trim()})`).join(" "),
  );

function Markdown({ text, onCite }: { text: string; onCite?: (id: string) => void }) {
  const components = useMemo<Components>(
    () => ({
      a({ href, children }) {
        if (href?.startsWith("#cite-")) {
          const id = href.slice("#cite-".length);
          return (
            <button
              type="button"
              onClick={() => onCite?.(id)}
              aria-label={`Show source ${id}`}
              className="mx-0.5 inline-flex h-[1.4em] min-w-[1.7em] items-center justify-center rounded-md bg-indigo-100 px-1 align-baseline text-[0.7em] font-semibold text-indigo-700 transition-colors hover:bg-indigo-200 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30"
            >
              {id}
            </button>
          );
        }
        return (
          <a href={href} target="_blank" rel="noreferrer noopener">
            {children}
          </a>
        );
      },
      
      table: ({ children }) => (
        <div className="overflow-x-auto">
          <table>{children}</table>
        </div>
      ),
    }),
    [onCite],
  );
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {linkCitations(text)}
      </ReactMarkdown>
    </div>
  );
}

export default memo(Markdown);
