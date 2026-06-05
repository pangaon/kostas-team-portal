"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Ev = { id: string; title: string; type: string; start_time: string; status: string };
const TYPE_COLOR: Record<string, string> = {
  game: "bg-brand-600", tournament: "bg-violet-600", practice: "bg-emerald-600",
  event: "bg-amber-500", other: "bg-slate-400",
};

export function MonthCalendar({ events }: { events: Ev[] }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const y = cursor.getFullYear(), m = cursor.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const todayKey = new Date().toDateString();

  const byDay: Record<number, Ev[]> = {};
  for (const e of events) {
    const d = new Date(e.start_time);
    if (d.getFullYear() === y && d.getMonth() === m) (byDay[d.getDate()] ??= []).push(e);
  }
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="card !p-3">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setCursor(new Date(y, m - 1, 1))} className="btn-ghost !px-2 !py-1"><ChevronLeft size={16} /></button>
        <p className="font-bold">{cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        <button onClick={() => setCursor(new Date(y, m + 1, 1))} className="btn-ghost !px-2 !py-1"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="aspect-square" />;
          const list = byDay[day] ?? [];
          const isToday = new Date(y, m, day).toDateString() === todayKey;
          return (
            <div key={i} className={`aspect-square overflow-hidden rounded-lg border p-1 text-left ${isToday ? "border-brand-400 bg-brand-50" : "border-slate-100"}`}>
              <div className={`text-[10px] font-bold ${isToday ? "text-brand-700" : "text-slate-400"}`}>{day}</div>
              <div className="mt-0.5 space-y-0.5">
                {list.slice(0, 2).map((e) => (
                  <Link key={e.id} href={`/team/schedule?edit=${e.id}`}
                    className={`block truncate rounded px-1 text-[9px] font-semibold leading-tight text-white ${TYPE_COLOR[e.type] ?? "bg-slate-400"} ${e.status === "cancelled" ? "line-through opacity-50" : ""}`}>
                    {e.title}
                  </Link>
                ))}
                {list.length > 2 && <div className="text-[9px] font-semibold text-slate-400">+{list.length - 2}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
