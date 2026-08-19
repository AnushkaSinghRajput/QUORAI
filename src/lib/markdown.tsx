import type { ReactNode } from "react";

function formatInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[\d+\])/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    if (/^\[\d+\]$/.test(part)) {
      return (
        <sup
          key={index}
          className="ml-0.5 rounded bg-accent-soft px-1 text-[10px] font-semibold text-accent"
        >
          {part}
        </sup>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

/** Lightweight Markdown renderer for research answers (headings, lists, inline). */
export function renderMarkdownLite(markdown: string): ReactNode[] {
  const lines = markdown.split("\n");
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={`ul-${nodes.length}`}>
        {listItems.map((item, i) => (
          <li key={i}>{formatInline(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  for (const line of lines) {
    if (line.startsWith("## ")) {
      flushList();
      nodes.push(<h2 key={`h2-${nodes.length}`}>{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      flushList();
      nodes.push(<h3 key={`h3-${nodes.length}`}>{line.slice(4)}</h3>);
    } else if (/^[-*]\s+/.test(line)) {
      listItems.push(line.replace(/^[-*]\s+/, ""));
    } else if (/^\d+\.\s+/.test(line)) {
      listItems.push(line.replace(/^\d+\.\s+/, ""));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      nodes.push(<p key={`p-${nodes.length}`}>{formatInline(line)}</p>);
    }
  }

  flushList();
  return nodes;
}

export function stripMarkdown(content: string): string {
  return content
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\n+/g, " ")
    .trim();
}
