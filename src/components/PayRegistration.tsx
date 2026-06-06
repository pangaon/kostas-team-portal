"use client";
import { useState } from "react";
export function PayRegistration({ amount }: { amount: string }) {
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/checkout", { method: "POST" });
      const j = await r.json();
      if (j.url) { window.location.href = j.url; return; }
      alert(j.error || "Payments aren't switched on yet."); setBusy(false);
    } catch { alert("Something went wrong."); setBusy(false); }
  };
  return <button onClick={go} disabled={busy} className="btn-primary w-full">{busy ? "Opening checkout…" : `Pay registration — $${amount}`}</button>;
}
