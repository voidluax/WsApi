import { ArrowDown, Braces, DatabaseZap, KeyRound, Wifi } from "lucide-react";
import Terminal from "./Terminal";

const STATS = [
  { icon: Braces, label: "one runtime dep", sub: "ws — that's it" },
  { icon: KeyRound, label: "6-char room codes", sub: "e.g. A7X3K9" },
  { icon: DatabaseZap, label: "zero database", sub: "in-memory rooms" },
  { icon: Wifi, label: "process.env.PORT", sub: "Render-ready by default" },
];

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* backdrop */}
      <div className="bg-grid grid-fade absolute inset-0" />
      <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-acid/[0.07] blur-[140px]" />
      <div className="absolute top-40 -right-40 h-[420px] w-[420px] rounded-full bg-iris/[0.09] blur-[130px]" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
          {/* copy */}
          <div className="lg:col-span-6">
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-acid/25 bg-acid/[0.06] py-1.5 pr-4 pl-2">
              <span className="flex items-center gap-1.5 rounded-full bg-acid px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-[#0b0b0e] uppercase">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0b0b0e]" />
                live
              </span>
              <span className="font-mono text-[12px] tracking-wide text-acid">REST + WebSocket · one port · free tier</span>
            </div>

            <h1 className="text-[44px] leading-[0.98] font-bold tracking-tighter text-balance sm:text-[64px] lg:text-[68px]">
              Chat rooms over
              <br />
              WebSocket.
              <br />
              <span className="text-glow-acid bg-gradient-to-r from-acid via-[#d3ff7e] to-acid bg-clip-text text-transparent">
                One file. No DB.
              </span>
            </h1>

            <p className="mt-7 max-w-md text-[15.5px] leading-relaxed text-zinc-400">
              Relay is a dependency-light chat backend: create rooms with a single HTTP POST, chat in
              real time over WebSocket, and deploy it to Render&apos;s free tier with{" "}
              <code className="rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[13px] text-zinc-200">
                node server.js
              </code>
              .
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3.5">
              <a
                href="#deploy"
                className="rounded-xl bg-acid px-6 py-3.5 text-[14px] font-bold text-[#0b0b0e] transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Deploy on Render
              </a>
              <a
                href="#api"
                className="group inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-6 py-3.5 text-[14px] font-semibold text-zinc-200 transition-colors hover:border-white/30 hover:text-white"
              >
                Explore the API
                <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
              </a>
            </div>

            {/* stat row */}
            <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.04] sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="bg-void/90 p-4 backdrop-blur">
                  <s.icon className="mb-2.5 h-4 w-4 text-acid" strokeWidth={2.2} />
                  <p className="font-mono text-[11.5px] font-semibold text-zinc-200">{s.label}</p>
                  <p className="mt-0.5 font-mono text-[10.5px] text-zinc-500">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* terminal */}
          <div className="lg:col-span-6">
            <div className="relative">
              <div className="absolute -inset-6 -z-10 rounded-[28px] bg-gradient-to-br from-acid/[0.09] via-transparent to-iris/[0.12] blur-2xl" />
              <Terminal />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
