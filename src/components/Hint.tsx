"use client";
import { useState } from "react";

export function Hint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="Help"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className="grid h-5 w-5 place-items-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-300"
      >
        ?
      </button>
      {open && (
        <span className="absolute left-1/2 top-7 z-30 w-56 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-normal leading-snug text-white shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}
