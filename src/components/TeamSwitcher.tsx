"use client";
import { useState } from "react";
import Link from "next/link";
import { setCurrentTeam } from "@/app/(coach)/dashboard/actions";

type T = { id: string; name: string };

export function TeamSwitcher({ teams, currentId, currentName }: { teams: T[]; currentId: string; currentName: string }) {
  const [open, setOpen] = useState(false);
  if (teams.length <= 1) {
    return <span className="font-bold tracking-tight">{currentName}</span>;
  }
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 font-bold tracking-tight" aria-haspopup="listbox" aria-expanded={open}>
        <span className="max-w-[42vw] truncate lg:max-w-[180px]">{currentName}</span>
        <span className="text-slate-400">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-9 z-40 w-60 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lift">
            <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Your teams</p>
            {teams.map((t) => (
              <form key={t.id} action={setCurrentTeam}>
                <input type="hidden" name="teamId" value={t.id} />
                <button className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-sm font-medium ${t.id === currentId ? "bg-brand-50 text-brand-700" : "text-ink hover:bg-slate-50"}`}>
                  <span className="truncate">{t.name}</span>{t.id === currentId && <span>✓</span>}
                </button>
              </form>
            ))}
            <Link href="/dashboard?new=1" onClick={() => setOpen(false)} className="mt-1 block rounded-xl px-2.5 py-2 text-sm font-semibold text-brand-700 hover:bg-slate-50">+ New team</Link>
          </div>
        </>
      )}
    </div>
  );
}
