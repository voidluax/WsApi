import CodeBlock from "./CodeBlock";
import SectionHeading from "./SectionHeading";

const STEPS = [
  {
    title: "Create a room",
    note: "One POST. You get back a unique 6-char code.",
    title2: "terminal",
    lang: "shell" as const,
    code: `curl -X POST https://relay-chat.onrender.com/api/rooms

# {"roomCode":"A7X3K9", ...}`,
  },
  {
    title: "Share the code",
    note: "A7X3K9 is the only secret. Anyone with it can join.",
    title2: "room.json",
    lang: "json" as const,
    code: `{ "roomCode": "A7X3K9" }`,
  },
  {
    title: "Connect over WebSocket",
    note: "wscat, Postman, or any WebSocket client.",
    title2: "terminal",
    lang: "shell" as const,
    code: `wscat -c wss://relay-chat.onrender.com
# connected (press CTRL+C to quit)`,
  },
  {
    title: "Join with a username",
    note: "First frame you send. The ack echoes the roster.",
    title2: "→ join",
    lang: "json" as const,
    code: `{ "type": "join", "roomCode": "A7X3K9", "username": "Alex" }
# ← {"type":"joined","users":["Alex","Sam"],...}
# ← {"type":"system","message":"Sam has joined the room"}`,
  },
  {
    title: "Chat",
    note: "Messages are broadcast to the room, sender included.",
    title2: "→ message",
    lang: "json" as const,
    code: `{ "type": "message", "message": "Hello room!" }
# ← {"type":"message","username":"Alex",
#    "message":"Hello room!","roomCode":"A7X3K9", ...}`,
  },
];

export default function FlowSection() {
  return (
    <section className="relative border-t border-white/[0.05] py-24 sm:py-32">
      <div className="absolute top-20 -right-40 h-[380px] w-[380px] rounded-full bg-iris/[0.06] blur-[120px]" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          id="flow"
          kicker="Usage flow"
          title={
            <>
              Zero to chatting in <span className="text-acid">five steps</span>
            </>
          }
          sub="The complete happy path, exactly as you'd run it from a terminal."
        />

        <ol className="relative space-y-10 before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-px before:bg-gradient-to-b before:from-acid/50 before:via-white/10 before:to-transparent sm:before:left-[23px]">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative grid gap-4 pl-14 sm:pl-[72px] lg:grid-cols-2 lg:gap-10">
              <span className="absolute top-0 left-0 grid h-10 w-10 place-items-center rounded-full border border-acid/40 bg-void font-mono text-[13px] font-bold text-acid sm:h-12 sm:w-12">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="pt-1.5">
                <h3 className="text-xl font-bold tracking-tight">{s.title}</h3>
                <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-zinc-400">{s.note}</p>
              </div>
              <CodeBlock title={s.title2} lang={s.lang} code={s.code} compact />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
