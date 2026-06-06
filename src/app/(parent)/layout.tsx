import type { ReactNode } from "react";
import Link from "next/link";
import { getParentSession } from "@/lib/parent";
import { getCoachTeam } from "@/lib/auth";
import { ParentBottomNav } from "@/components/ParentBottomNav";

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const session = await getParentSession();
  const coach = await getCoachTeam().catch(() => null);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="card max-w-sm text-center">
          <p className="text-4xl">⚽️</p>
          <h1 className="mt-3 text-xl font-bold">You&rsquo;re not joined yet</h1>
          <p className="mt-2 text-slate-600">
            Open your team&rsquo;s invite link to join — ask your coach for it.
          </p>
          <p className="mt-4 flex flex-col gap-2">
            <Link href="/signin" className="btn-primary">Sign in with email</Link>
            <Link href="/" className="text-sm font-semibold text-brand-700">Have an invite link? Tap it instead</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {coach?.team && (
        <Link
          href="/dashboard"
          className="block bg-brand-700 px-4 py-2 text-center text-sm font-semibold text-white"
        >
          ← Back to coach view
        </Link>
      )}
      <div className="mx-auto max-w-md px-4 pb-24 pt-4">{children}</div>
      <ParentBottomNav />
    </>
  );
}
