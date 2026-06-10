"use client";
import { useEffect, useState } from "react";
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);
  const toggle = () => {
    const d = !dark; setDark(d);
    document.documentElement.classList.toggle("dark", d);
    try { localStorage.theme = d ? "dark" : "light"; } catch {}
  };
  return (
    <button onClick={toggle} className={className || "flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium"}>
      {dark ? "☀️ Light mode" : "🌙 Dark mode"}
    </button>
  );
}
