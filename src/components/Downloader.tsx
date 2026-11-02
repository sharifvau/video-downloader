"use client";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ClipboardPaste, Clock, Download, Film, HardDrive, History, Loader2, Music, RotateCcw, Trash2, X } from "lucide-react";
import type { MediaFormat, MediaInfo } from "@/types";
import { isValidHttpUrl, platformLabel, quickDetect } from "@/lib/platforms";
import { useHistory } from "@/hooks/useHistory";
import Sparkles from "./Sparkles";

type Phase = "idle" | "loading" | "ready" | "error";
type Dl = { key: string; state: "checking" | "started" | "error"; message?: string } | null;

const fmtBytes = (n: number | null) => {
  if (!n) return null;
  const u = ["B", "KB", "MB", "GB"];
  let i = 0, v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${u[i]}`;
};
const fmtDur = (s: number | null) => {
  if (!s) return null;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
};

export default function Downloader() {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [info, setInfo] = useState<MediaInfo | null>(null);
  const [error, setError] = useState("");
  const [dl, setDl] = useState<Dl>(null);
  const [burst, setBurst] = useState(0);
  const ctrl = useRef<AbortController | null>(null);
  const dlCtrl = useRef<AbortController | null>(null);
  const { items, add, clear } = useHistory();

  const platform = quickDetect(url);
  const invalid = url.trim().length > 0 && !isValidHttpUrl(url);

  async function fetchInfo(raw: string) {
    const u = raw.trim();
    if (!isValidHttpUrl(u)) {
      setError("Please enter a valid http(s) link.");
      setPhase("error");
      return;
    }
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setPhase("loading"); setInfo(null); setError(""); setDl(null);
    try {
      const r = await fetch("/api/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: u }), signal: c.signal });
      const d = await r.json().catch(() => null);
      if (!r.ok || !d?.success) throw new Error(d?.error?.message || `Request failed (${r.status}).`);
      setInfo(d as MediaInfo);
      setPhase("ready");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError((e as Error).message || "Something went wrong.");
      setPhase("error");
    }
  }

  async function paste() {
    try {
      const t = (await navigator.clipboard.readText()).trim();
      if (!t) return;
      setUrl(t);
      if (isValidHttpUrl(t)) fetchInfo(t);
    } catch {
      setError("Clipboard access was blocked. Long-press the box and paste manually.");
      setPhase("error");
    }
  }

  function clearAll() {
    ctrl.current?.abort(); dlCtrl.current?.abort();
    setUrl(""); setInfo(null); setPhase("idle"); setError(""); setDl(null);
  }

  async function startDownload(f: MediaFormat) {
    const key = f.type + f.quality;
    const c = new AbortController();
    dlCtrl.current = c;
    setDl({ key, state: "checking" });
    try {
      // Preflight so we never claim success for a link that can't start.
      const r = await fetch(f.proxyUrl, { method: "HEAD", signal: c.signal });
      if (!r.ok) {
        let msg = `The source refused the download (${r.status}).`;
        if (r.status === 403) msg = "This download link expired. Fetch the media again.";
        if (r.status === 413) msg = "This file is larger than the server allows.";
        if (r.status === 429) msg = "Too many requests. Please wait a moment.";
        throw new Error(msg);
      }
      const a = document.createElement("a");
      a.href = f.proxyUrl; a.download = f.filename; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
      setDl({ key, state: "started" });
      setBurst((n) => n + 1);
      add({ title: info!.title, platform: info!.platform, quality: f.quality, at: Date.now(), url: info!.sourceUrl });
    } catch (e) {
      if ((e as Error).name === "AbortError") { setDl(null); return; }
      setDl({ key, state: "error", message: (e as Error).message });
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5">
      <div className="glass glow-input rounded-3xl p-2 transition">
        <div className="flex items-center gap-1">
          <input
            value={url}
            onChange={(e) => { setUrl(e.target.value); if (phase !== "loading") setPhase("idle"); }}
            onPaste={(e) => {
              const t = e.clipboardData.getData("text").trim();
              if (isValidHttpUrl(t)) { setUrl(t); e.preventDefault(); fetchInfo(t); }
            }}
            onKeyDown={(e) => e.key === "Enter" && fetchInfo(url)}
            inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false}
            placeholder="Paste a video or audio link…"
            aria-label="Media URL" aria-invalid={invalid}
            className="min-w-0 flex-1 bg-transparent px-4 py-4 text-base outline-none placeholder:opacity-50"
          />
          {url && (
            <button onClick={clearAll} aria-label="Clear" className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-black/5 active:scale-90 dark:hover:bg-white/10">
              <X size={18} />
            </button>
          )}
          <motion.button whileTap={{ scale: 0.9 }} whileHover={{ rotate: -6 }} onClick={paste} aria-label="Paste from clipboard"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-300">
            <ClipboardPaste size={20} />
          </motion.button>
        </div>
      </div>

      <div className="mt-2 flex h-5 items-center justify-between px-3 text-xs">
        <span className={invalid ? "text-rose-500" : "opacity-70"}>
          {invalid ? "That doesn't look like a valid link" : platform ? `Detected: ${platformLabel(platform)}` : "Auto-detects the platform"}
        </span>
      </div>

      <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }}
        onClick={() => (phase === "loading" ? (ctrl.current?.abort(), setPhase("idle")) : fetchInfo(url))}
        disabled={phase !== "loading" && !isValidHttpUrl(url)}
        className="grad-btn mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white shadow-lg shadow-violet-500/30 transition disabled:opacity-50">
        {phase === "loading" ? <><Loader2 className="animate-spin" size={20} /> Fetching… tap to cancel</> : <><Download size={20} /> Download</>}
      </motion.button>

      <AnimatePresence mode="wait">
        {phase === "loading" && (
          <motion.div key="skeleton" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass mt-6 rounded-3xl p-4" aria-busy>
            <div className="shimmer aspect-video w-full rounded-2xl" />
            <div className="shimmer mt-4 h-5 w-3/4 rounded-lg" />
            <div className="shimmer mt-2 h-4 w-1/3 rounded-lg" />
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div key="err" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: [0, -8, 8, -4, 4, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
            className="glass mt-6 flex items-start gap-3 rounded-3xl p-4" role="alert">
            <AlertTriangle className="mt-0.5 shrink-0 text-rose-500" size={22} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Couldn&apos;t get that media</p>
              <p className="mt-1 break-words text-sm opacity-80">{error}</p>
              {isValidHttpUrl(url) && (
                <button onClick={() => fetchInfo(url)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 px-3 py-1.5 text-sm font-medium active:scale-95">
                  <RotateCcw size={14} /> Retry
                </button>
              )}
            </div>
          </motion.div>
        )}

        {phase === "ready" && info && (
          <motion.div key="card" initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }} className="glass relative mt-6 overflow-hidden rounded-3xl p-4">
            {burst > 0 && <Sparkles key={burst} />}
            {info.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={info.thumbnail} alt="" referrerPolicy="no-referrer" className="aspect-video w-full rounded-2xl object-cover" />
            ) : (
              <div className="grid aspect-video w-full place-items-center rounded-2xl bg-violet-500/10"><Film size={36} className="opacity-50" /></div>
            )}
            <h2 className="mt-4 line-clamp-2 break-words text-lg font-semibold leading-snug">{info.title}</h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs opacity-70">
              <span>{platformLabel(info.platform)}</span>
              {info.author && <span>{info.author}</span>}
              {fmtDur(info.duration) && <span className="inline-flex items-center gap-1"><Clock size={12} />{fmtDur(info.duration)}</span>}
            </p>

            <ul className="mt-4 space-y-2">
              {info.formats.map((f) => {
                const key = f.type + f.quality;
                const mine = dl?.key === key ? dl : null;
                return (
                  <li key={key + f.downloadUrl} className="rounded-2xl bg-white/40 p-3 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/15">{f.type === "audio" ? <Music size={18} /> : <Film size={18} />}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{f.type === "audio" ? "Audio" : "Video"} · {f.quality}</p>
                        <p className="flex items-center gap-2 text-xs opacity-65">
                          <span>{f.mimeType.split("/")[1]?.toUpperCase()}</span>
                          {fmtBytes(f.size) && <span className="inline-flex items-center gap-1"><HardDrive size={11} />{fmtBytes(f.size)}</span>}
                          {f.type === "video" && f.hasAudio === false && <span className="text-amber-600 dark:text-amber-300">no sound</span>}
                        </p>
                      </div>
                      <motion.button whileTap={{ scale: 0.92 }} onClick={() => startDownload(f)} disabled={mine?.state === "checking"}
                        className="grad-btn flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-60" aria-label={`Download ${f.quality}`}>
                        {mine?.state === "checking" ? <Loader2 size={16} className="animate-spin" /> : mine?.state === "started" ? <CheckCircle2 size={16} /> : <Download size={16} />}
                        {mine?.state === "started" ? "Again" : "Get"}
                      </motion.button>
                    </div>
                    {mine?.state === "checking" && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <div className="shimmer h-1.5 flex-1 rounded-full" />
                        <button onClick={() => dlCtrl.current?.abort()} className="font-medium underline">Cancel</button>
                      </div>
                    )}
                    {mine?.state === "started" && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-300">
                        <CheckCircle2 size={14} /> Download started — your browser is saving it now. Check your downloads.
                      </motion.p>
                    )}
                    {mine?.state === "error" && (
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-rose-600 dark:text-rose-300">
                        <AlertTriangle size={14} className="mt-px shrink-0" /> <span className="flex-1">{mine.message}</span>
                        <button onClick={() => startDownload(f)} className="inline-flex items-center gap-1 font-semibold underline"><RotateCcw size={12} />Retry</button>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length > 0 && (
        <section className="glass mt-8 rounded-3xl p-4" aria-label="Download history">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><History size={16} /> History</h3>
            <button onClick={clear} className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100"><Trash2 size={13} /> Clear</button>
          </div>
          <ul className="space-y-1">
            {items.slice(0, 8).map((h) => (
              <li key={h.at}>
                <button onClick={() => { setUrl(h.url); fetchInfo(h.url); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left text-sm transition hover:bg-violet-500/10">
                  <span className="min-w-0 truncate">{h.title}</span>
                  <span className="shrink-0 text-xs opacity-60">{platformLabel(h.platform)} · {h.quality}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] opacity-50">Stored only in this browser.</p>
        </section>
      )}
    </div>
  );
}
