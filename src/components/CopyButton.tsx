"use client";

import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }, [text]);

  return (
    <button
      onClick={onCopy}
      aria-label="Copy to clipboard"
      className={`group/copy inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[11px] text-zinc-400 transition-colors hover:border-white/20 hover:text-zinc-100 ${className}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-acid" strokeWidth={2.4} />
      ) : (
        <Copy className="h-3.5 w-3.5" strokeWidth={2.2} />
      )}
      {copied ? "copied" : "copy"}
    </button>
  );
}
