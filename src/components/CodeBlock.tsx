"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch { /* clipboard unavailable */ }
  };
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-black/5 px-4 py-2 text-xs dark:border-white/10">
        <span className="font-mono opacity-60">{label}</span>
        <button onClick={copy} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium transition hover:bg-violet-500/10 active:scale-95" aria-label="Copy code">
          {done ? <Check size={14} /> : <Copy size={14} />} {done ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[12.5px] leading-relaxed"><code className="font-mono">{code}</code></pre>
    </div>
  );
}
