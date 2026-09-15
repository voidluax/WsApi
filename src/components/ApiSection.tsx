import CodeBlock from "./CodeBlock";
import SectionHeading from "./SectionHeading";

function MethodBadge({ method, tone }: { method: string; tone: "post" | "get" }) {
  const styles =
    tone === "post"
      ? "border-acid/30 bg-acid/10 text-acid"
      : "border-iris/30 bg-iris/10 text-iris";
  return (
    <span
      className={`inline-flex min-w-[64px] items-center justify-center rounded-md border px-2.5 py-1 font-mono text-[12px] font-bold tracking-wider ${styles}`}
    >
      {method}
    </span>
  );
}

function StatusChips({ codes }: { codes: { code: string; tone: "ok" | "err" | "create" }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {codes.map((c) => (
        <span
          key={c.code}
          className={`rounded-md border px-2 py-1 font-mono text-[11px] font-semibold ${
            c.tone === "create"
              ? "border-acid/30 bg-acid/[0.08] text-acid"
              : c.tone === "ok"
                ? "border-white/15 bg-white/[0.04] text-zinc-300"
                : "border-rose-neon/30 bg-rose-neon/[0.07] text-rose-neon"
          }`}
        >
          {c.code}
        </span>
      ))}
    </div>
  );
}

const ENDPOINTS = [
  {
    method: "POST" as const,
    tone: "post" as const,
    path: "/api/rooms",
    title: "Create a room",
    desc: "Generates a unique 6-character room code (e.g. A7X3K9). No body required. Share the code and others can join over WebSocket.",
    statuses: [
      { code: "201 Created", tone: "create" as const },
      { code: "400 Bad Request", tone: "err" as const },
    ],
    requestTitle: "create-room.sh",
    requestCode: `curl -X POST https://<app-name>.onrender.com/api/rooms`,
    responseTitle: "201 — response",
    responseCode: JSON.stringify(
      {
        roomCode: "A7X3K9",
        createdAt: "2026-01-01T00:00:00.000Z",
        join: 'Connect via WebSocket and send {"type":"join", ...}',
      },
      null,
      2,
    ),
  },
  {
    method: "GET" as const,
    tone: "get" as const,
    path: "/api/rooms",
    title: "List active rooms",
    desc: "Returns every room currently held in memory, with live user counts and usernames. Rooms vanish when their last user disconnects.",
    statuses: [{ code: "200 OK", tone: "ok" as const }],
    requestTitle: "list-rooms.sh",
    requestCode: `curl https://<app-name>.onrender.com/api/rooms`,
    responseTitle: "200 — response",
    responseCode: JSON.stringify(
      {
        totalRooms: 1,
        rooms: [
          {
            roomCode: "A7X3K9",
            activeUsers: 2,
            users: ["Alex", "Sam"],
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      },
      null,
      2,
    ),
  },
  {
    method: "GET" as const,
    tone: "get" as const,
    path: "/api/rooms/:code",
    title: "Room details",
    desc: "Info about one room: active user count, usernames, creation time. Codes are case-insensitive. Unknown or expired codes return 404.",
    statuses: [
      { code: "200 OK", tone: "ok" as const },
      { code: "404 Not Found", tone: "err" as const },
    ],
    requestTitle: "room-info.sh",
    requestCode: `curl https://<app-name>.onrender.com/api/rooms/A7X3K9`,
    responseTitle: "200 — and the 404 shape",
    responseCode: JSON.stringify(
      { roomCode: "A7X3K9", activeUsers: 2, users: ["Alex", "Sam"], createdAt: "…" },
      null,
      2,
    ),
    extraTitle: "404 — response",
    extraCode: JSON.stringify(
      { error: "ROOM_NOT_FOUND", message: 'Room "ZZZZ99" does not exist or has expired.' },
      null,
      2,
    ),
  },
];

export default function ApiSection() {
  return (
    <section className="relative border-t border-white/[0.05] py-24 sm:py-32">
      <div className="absolute top-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-iris/[0.05] blur-[120px]" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          id="api"
          kicker="REST API"
          title={
            <>
              Three endpoints. <span className="text-iris">Rooms on demand.</span>
            </>
          }
          sub="Room management happens over plain HTTP with JSON in and out — create a room, list rooms, or inspect one. CORS is open (*), so browser clients work too."
        />

        <div className="space-y-6">
          {ENDPOINTS.map((e) => (
            <article
              key={e.title}
              className="overflow-hidden rounded-2xl border border-white/[0.07] bg-panel transition-colors hover:border-white/[0.13]"
            >
              <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-5 py-4 sm:px-6">
                <MethodBadge method={e.method} tone={e.tone} />
                <code className="font-mono text-[14px] font-semibold text-zinc-100">{e.path}</code>
                <span className="text-[13px] text-zinc-500">— {e.title}</span>
                <div className="ml-auto">
                  <StatusChips codes={e.statuses} />
                </div>
              </div>
              <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
                <p className="text-[13.5px] leading-relaxed text-zinc-400 lg:col-span-2">{e.desc}</p>
                <CodeBlock title={e.requestTitle} lang="shell" code={e.requestCode} compact />
                <CodeBlock title={e.responseTitle} lang="json" code={e.responseCode} compact />
                {e.extraCode && (
                  <CodeBlock title={e.extraTitle} lang="json" code={e.extraCode} compact className="lg:col-start-2" />
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
