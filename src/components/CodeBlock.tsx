import CopyButton from "./CopyButton";

/** Tiny JSON tokenizer → colored spans (keys mint, strings lime, numbers sky). */
function highlightJson(code: string) {
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?)|(\btrue\b|\bfalse\b|\bnull\b)/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(code))) {
    if (m.index > last) out.push(<span key={k++} className="text-zinc-400">{code.slice(last, m.index)}</span>);
    if (m[1] !== undefined) {
      out.push(
        <span key={k++} className={m[2] ? "text-sky-neon" : "text-acid"}>
          {m[1]}
        </span>,
      );
      if (m[2]) out.push(<span key={k++} className="text-zinc-500">{m[2]}</span>);
    } else if (m[3] !== undefined) {
      out.push(<span key={k++} className="text-iris">{m[3]}</span>);
    } else if (m[4] !== undefined) {
      out.push(<span key={k++} className="text-rose-neon">{m[4]}</span>);
    }
    last = re.lastIndex;
  }
  if (last < code.length) out.push(<span key={k++} className="text-zinc-400">{code.slice(last)}</span>);
  return out;
}

/** Shell renderer: comment lines zinc-600, everything else readable zinc-200. */
function renderShell(code: string) {
  return code.split("\n").map((line, i) => (
    <div key={i} className={line.trimStart().startsWith("#") ? "text-zinc-600" : "text-zinc-200"}>
      {line}
    </div>
  ));
}

export default function CodeBlock({
  title,
  code,
  lang = "json",
  className = "",
  compact = false,
}: {
  title?: string;
  code: string;
  lang?: "json" | "shell" | "plain";
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={`overflow-hidden rounded-xl border border-white/[0.07] bg-[#08080d] ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.025] px-3.5 py-2">
          <span className="truncate font-mono text-[11px] tracking-wide text-zinc-500">{title}</span>
          <CopyButton text={code} />
        </div>
      )}
      <pre
        className={`overflow-x-auto px-4 font-mono text-[12.5px] leading-relaxed break-words whitespace-pre-wrap ${
          compact ? "py-3" : "py-4"
        }`}
      >
        {lang === "json" ? highlightJson(code) : lang === "shell" ? renderShell(code) : <span className="text-zinc-300">{code}</span>}
      </pre>
    </div>
  );
}
