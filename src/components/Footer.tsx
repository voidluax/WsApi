import { RadioTower } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-5 sm:px-8 md:flex-row md:items-center">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-acid text-[#0b0b0e]">
            <RadioTower className="h-4.5 w-4.5" strokeWidth={2.4} />
          </span>
          <div>
            <p className="text-[14px] font-bold tracking-tight">
              relay<span className="text-zinc-500">.chat</span>
            </p>
            <p className="font-mono text-[11px] text-zinc-500">REST + WebSocket · in-memory rooms</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-7 gap-y-2 font-mono text-[12px] text-zinc-500">
          <span>build: npm install</span>
          <span>start: node server.js</span>
          <span className="text-acid">made for render free tier</span>
        </div>
      </div>
    </footer>
  );
}
