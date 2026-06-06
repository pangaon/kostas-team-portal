"use client";
import { useState } from "react";
import { SET_PIECE_FIELDS, type SetPieces } from "@/lib/setpieces";

type P = { id: string; first_name: string; last_name: string; jersey_number: string | null };

export function SetPieceRoles({ eventId, players, initial }: { eventId: string; players: P[]; initial: SetPieces }) {
  const [roles, setRoles] = useState<SetPieces>(initial);
  const [saved, setSaved] = useState(false);
  const set = async (key: keyof SetPieces, val: string) => {
    const next = { ...roles, [key]: val || undefined };
    setRoles(next); setSaved(true); setTimeout(() => setSaved(false), 1500);
    await fetch("/api/tactics", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ eventId, op: "setpieces", payload: { roles: next } }) }).catch(() => {});
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">🚩 Set-piece takers</p>
        {saved && <span className="text-xs font-semibold text-emerald-600">Saved ✓</span>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {SET_PIECE_FIELDS.map((f) => (
          <label key={f.key} className="text-xs font-medium text-slate-500">
            {f.label}
            <select value={(roles[f.key] as string) ?? ""} onChange={(e) => set(f.key, e.target.value)} className="input mt-1 py-2 text-sm">
              <option value="">—</option>
              {players.map((p) => <option key={p.id} value={p.id}>{p.jersey_number ? `#${p.jersey_number} ` : ""}{p.first_name}</option>)}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}
