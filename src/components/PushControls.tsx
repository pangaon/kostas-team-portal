"use client";
import { useEffect, useState } from "react";
import { savePushSubscription } from "@/lib/push-actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function PushControls() {
  const [mounted, setMounted] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("unsupported");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      }
      const ua = navigator.userAgent || "";
      setIsIOS(/iphone|ipad|ipod/i.test(ua));
      const sa =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone === true;
      setStandalone(!!sa);
      if (typeof Notification !== "undefined") {
        setPerm(Notification.permission);
      } else {
        setPerm("unsupported");
      }
    } catch {
      // stay defensive — never crash the page
    }
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const result = await Notification.requestPermission();
      setPerm(result);
      if (result === "granted" && VAPID) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID) as BufferSource,
        });
        await savePushSubscription(sub.toJSON() as any, navigator.userAgent);
      }
    } catch {
      // ignore — user can retry
    } finally {
      setBusy(false);
    }
  }

  // No key configured -> push not available, render nothing.
  if (!VAPID) return null;
  // Avoid hydration mismatch: render nothing until client checks complete.
  if (!mounted) return null;

  const cardCls = "rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-sm";

  // iOS Safari can only do push from an installed (home-screen) app.
  if (isIOS && !standalone) {
    return (
      <div className={cardCls}>
        <p className="font-semibold text-slate-800">Add this to your home screen to get game alerts</p>
        <p className="mt-1 text-slate-600">
          Tap the Share button, then &ldquo;Add to Home Screen.&rdquo;
        </p>
      </div>
    );
  }

  if (perm === "granted") {
    return (
      <div className={`${cardCls} text-emerald-700`}>
        <span className="font-semibold">Alerts on ✓</span>
      </div>
    );
  }

  if (perm === "default") {
    return (
      <div className={cardCls}>
        <button
          type="button"
          onClick={enable}
          disabled={busy}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-base font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "Enabling…" : "Enable game alerts"}
        </button>
      </div>
    );
  }

  // Unsupported or denied — stay quiet.
  return null;
}
