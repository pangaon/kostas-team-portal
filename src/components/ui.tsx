import Link from "next/link";
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{children}</h2>;
}

type BadgeColor = "green" | "red" | "amber" | "blue" | "slate";
const badgeColors: Record<BadgeColor, string> = {
  green: "bg-emerald-100 text-emerald-700",
  red: "bg-rose-100 text-rose-700",
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-brand-100 text-brand-700",
  slate: "bg-slate-100 text-slate-600",
};
export function Badge({ children, color = "slate" }: { children: ReactNode; color?: BadgeColor }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColors[color]}`}>{children}</span>;
}

type BtnProps = {
  children: ReactNode; href?: string; type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost" | "danger"; className?: string;
  name?: string; value?: string; disabled?: boolean;
};
const variants = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
  ghost: "text-brand-700 hover:bg-brand-50",
  danger: "border border-rose-200 bg-white text-rose-600 hover:bg-rose-50",
};
export function Button({ children, href, type = "button", variant = "primary", className = "", name, value, disabled }: BtnProps) {
  const cls = `inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold transition disabled:opacity-50 active:scale-[0.97] ${variants[variant]} ${className}`;
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type={type} name={name} value={value} disabled={disabled} className={cls}>{children}</button>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <Card className="text-center text-slate-500">
      <p className="font-medium text-slate-700">{title}</p>
      {hint && <p className="mt-1 text-sm">{hint}</p>}
    </Card>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card className="flex flex-col justify-between">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </Card>
  );
}

export function Field({ label, name, children, error, required }: { label: string; name?: string; children?: ReactNode; error?: string; required?: boolean }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}{required && <span className="text-rose-500"> *</span>}</label>
      {children}
      {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
    </div>
  );
}
