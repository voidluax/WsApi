"use client";

import { useState } from "react";
import { ListTree, Loader2, Play, RotateCcw } from "lucide-react";

type Entry = { label: string; json: string };

export default function LiveDemo() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState<"create" | "list" | null>(null);
  const [code, setCode] = useState<string | null>(null);

  async function call(label: string, promise: Promise<Response>, mode: "create" | "list") {
    setBusy(mode);
    try {
      const res = await promise;
      const body = await res.json();
      if (mode === "create" && body.roomCode) setCode(body.roomCode);
      setEntries((e) => [
        { label: `${label} → ${res.status}`, json: JSON.stringify(body, null, 2) },
        ...e,
      ]);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-panel p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          disabled={busy !== null}
          onClick={() => call("POST /api/rooms", fetch("/api/rooms", { method: "POST" }), "create")}
          className="inline-flex items-center gap-2 rounded-lg bg-acid px-4 py-2 text-[13px] font-semibold text-[#0b0b0e] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        >
          {busy === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Create a room
        </button>
        <button
          disabled={busy !== null}
          onClick={() => call("GET /api/rooms", fetch("/api/rooms"), "list")}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-[13px] font-semibold text-zinc-200 transition-colors hover:bg-white/[0.08] disabled:opacity-50"
        >
          {busy === "list" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListTree className="h-4 w-4" />}
          List rooms
        </button>
        {entries.length > 0 && (
          <button
            onClick={() => {
              setEntries([]);
              setCode(null);
            }}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-mono text-[11px] text-zinc-500 transition-colors hover:text-zinc-200"
          >
            <RotateCcw className="h-3.5 w-3.5" /> reset
          </button>
        )}
      </div>

      <div className="mt-4 min-h-[190px] rounded-xl border border-white/[0.06] bg-[#08080d] p-4 font-mono text-[12.5px] leading-relaxed">
        {entries.length === 0 ? (
          <p className="text-zinc-500">
            <span className="mr-2 select-none text-zinc-600">#</span>
            this panel calls the real REST API running in this preview.
            <br />
            <span className="mr-2 select-none text-zinc-600">#</span>
            create a room, read the code, then join it over WebSocket from wscat.
          </p>
        ) : (
          entries.map((e, i) => (
            <div key={i} className="mb-4 animate-fade-up">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-acid">{e.label}</p>
              <pre className="overflow-x-auto whitespace-pre-wrap break-all text-zinc-300">{e.json}</pre>
            </div>
          ))
        )}
      </div>

      {code && (
        <p className="mt-3 font-mono text-[12px] text-zinc-400">
          <span className="text-zinc-600">$</span> wscat -c wss://&lt;app-name&gt;.onrender.com{" "}
          <span className="text-zinc-600"># then join with</span>{" "}
          <span className="text-acid">{`{"type":"join","roomCode":"${code}","username":"you"}`}</span>
        </p>
      )}
    </div>
  );
}
