"use client";
import { useEffect, useState } from "react";

const isLiveGame = () => typeof location !== "undefined" && /\/event\/[^/]+\/live/.test(location.pathname);

export function AutoUpdate() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    const baked = process.env.NEXT_PUBLIC_BUILD_ID;
    let busy = false;
    let handled = false;

    const applyUpdate = () => {
      if (handled) return;
      handled = true;
      // Auto-reload everywhere except the live game console (mid-game), where we
      // show a gentle banner so we never reload out from under an active coach.
      if (isLiveGame()) { setUpdateReady(true); handled = false; return; }
      window.location.reload();
    };

    const check = async () => {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const { id } = await res.json();
        if (id && id !== "dev" && baked && id !== baked) applyUpdate();
      } catch { /* offline */ } finally { busy = false; }
    };

    if ("serviceWorker" in navigator) {
      // updateViaCache:none -> the browser always fetches a fresh sw.js so new deploys are detected.
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then((reg) => reg.update()).catch(() => {});
      navigator.serviceWorker.addEventListener("controllerchange", applyUpdate);
    }
    check();
    const onVis = () => check();
    document.addEventListener("visibilitychange", onVis);
    const t = setInterval(check, 45000);
    return () => { document.removeEventListener("visibilitychange", onVis); clearInterval(t); };
  }, []);

  if (!updateReady) return null;
  return (
    <div className="fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4 lg:bottom-4">
      <div className="flex items-center gap-3 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-lift">
        <span>New version ready.</span>
        <button onClick={() => window.location.reload()} className="rounded-full bg-brand-600 px-3 py-1 text-white">Refresh</button>
        <button onClick={() => setUpdateReady(false)} aria-label="Dismiss" className="text-slate-400">✕</button>
      </div>
    </div>
  );
}
