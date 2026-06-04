import type { ReactNode } from "react";
import Link from "next/link";
import { getParentSession } from "@/lib/parent";
import { ParentBottomNav } from "@/components/ParentBottomNav";

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const session = await getParentSession();

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="card max-w-sm text-center">
          <p className="text-4xl">⚽️</p>
          <h1 className="mt-3 text-xl font-bold">You&rsquo;re not joined yet</h1>
          <p className="mt-2 text-slate-600">
            Open your team&rsquo;s invite link to join — ask your coach for it.
          </p>
          <p className="mt-4">
            <Link href="/" className="font-semibold text-brand-700">
              Back to start
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-md px-4 pb-24 pt-4">{children}</div>
      <ParentBottomNav />
    </>
  );
}
