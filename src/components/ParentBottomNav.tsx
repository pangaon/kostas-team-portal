"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/parent", label: "Home", icon: "🏠" },
  { href: "/parent/schedule", label: "Schedule", icon: "📅" },
  { href: "/parent/snacks", label: "Snacks", icon: "🍎" },
  { href: "/parent/announcements", label: "News", icon: "📣" },
  { href: "/parent/coach", label: "Coach", icon: "📋" },
];

export function ParentBottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map((t) => {
          const active = path === t.href;
          return (
            <Link key={t.href} href={t.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${active ? "text-brand-700" : "text-slate-500"}`}>
              <span className="text-xl leading-none">{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
