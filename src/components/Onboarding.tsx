"use client";
import { useEffect, useState } from "react";

export function Onboarding({
  id,
  title,
  steps,
}: {
  id: string;
  title: string;
  steps: string[];
}) {
  const key = `onboard_dismissed_${id}`;
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(key)) setShow(true);
    } catch {
      setShow(true);
    }
  }, [key]);

  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(key, "1");
    } catch {}
    setShow(false);
  };

  return (
    <div className="mb-4 rounded-2xl border border-brand-200 bg-brand-50 p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-bold text-brand-900">{title}</h2>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="rounded-lg px-2 py-0.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
        >
          Got it ✕
        </button>
      </div>
      <ol className="mt-2 space-y-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2 text-sm text-brand-900">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
              {i + 1}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
