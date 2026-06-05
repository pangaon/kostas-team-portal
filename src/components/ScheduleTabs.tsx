"use client";
import { useState } from "react";
import type { ReactNode } from "react";

export function ScheduleTabs({ list, calendar }: { list: ReactNode; calendar: ReactNode }) {
  const [view, setView] = useState<"list" | "month">("list");
  const tab = (on: boolean) => `rounded-lg px-4 py-1.5 text-sm font-semibold transition ${on ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"}`;
  return (
    <div>
      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        <button onClick={() => setView("list")} className={tab(view === "list")}>List</button>
        <button onClick={() => setView("month")} className={tab(view === "month")}>Month</button>
      </div>
      <div className="mt-4">{view === "list" ? list : calendar}</div>
    </div>
  );
}
