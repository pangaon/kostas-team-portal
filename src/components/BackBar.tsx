import Link from "next/link";

export function BackBar({ href = "/dashboard", label = "Back to dashboard" }: { href?: string; label?: string }) {
  return (
    <div className="mb-4 print:hidden">
      <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
        ← {label}
      </Link>
    </div>
  );
}
