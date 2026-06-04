"use client";
import { useEffect, useState } from "react";
import { saveCoachPushSubscription } from "@/lib/push-actions";

function urlB64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function CoachPushControls() {
  const [perm, setPerm] = useState<NotificationPermission | "unknown">("unknown");
  const [busy, setBusy] = useState(false);
  const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const [iosNeedsInstall, setIos] = useState(false);

  useEffect(() => {
    if (typeof Notification !== "undefined") setPerm(Notification.permission);
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    setIos(isIos && !standalone);
  }, []);

  if (!VAPID) return <p className="text-sm text-slate-500">Alerts aren&apos;t configured.</p>;
  if (iosNeedsInstall)
    return <p className="text-sm text-slate-600">On iPhone: tap <b>Share → Add to Home Screen</b>, open it from that icon, then enable alerts here.</p>;

  async function enable() {
    setBusy(true);
    try {
      const result = await Notification.requestPermission();
      setPerm(result);
      if (result === "granted") {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(VAPID!) as BufferSource });
        await saveCoachPushSubscription(sub.toJSON() as any, navigator.userAgent);
      }
    } catch { /* ignore */ } finally { setBusy(false); }
  }

  if (perm === "granted") return <p className="text-sm font-medium text-emerald-700">Alerts on for this device ✓</p>;
  return (
    <button onClick={enable} disabled={busy} className="min-h-[44px] rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-50">
      {busy ? "Enabling…" : "Enable alerts on this device"}
    </button>
  );
}
