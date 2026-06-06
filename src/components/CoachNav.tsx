"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { TeamSwitcher } from "@/components/TeamSwitcher";

const primary = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/team/roster", label: "Roster", icon: "👥" },
  { href: "/team/schedule", label: "Schedule", icon: "📅" },
  { href: "/team/tactics", label: "Tactics", icon: "🎯" },
];
const more = [
  { href: "/team/season", label: "Season", icon: "🏆" },
  { href: "/team/attendance", label: "Attendance", icon: "✅" },
  { href: "/team/snacks", label: "Snacks", icon: "🍎" },
  { href: "/team/poll", label: "Practice poll", icon: "📋" },
  { href: "/team/announcements", label: "Announce", icon: "📣" },
  { href: "/team/notifications", label: "Alerts sent", icon: "🔔" },
  { href: "/team/messages", label: "Messages", icon: "💬" },
  { href: "/parent", label: "My kid view", icon: "👨‍👧" },
  { href: "/team/settings", label: "Settings", icon: "⚙️" },
];
const allDesktop = [...primary, ...more];

export function CoachNav({ teamName, teams, currentId }: { teamName: string; teams: { id: string; name: string }[]; currentId: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const moreActive = more.some((m) => m.href !== "/parent" && path.startsWith(m.href));
  const isActive = (href: string) =>
    path === href || (href !== "/dashboard" && href !== "/parent" && path.startsWith(href));

  return (
    <>
      {/* ===== DESKTOP SIDEBAR (lg+) ===== */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white px-3 py-4 lg:flex">
        <Link href="/dashboard" className="mb-5 flex items-center gap-2 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-base font-bold text-white">⚽</span>
          <span className="truncate text-base font-bold tracking-tight"><TeamSwitcher teams={teams} currentId={currentId} currentName={teamName} /></span>
        </Link>
        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {allDesktop.map((t) => {
            const active = isActive(t.href);
            return (
              <Link key={t.href} href={t.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"}`}>
                <span className="text-lg leading-none">{t.icon}</span>{t.label}
              </Link>
            );
          })}
        </nav>
        <form action="/logout" method="post" className="border-t border-slate-100 pt-2">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50">
            <span className="text-lg leading-none">↩︎</span>Sign out
          </button>
        </form>
      </aside>

      {/* ===== MOBILE TOP BAR (below lg) ===== */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-sm font-bold text-white">⚽</span>
            <TeamSwitcher teams={teams} currentId={currentId} currentName={teamName} />
          </Link>
          <form action="/logout" method="post"><button className="text-sm font-medium text-slate-500 hover:text-slate-800">Sign out</button></form>
        </div>
      </header>

      {/* ===== MOBILE "MORE" SHEET ===== */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/40" style={{ animation: "fadeUp .2s ease both" }} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 pb-24 shadow-2xl" style={{ animation: "fadeUp .25s ease both" }} onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300" />
            <div className="grid grid-cols-3 gap-3">
              {more.map((m) => {
                const active = m.href !== "/parent" && path.startsWith(m.href);
                return (
                  <Link key={m.href} href={m.href} onClick={() => setOpen(false)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border p-4 text-center text-xs font-medium transition active:scale-95 ${active ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-700"}`}>
                    <span className="text-2xl leading-none">{m.icon}</span>{m.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== MOBILE BOTTOM TABS (below lg) ===== */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-3xl grid-cols-5">
          {primary.map((t) => {
            const active = isActive(t.href);
            return (
              <Link key={t.href} href={t.href} className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${active ? "text-brand-700" : "text-slate-500"}`}>
                <span className="text-xl leading-none">{t.icon}</span>{t.label}
              </Link>
            );
          })}
          <button onClick={() => setOpen((o) => !o)} aria-label="More menu" aria-expanded={open} className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${moreActive || open ? "text-brand-700" : "text-slate-500"}`}>
            <span className="text-xl leading-none">⋯</span>More
          </button>
        </div>
      </nav>
    </>
  );
}
