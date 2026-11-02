"use client";
import { useCallback, useEffect, useState } from "react";

export interface HistoryItem { title: string; platform: string; quality: string; at: number; url: string }
const KEY = "emon-history-v1";

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { /* ignore */ }
  }, []);
  const save = (n: HistoryItem[]) => {
    setItems(n);
    try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* storage full/blocked */ }
  };
  const add = useCallback((i: HistoryItem) => {
    setItems((prev) => {
      const n = [i, ...prev].slice(0, 30);
      try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* ignore */ }
      return n;
    });
  }, []);
  return { items, add, clear: () => save([]) };
}
