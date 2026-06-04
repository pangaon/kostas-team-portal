import Link from "next/link";
import { Button } from "@/components/ui";

export default function Landing() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-brand-600 text-3xl">⚽</div>
        <h1 className="text-3xl font-bold">Kostas Team Portal</h1>
        <p className="mt-2 text-slate-500">
          One clean place for your team's schedule, attendance, snack duty, lineups and announcements — no more lost WhatsApp messages.
        </p>
      </div>
      <div className="space-y-3">
        <Button href="/login" className="w-full">Coach sign in</Button>
        <p className="text-center text-sm text-slate-500">
          Are you a parent? Open the invite link your coach sent you to join the team.
        </p>
      </div>
    </main>
  );
}
