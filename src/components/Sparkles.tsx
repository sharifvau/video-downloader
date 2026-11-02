"use client";
import { motion } from "framer-motion";

const COLORS = ["#a78bfa", "#38bdf8", "#f472b6", "#fb923c", "#22d3ee"];
export default function Sparkles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 18 }).map((_, i) => {
        const a = (i / 18) * Math.PI * 2;
        return (
          <motion.span key={i} className="absolute left-1/2 top-24 h-2 w-2 rounded-full"
            style={{ background: COLORS[i % COLORS.length] }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(a) * (90 + (i % 3) * 30), y: Math.sin(a) * (90 + (i % 3) * 30), opacity: 0, scale: 0.4 }}
            transition={{ duration: 1.1, ease: "easeOut" }} />
        );
      })}
    </div>
  );
}
