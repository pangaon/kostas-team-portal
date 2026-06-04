"use client";
import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}
    className="min-h-[48px] w-full rounded-xl bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
    {pending ? "Please wait…" : label}</button>;
}

export default function LoginPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const action = mode === "in" ? signIn : signUp;
  const [state, formAction] = useFormState<AuthState, FormData>(action, {});
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="mb-1 text-2xl font-bold">{mode === "in" ? "Coach sign in" : "Create coach account"}</h1>
      <p className="mb-6 text-sm text-slate-500">Kostas Team Portal</p>
      <form action={formAction} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} required className="input" />
        </div>
        {state.error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{state.error}</p>}
        {state.message && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{state.message}</p>}
        <Submit label={mode === "in" ? "Sign in" : "Create account"} />
      </form>
      <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-5 text-sm font-medium text-brand-700">
        {mode === "in" ? "Need an account? Create one" : "Already have an account? Sign in"}
      </button>
    </main>
  );
}
