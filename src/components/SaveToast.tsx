"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SaveToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const saved = params.get("saved");
  const error = params.get("error");
  const msg = error ?? saved;
  const isError = !!error;

  useEffect(() => {
    if (!msg) return;
    setShow(true);
    const clean = setTimeout(() => router.replace(pathname, { scroll: false }), 100);
    const hide = setTimeout(() => setShow(false), isError ? 3600 : 2400);
    return () => { clearTimeout(clean); clearTimeout(hide); };
  }, [msg, isError, pathname, router]);

  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4">
      <div
        className={`pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg ${isError ? "bg-rose-600" : "bg-slate-900"}`}
        style={{ animation: "fadeUp .25s ease both" }}
      >
        <span className={`grid h-5 w-5 place-items-center rounded-full text-xs ${isError ? "bg-white/25" : "bg-emerald-500"}`}>
          {isError ? "!" : "✓"}
        </span>
        {isError
          ? decodeURIComponent(error ?? "Something went wrong")
          : saved === "1"
          ? "Saved"
          : decodeURIComponent(saved ?? "Saved")}
      </div>
    </div>
  );
}
