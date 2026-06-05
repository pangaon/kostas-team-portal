"use client";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { /* could log to a service */ }, [error]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl">⚠️</p>
      <h1 className="mt-4 h-title">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-slate-500">A hiccup on our end — your data is safe. Try again.</p>
      <div className="mt-5 flex gap-2">
        <button onClick={reset} className="btn-primary">Try again</button>
        <a href="/" className="btn-ghost">Go home</a>
      </div>
    </div>
  );
}
