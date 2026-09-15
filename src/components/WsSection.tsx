import { ArrowLeftRight, PlugZap } from "lucide-react";
import CodeBlock from "./CodeBlock";
import CopyButton from "./CopyButton";
import SectionHeading from "./SectionHeading";

const ERROR_ROWS: { code: string; when: string }[] = [
  { code: "INVALID_JSON", when: "Frame was not valid JSON" },
  { code: "INVALID_MESSAGE", when: "Payload is not an object with a string type" },
  { code: "UNKNOWN_TYPE", when: 'type is not "join", "message" or "leave"' },
  { code: "MISSING_ROOM_CODE", when: "join sent without roomCode" },
  { code: "MISSING_USERNAME", when: "join sent without username" },
  { code: "USERNAME_TOO_LONG", when: "Username exceeds 24 characters" },
  { code: "ROOM_NOT_FOUND", when: "Room code has not been created (or expired)" },
  { code: "NOT_JOINED", when: "message sent before joining a room" },
  { code: "EMPTY_MESSAGE", when: "message string missing or blank" },
  { code: "MESSAGE_TOO_LONG", when: "Message exceeds 500 characters" },
];

export default function WsSection() {
  return (
    <section className="relative border-t border-white/[0.05] py-24 sm:py-32">
      <div className="absolute -top-10 -left-40 h-[360px] w-[360px] rounded-full bg-acid/[0.05] blur-[120px]" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          id="ws"
          kicker="WebSocket protocol"
          title={
            <>
              Connect once, <span className="text-acid">speak JSON</span>
            </>
          }
          sub="The same server that answers HTTP upgrades your connection to WebSocket. One connection can join a room, chat, leave and join another."
        />

        {/* connection url */}
        <div className="card-glow mb-12 flex flex-col gap-4 rounded-2xl bg-panel p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-acid/25 bg-acid/[0.07]">
              <PlugZap className="h-5 w-5 text-acid" strokeWidth={2.2} />
            </span>
            <div>
              <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                Connection URL
              </p>
              <code className="font-mono text-[15px] font-bold text-acid sm:text-lg">
                wss://&lt;app-name&gt;.onrender.com
              </code>
            </div>
          </div>
          <div className="sm:ml-auto">
            <CopyButton text="wss://<app-name>.onrender.com" />
          </div>
        </div>

        {/* payload grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* client → server */}
          <div className="space-y-5">
            <p className="flex items-center gap-2 font-mono text-[12px] font-semibold tracking-[0.2em] text-sky-neon uppercase">
              <ArrowLeftRight className="h-3.5 w-3.5" /> client → server
            </p>
            <CodeBlock
              title="join a room"
              lang="json"
              code={JSON.stringify({ type: "join", roomCode: "A7X3K9", username: "Alex" }, null, 2)}
            />
            <CodeBlock
              title="send a message"
              lang="json"
              code={JSON.stringify({ type: "message", message: "Hello everyone!" }, null, 2)}
            />
            <CodeBlock
              title="leave the room"
              lang="json"
              code={JSON.stringify({ type: "leave" }, null, 2)}
            />
          </div>

          {/* server → client */}
          <div className="space-y-5">
            <p className="flex items-center gap-2 font-mono text-[12px] font-semibold tracking-[0.2em] text-iris uppercase">
              <ArrowLeftRight className="h-3.5 w-3.5" /> server → client
            </p>
            <CodeBlock
              title="joined — ack sent to the joiner (user list included)"
              lang="json"
              code={JSON.stringify(
                {
                  type: "joined",
                  roomCode: "A7X3K9",
                  username: "Alex",
                  users: ["Alex", "Sam"],
                  activeUsers: 2,
                  timestamp: "2026-01-01T00:00:00.000Z",
                },
                null,
                2,
              )}
            />
            <CodeBlock
              title="message — broadcast to everyone in the room"
              lang="json"
              code={JSON.stringify(
                {
                  type: "message",
                  id: "9d0ca2b6-…",
                  username: "Alex",
                  message: "Hello everyone!",
                  roomCode: "A7X3K9",
                  timestamp: "2026-01-01T00:00:00.000Z",
                },
                null,
                2,
              )}
            />
            <CodeBlock
              title="system — join/leave events for the rest of the room"
              lang="json"
              code={JSON.stringify(
                {
                  type: "system",
                  message: "Sam has joined the room",
                  roomCode: "A7X3K9",
                  timestamp: "2026-01-01T00:00:00.000Z",
                },
                null,
                2,
              )}
            />
            <CodeBlock
              title="error — sent to the offending client only"
              lang="json"
              code={JSON.stringify(
                {
                  type: "error",
                  code: "ROOM_NOT_FOUND",
                  message: 'Room "ZZZZ99" does not exist. Create it first with POST /api/rooms.',
                  timestamp: "2026-01-01T00:00:00.000Z",
                },
                null,
                2,
              )}
            />
          </div>
        </div>

        {/* error table */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-white/[0.07]">
          <table className="w-full text-left font-mono text-[12.5px]">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.03] text-zinc-500">
                <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.18em] uppercase">error code</th>
                <th className="px-5 py-3 text-[11px] font-semibold tracking-[0.18em] uppercase">when it fires</th>
              </tr>
            </thead>
            <tbody>
              {ERROR_ROWS.map((row, i) => (
                <tr
                  key={row.code}
                  className={`border-white/[0.05] transition-colors hover:bg-white/[0.025] ${
                    i !== ERROR_ROWS.length - 1 ? "border-b" : ""
                  }`}
                >
                  <td className="px-5 py-2.5 font-semibold whitespace-nowrap text-rose-neon">{row.code}</td>
                  <td className="px-5 py-2.5 text-zinc-400">{row.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
