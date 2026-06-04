import Link from "next/link";
import { redirect } from "next/navigation";
import { getParentSession } from "@/lib/parent";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BadoniLanding() {
  const parent = await getParentSession();
  if (parent) redirect("/parent");
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <span className="text-lg font-extrabold tracking-tight">BADONI<span className="text-brand-600">.</span></span>
          <nav className="flex items-center gap-5 text-sm font-medium text-slate-600">
            <a href="#products" className="hidden hover:text-slate-900 sm:inline">Products</a>
            <a href="#about" className="hidden hover:text-slate-900 sm:inline">About</a>
            <Link href="/login" className="rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">Sign in</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 pb-10 pt-16 sm:pt-24">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600">A family-built studio · Canada</p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Simple software for teams, families, and the people who run them.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-600">
          Badoni builds clean, practical tools that take the chaos out of organizing real life — starting with the people who volunteer their time to make it happen.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#products" className="rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">Explore our products</a>
          <Link href="/login" className="rounded-full border border-slate-300 px-6 py-3 font-semibold hover:bg-slate-50">Coach sign in</Link>
        </div>
      </section>

      <section id="products" className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">What we&apos;re building</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col rounded-2xl border-2 border-brand-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-2xl">⚽</span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Live</span>
              </div>
              <h3 className="text-lg font-bold">Team Portal</h3>
              <p className="mt-1 flex-1 text-sm text-slate-600">
                One clean home for a youth team or activity — roster, schedule, attendance, lineups, snack duty, carpool, live game stats and announcements. No app store, no passwords for parents.
              </p>
              <Link href="/login" className="mt-4 inline-flex font-semibold text-brand-700 hover:underline">Open Team Portal →</Link>
            </div>
            {[
              { icon: "🗓️", name: "Badoni Schedule", desc: "Shared family calendars that actually stay in sync across activities and households." },
              { icon: "🤝", name: "Community Hub", desc: "Lightweight sign-ups, volunteer rosters and group coordination for clubs and leagues." },
            ].map((p) => (
              <div key={p.name} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-2xl">{p.icon}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">In development</span>
                </div>
                <h3 className="text-lg font-bold">{p.name}</h3>
                <p className="mt-1 flex-1 text-sm text-slate-600">{p.desc}</p>
                <span className="mt-4 text-sm font-medium text-slate-400">Coming soon</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="grid items-center gap-8 sm:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Team Portal, in the wild</h2>
            <p className="mt-3 text-slate-600">Our first product is already running real teams. Coaches get a command center; parents get a dead-simple home-screen app.</p>
            <ul className="mt-5 space-y-2 text-slate-700">
              <li>✅ Roster &amp; parent directory — who belongs to whom</li>
              <li>✅ Schedule, attendance &amp; one-tap directions</li>
              <li>✅ Lineups, live in-game scoring &amp; season stats</li>
              <li>✅ Snack &amp; volunteer sign-up, carpool, practice polls</li>
              <li>✅ Announcements + push alerts — no more lost group chats</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">For coaches</p>
            <Link href="/login" className="mt-1 inline-flex text-lg font-bold text-brand-700 hover:underline">Sign in to your team →</Link>
            <p className="mt-5 text-sm font-semibold uppercase tracking-widest text-slate-500">For parents</p>
            <p className="mt-1 text-slate-700">Open the private invite link your coach sent you — tap your child&apos;s name and you&apos;re in.</p>
          </div>
        </div>
      </section>

      <section id="about" className="border-t border-slate-100 bg-slate-900 text-slate-100">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">About Badoni</h2>
          <p className="mt-4 max-w-2xl text-slate-300">
            Badoni is a family company. We build the tools we wished existed — practical, friendly, and fast — and we sweat the details so the people using them don&apos;t have to. Team Portal was born on a real sideline; everything we make starts the same way: a real problem, solved simply.
          </p>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-5 py-10 text-sm text-slate-500">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} Badoni · Made in Canada 🇨🇦</span>
          <Link href="/login" className="font-medium text-slate-700 hover:underline">Sign in</Link>
        </div>
      </footer>
    </div>
  );
}
