"use client";
import { useEffect, useState } from "react";

export function AutoUpdate() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    const baked = process.env.NEXT_PUBLIC_BUILD_ID;
    let busy = false;
    const check = async () => {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const { id } = await res.json();
        if (id && id !== "dev" && baked && id !== baked) setUpdateReady(true);
      } catch { /* offline */ } finally { busy = false; }
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((reg) => reg.update()).catch(() => {});
      // Note: we intentionally do NOT reload on controllerchange — that would wipe unsaved work.
      navigator.serviceWorker.addEventListener("controllerchange", () => setUpdateReady(true));
    }
    check();
    const onVis = () => check();
    document.addEventListener("visibilitychange", onVis);
    const t = setInterval(check, 60000);
    return () => { document.removeEventListener("visibilitychange", onVis); clearInterval(t); };
  }, []);

  if (!updateReady) return null;
  return (
    <div className="fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4 lg:bottom-4">
      <div className="flex items-center gap-3 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-lift">
        <span>A new version is ready.</span>
        <button onClick={() => window.location.reload()} className="rounded-full bg-brand-600 px-3 py-1 text-white">Refresh</button>
        <button onClick={() => setUpdateReady(false)} aria-label="Dismiss" className="text-slate-400">✕</button>
      </div>
    </div>
  );
}
