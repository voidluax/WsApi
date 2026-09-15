import { CloudUpload, Hourglass, HeartPulse, Server, TerminalSquare } from "lucide-react";
import CodeBlock from "./CodeBlock";
import CopyButton from "./CopyButton";
import LiveDemo from "./LiveDemo";
import SectionHeading from "./SectionHeading";

const NOTES = [
  {
    icon: Server,
    title: "Web Service (not Static Site)",
    text: "Create it from your GitHub repo. WebSockets are fully supported on Render web services — no extra config.",
  },
  {
    icon: TerminalSquare,
    title: "PORT is injected",
    text: "Render sets process.env.PORT automatically. The server reads it — never hardcode a port.",
  },
  {
    icon: Hourglass,
    title: "Free tier sleeps",
    text: "After ~15 minutes of inactivity the instance spins down. The first request or WS connect after that may take ~50s while it cold-starts.",
  },
  {
    icon: HeartPulse,
    title: "Health checks",
    text: "GET /api/health returns 200 with uptime, room count and live connection count. Set it as the Render Health Check Path.",
  },
];

export default function DeploySection() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          id="deploy"
          kicker="Deploy"
          title={
            <>
              On Render&apos;s free tier in <span className="text-acid">two commands</span>
            </>
          }
          sub="Push the repo, create a Web Service, paste these two commands. Render handles TLS, so your WebSocket URL is wss:// from the first boot."
        />

        <div className="grid gap-6 lg:grid-cols-12">
          {/* commands card */}
          <div className="card-glow relative overflow-hidden rounded-2xl bg-panel lg:col-span-7">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3">
              <CloudUpload className="h-4 w-4 text-acid" strokeWidth={2.2} />
              <span className="font-mono text-[12px] tracking-wide text-zinc-400">Render dashboard — service settings</span>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <p className="mb-2 font-mono text-[11px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                  Build command
                </p>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-acid/20 bg-acid/[0.05] px-4 py-3.5">
                  <code className="font-mono text-[14px] font-semibold text-acid">npm install</code>
                  <CopyButton text="npm install" />
                </div>
              </div>
              <div>
                <p className="mb-2 font-mono text-[11px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                  Start command
                </p>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-acid/20 bg-acid/[0.05] px-4 py-3.5">
                  <code className="font-mono text-[14px] font-semibold text-acid">node server.js</code>
                  <CopyButton text="node server.js" />
                </div>
              </div>
              <CodeBlock
                title="your service URLs after deploy"
                lang="shell"
                code={`# REST
https://<app-name>.onrender.com/api/rooms

# WebSocket
wss://<app-name>.onrender.com`}
              />
            </div>
          </div>

          {/* notes */}
          <div className="grid content-start gap-4 lg:col-span-5">
            {NOTES.map((n) => (
              <div
                key={n.title}
                className="group rounded-xl border border-white/[0.07] bg-panel p-5 transition-colors hover:border-acid/25"
              >
                <div className="mb-2.5 flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg border border-acid/25 bg-acid/[0.07]">
                    <n.icon className="h-4 w-4 text-acid" strokeWidth={2.2} />
                  </span>
                  <h3 className="text-[14.5px] font-bold tracking-tight">{n.title}</h3>
                </div>
                <p className="text-[13px] leading-relaxed text-zinc-400">{n.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* live demo */}
        <div className="mt-14">
          <p className="mb-3 flex items-center gap-2 font-mono text-[12px] font-semibold tracking-[0.22em] text-iris uppercase">
            <span className="inline-block h-px w-7 bg-iris/60" />
            Try the REST API right now
          </p>
          <LiveDemo />
        </div>
      </div>
    </section>
  );
}
