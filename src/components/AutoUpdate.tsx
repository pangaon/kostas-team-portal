"use client";
import { useEffect } from "react";

export function AutoUpdate() {
  useEffect(() => {
    const baked = process.env.NEXT_PUBLIC_BUILD_ID;
    let busy = false;
    const check = async () => {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const { id } = await res.json();
        if (id && id !== "dev" && baked && id !== baked) {
          // a newer deploy is live — refresh to it
          window.location.reload();
        }
      } catch { /* offline — ignore */ } finally { busy = false; }
    };
    // register the push/update service worker; reload when it takes control
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((reg) => reg.update()).catch(() => {});
      let reloaded = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!reloaded) { reloaded = true; window.location.reload(); }
      });
    }
    check();
    const onVis = () => check();
    document.addEventListener("visibilitychange", onVis);
    const t = setInterval(check, 60000);
    return () => { document.removeEventListener("visibilitychange", onVis); clearInterval(t); };
  }, []);
  return null;
}
