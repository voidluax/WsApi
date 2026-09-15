"use client";

import { useEffect, useMemo, useState } from "react";

type Line = {
  kind: "cmd" | "send" | "recv" | "note";
  text: string;
};

const SCRIPT: Line[] = [
  { kind: "cmd", text: "wscat -c wss://relay-chat.onrender.com" },
  { kind: "note", text: "connected — waiting to join" },
  { kind: "send", text: '{"type":"join","roomCode":"A7X3K9","username":"Alex"}' },
  { kind: "recv", text: '{"type":"joined","roomCode":"A7X3K9","username":"Alex","activeUsers":1}' },
  { kind: "recv", text: '{"type":"system","message":"Sam has joined the room"}' },
  { kind: "send", text: '{"type":"message","message":"ship it."}' },
  { kind: "recv", text: '{"type":"message","username":"Alex","message":"ship it.","roomCode":"A7X3K9","timestamp":"2026-01-01T00:00:00.000Z"}' },
  { kind: "recv", text: '{"type":"system","message":"Sam has left the room"}' },
];

function colorFor(kind: Line["kind"]) {
  switch (kind) {
    case "cmd":
      return "text-sky-neon";
    case "send":
      return "text-acid";
    case "recv":
      return "text-zinc-300";
    case "note":
      return "text-zinc-500 italic";
  }
}

function prefixFor(kind: Line["kind"]) {
  switch (kind) {
    case "cmd":
      return { sym: "$", cls: "text-zinc-500" };
    case "send":
      return { sym: "›", cls: "text-acid" };
    case "recv":
      return { sym: "‹", cls: "text-iris" };
    case "note":
      return { sym: "#", cls: "text-zinc-600" };
  }
}

export default function Terminal() {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [run, setRun] = useState(0);

  const visible = useMemo(() => {
    const done = SCRIPT.slice(0, lineIdx);
    const current = SCRIPT[lineIdx];
    return { done, current, typed: current ? current.text.slice(0, charIdx) : "" };
  }, [lineIdx, charIdx]);

  useEffect(() => {
    if (lineIdx >= SCRIPT.length) {
      const restart = setTimeout(() => {
        setLineIdx(0);
        setCharIdx(0);
        setRun((r) => r + 1);
      }, 3200);
      return () => clearTimeout(restart);
    }
    const line = SCRIPT[lineIdx];
    const instant = line.kind === "recv" || line.kind === "note";
    if (instant) {
      const t = setTimeout(() => setLineIdx((i) => i + 1), 420);
      return () => clearTimeout(t);
    }
    if (charIdx < line.text.length) {
      const t = setTimeout(() => setCharIdx((c) => c + 1), charIdx === 0 ? 500 : 22);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setLineIdx((i) => i + 1);
      setCharIdx(0);
    }, 380);
    return () => clearTimeout(t);
  }, [lineIdx, charIdx, run]);

  return (
    <div className="terminal-shadow overflow-hidden rounded-2xl bg-panel font-mono text-[12.5px] leading-relaxed sm:text-[13px]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-panel-2 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-rose-neon/80" />
        <span className="h-3 w-3 rounded-full bg-[#ffd479]/80" />
        <span className="h-3 w-3 rounded-full bg-acid/80" />
        <span className="ml-3 text-[11px] tracking-wide text-zinc-500">wscat — realtime chat session</span>
        <span className="ml-auto flex items-center gap-1.5 rounded-full border border-acid/25 bg-acid/[0.07] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-acid">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-acid" />
          live
        </span>
      </div>
      <div className="min-h-[318px] px-4 py-4 sm:min-h-[340px]">
        {visible.done.map((l, i) => {
          const p = prefixFor(l.kind);
          return (
            <p key={`${run}-${i}`} className={`animate-fade-up break-all whitespace-pre-wrap ${colorFor(l.kind)}`}>
              <span className={`mr-2 select-none font-bold ${p.cls}`}>{p.sym}</span>
              {l.text}
            </p>
          );
        })}
        {visible.current && (
          <p className={`break-all whitespace-pre-wrap ${colorFor(visible.current.kind)}`}>
            <span className={`mr-2 select-none font-bold ${prefixFor(visible.current.kind).cls}`}>
              {prefixFor(visible.current.kind).sym}
            </span>
            {visible.typed}
            <span className="animate-blink text-zinc-100">▍</span>
          </p>
        )}
        {!visible.current && (
          <p className="text-zinc-500">
            <span className="animate-blink">▍</span>
          </p>
        )}
      </div>
    </div>
  );
}
