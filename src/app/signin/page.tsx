import Link from "next/link";
import { requestMagicLink } from "./actions";

export const dynamic = "force-dynamic";

export default function SignIn({ searchParams }: { searchParams: { sent?: string; dev?: string; error?: string; expired?: string } }) {
  const sent = searchParams.sent === "1";
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="card w-full max-w-sm">
        <p className="text-3xl">⚽️</p>
        <h1 className="mt-2 h-title">Sign in to your team</h1>
        <p className="mt-1 text-sm text-slate-500">Enter the email your coach has on file. We&rsquo;ll send you a secure sign-in link — no password.</p>

        {searchParams.expired && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">That link expired. Enter your email for a fresh one.</p>}
        {searchParams.error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{decodeURIComponent(searchParams.error)}</p>}

        {sent ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            ✓ Check your email — if that address is on the team, a sign-in link is on its way (expires in 30 min).
            {searchParams.dev && (
              <p className="mt-2 break-all text-xs text-slate-500">Testing link (email not configured yet): <Link className="font-semibold text-brand-700 underline" href={decodeURIComponent(searchParams.dev)}>open</Link></p>
            )}
          </div>
        ) : (
          <form action={requestMagicLink} className="mt-4 space-y-3">
            <input name="email" type="email" required placeholder="you@email.com" className="input" />
            <button className="btn-primary w-full">Email me a sign-in link</button>
          </form>
        )}
        <p className="mt-4 text-center text-xs text-slate-400">New to the team? Use your coach&rsquo;s invite link instead.</p>
      </div>
    </div>
  );
}
