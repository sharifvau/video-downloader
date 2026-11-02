"use client";
import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Mode = "system" | "light" | "dark";
const apply = (m: Mode) => {
  const dark = m === "dark" || (m === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
};

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");
  useEffect(() => {
    const s = localStorage.getItem("theme");
    if (s === "light" || s === "dark") setMode(s);
  }, []);
  useEffect(() => {
    if (mode !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => apply("system");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [mode]);

  const next = () => {
    const n: Mode = mode === "system" ? "light" : mode === "light" ? "dark" : "system";
    setMode(n);
    localStorage.setItem("theme", n);
    apply(n);
  };
  const Icon = mode === "system" ? Monitor : mode === "light" ? Sun : Moon;
  return (
    <button onClick={next} className="glass grid h-10 w-10 place-items-center rounded-full transition active:scale-90" aria-label={`Theme: ${mode}. Tap to change`} title={`Theme: ${mode}`}>
      <Icon size={18} />
    </button>
  );
}
