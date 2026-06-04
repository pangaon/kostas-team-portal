"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/team/roster", label: "Roster" },
  { href: "/team/schedule", label: "Schedule" },
  { href: "/team/attendance", label: "Attendance" },
  { href: "/team/snacks", label: "Snacks" },
  { href: "/team/announcements", label: "Announcements" },
  { href: "/team/messages", label: "Messages" },
  { href: "/team/settings", label: "Settings" },
];

export function CoachNav({ teamName }: { teamName: string }) {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">⚽</span>
          <span className="font-bold">{teamName}</span>
        </Link>
        <form action="/logout" method="post">
          <button className="text-sm font-medium text-slate-500 hover:text-slate-800">Sign out</button>
        </form>
      </div>
      <nav className="mx-auto max-w-3xl overflow-x-auto px-2 pb-2">
        <div className="flex gap-1 whitespace-nowrap">
          {links.map((l) => {
            const active = path === l.href || (l.href !== "/dashboard" && path.startsWith(l.href));
            return (
              <Link key={l.href} href={l.href}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${active ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
