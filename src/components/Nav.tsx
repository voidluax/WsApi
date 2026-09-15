import { FolderGit2, RadioTower } from "lucide-react";

const LINKS = [
  { href: "#deploy", label: "Deploy" },
  { href: "#api", label: "REST API" },
  { href: "#ws", label: "WebSocket" },
  { href: "#rules", label: "Rules" },
  { href: "#flow", label: "Usage flow" },
];

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-void/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-acid text-[#0b0b0e]">
            <RadioTower className="h-4.5 w-4.5" strokeWidth={2.4} />
          </span>
          <span className="text-[15px] font-bold tracking-tight">
            relay<span className="text-zinc-500">.chat</span>
          </span>
        </a>

        <nav className="ml-auto hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono text-[12px] tracking-wide text-zinc-400 transition-colors hover:text-acid"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Repository"
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-zinc-300 transition-colors hover:border-white/25 hover:text-white"
          >
            <FolderGit2 className="h-4 w-4" />
          </a>
          <a
            href="#deploy"
            className="rounded-lg bg-acid px-4 py-2 text-[13px] font-semibold text-[#0b0b0e] transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Deploy on Render
          </a>
        </div>
      </div>
    </header>
  );
}
