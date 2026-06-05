import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl">🧭</p>
      <h1 className="mt-4 h-title">Page not found</h1>
      <p className="mt-2 max-w-sm text-slate-500">This page moved or never existed. Let&rsquo;s get you back on track.</p>
      <Link href="/" className="btn-primary mt-5">Go home</Link>
    </div>
  );
}
