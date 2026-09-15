import { KeyRound, RefreshCw, Repeat2, UserCheck } from "lucide-react";
import SectionHeading from "./SectionHeading";

const RULES = [
  {
    icon: KeyRound,
    title: "Username required",
    text: "A join without a username is refused with a MISSING_USERNAME error frame. Usernames are trimmed and capped at 24 characters.",
  },
  {
    icon: UserCheck,
    title: "Scoped per room",
    text: "Names only exist inside the room you joined. 'Alex' in room A7X3K9 and 'Alex' in room K2P9QW are completely independent.",
  },
  {
    icon: Repeat2,
    title: "Duplicates never rejected",
    text: "By design, a taken username never blocks a join — the connection always gets in. Clients are tracked by a unique internal id, not by name, so rejoining with the same name always works.",
  },
  {
    icon: RefreshCw,
    title: "Freed on disconnect",
    text: "The moment a socket closes — quit, drop, or heartbeat timeout — the username is released and can be reused immediately. When the last user leaves, the whole room is recycled.",
  },
];

export default function RulesSection() {
  return (
    <section className="relative border-t border-white/[0.05] py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          id="rules"
          kicker="Username rules"
          title={
            <>
              Names are <span className="text-acid">borrowed</span>, never owned
            </>
          }
          sub="No accounts, no passwords, no persistence. A username is a lightweight presence token that lives exactly as long as its WebSocket connection."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {RULES.map((r, i) => (
            <div
              key={r.title}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-panel p-6 transition-colors hover:border-acid/25"
            >
              <span className="absolute -top-3 right-4 font-display text-[64px] font-bold text-white/[0.04] select-none">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="mb-4 grid h-10 w-10 place-items-center rounded-xl border border-acid/25 bg-acid/[0.07]">
                <r.icon className="h-5 w-5 text-acid" strokeWidth={2.2} />
              </span>
              <h3 className="mb-2 text-[16px] font-bold tracking-tight">{r.title}</h3>
              <p className="text-[13.5px] leading-relaxed text-zinc-400">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
