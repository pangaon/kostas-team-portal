"use client";
import { useState, useCallback } from "react";
import { FORMATIONS_8, type LineupSlot, type LineupPlan } from "@/lib/types";

type P = { id: string; first_name: string; last_name: string; jersey_number: string | null; strength: number | null; preferred_position: string | null; coach_notes: string | null };

function strengthColor(s: number | null) {
  if (s === 5) return "#059669"; if (s === 4) return "#16a34a"; if (s === 3) return "#d97706";
  if (s === 2) return "#ea580c"; if (s === 1) return "#e11d48"; return "#64748b";
}
function buildSlots(formation: string, prev: LineupSlot[]): LineupSlot[] {
  const base = FORMATIONS_8[formation] ?? FORMATIONS_8["3-3-1"];
  const ids = prev.filter((s) => s.player_id).map((s) => s.player_id);
  return base.map((b, i) => ({ ...b, player_id: ids[i] ?? null }));
}

export function TacticsBoard({ eventId, players, attendingIds, initialPlans }: {
  eventId: string; players: P[]; attendingIds: string[]; initialPlans: LineupPlan[];
}) {
  const [formation, setFormation] = useState(initialPlans[0]?.formation ?? "3-3-1");
  const [slots, setSlots] = useState<LineupSlot[]>(initialPlans[0]?.slots?.length ? initialPlans[0].slots : buildSlots(initialPlans[0]?.formation ?? "3-3-1", []));
  const [plans, setPlans] = useState<LineupPlan[]>(initialPlans);
  const [planId, setPlanId] = useState<string | null>(initialPlans[0]?.id ?? null);
  const [name, setName] = useState(initialPlans[0]?.name ?? "Plan A");
  const [sel, setSel] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const post = useCallback(async (op: string, payload: Record<string, unknown>) => {
    const r = await fetch("/api/tactics", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ eventId, op, payload }) });
    return r.json().catch(() => null);
  }, [eventId]);

  const placedIds = new Set(slots.filter((s) => s.player_id).map((s) => s.player_id));
  const bench = players.filter((p) => !placedIds.has(p.id));
  const byId = (id: string | null) => players.find((p) => p.id === id);
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 1800); };

  const changeFormation = (f: string) => { setFormation(f); setSlots(buildSlots(f, slots)); };
  const tapSlot = (i: number) => {
    const occupied = !!slots[i].player_id;
    setSlots((cur) => {
      const next = [...cur];
      if (next[i].player_id) { next[i] = { ...next[i], player_id: null }; return next; }
      if (sel) {
        const cleared = next.map((s) => (s.player_id === sel ? { ...s, player_id: null } : s));
        cleared[i] = { ...cleared[i], player_id: sel };
        return cleared;
      }
      return next;
    });
    if (!occupied && sel) setSel(null);
  };

  const save = async (asNew = false) => {
    const id = asNew ? null : planId;
    const res = await post("save", { id, name, formation, slots });
    if (res?.id) {
      const plan: LineupPlan = { id: res.id, team_id: "", event_id: eventId, name, formation, slots, created_at: new Date().toISOString() };
      setPlans((ps) => (ps.some((x) => x.id === res.id) ? ps.map((x) => (x.id === res.id ? plan : x)) : [...ps, plan]));
      setPlanId(res.id); flash("Saved ✓");
    }
  };
  const loadPlan = (pl: LineupPlan) => { setPlanId(pl.id); setName(pl.name); setFormation(pl.formation); setSlots(pl.slots?.length ? pl.slots : buildSlots(pl.formation, [])); setSel(null); };
  const delPlan = async (id: string) => { await post("delete", { id }); setPlans((ps) => ps.filter((x) => x.id !== id)); if (planId === id) { setPlanId(null); setName("Plan"); } };
  const pushGame = async () => { await post("push", { slots }); flash("Lineup sent to the game ✓"); };

  const selP = byId(sel);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} className="input w-36 py-2" placeholder="Plan name" />
        <select value={formation} onChange={(e) => changeFormation(e.target.value)} className="input w-28 py-2">
          {Object.keys(FORMATIONS_8).map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <button onClick={() => save(false)} className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white active:scale-95">Save</button>
        <button onClick={() => save(true)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm active:scale-95">Save as new</button>
        {msg && <span className="text-sm font-medium text-emerald-600">{msg}</span>}
      </div>

      {plans.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {plans.map((pl) => (
            <span key={pl.id} className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${planId === pl.id ? "border-brand-400 bg-brand-50 text-brand-700" : "border-slate-300"}`}>
              <button onClick={() => loadPlan(pl)}>{pl.name} · {pl.formation}</button>
              <button onClick={() => delPlan(pl.id)} className="text-rose-400">×</button>
            </span>
          ))}
        </div>
      )}

      <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-emerald-700" style={{ aspectRatio: "3 / 4", background: "linear-gradient(#15803d,#166534)" }}>
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/30" />
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
        <div className="absolute left-1/2 top-0 h-10 w-24 -translate-x-1/2 border-x border-b border-white/30" />
        <div className="absolute left-1/2 bottom-0 h-10 w-24 -translate-x-1/2 border-x border-t border-white/30" />
        {slots.map((s, i) => {
          const pl = byId(s.player_id);
          return (
            <button key={i} onClick={() => tapSlot(i)} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
              {pl ? (
                <span className="flex h-11 w-11 flex-col items-center justify-center rounded-full text-[10px] font-bold leading-none text-white shadow" style={{ background: strengthColor(pl.strength) }}>
                  <span className="text-sm">{pl.jersey_number ?? ""}</span>
                  <span className="max-w-[40px] truncate">{pl.first_name}</span>
                </span>
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-white/60 text-[10px] font-semibold text-white/80">{s.pos}</span>
              )}
            </button>
          );
        })}
      </div>

      {selP && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-2 text-sm">
          <b>{selP.first_name} {selP.last_name}</b> · strength {selP.strength ?? "—"}{selP.preferred_position ? ` · best: ${selP.preferred_position}` : ""}
          {selP.coach_notes && <div className="text-xs text-slate-600">📝 {selP.coach_notes}</div>}
          <div className="mt-1 text-xs text-slate-500">Tap an empty spot on the pitch to place {selP.first_name}.</div>
        </div>
      )}

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Available — tap a player, then tap a spot</p>
        <div className="flex flex-wrap gap-2">
          {bench.map((p) => {
            const attending = attendingIds.includes(p.id);
            return (
              <button key={p.id} onClick={() => setSel(sel === p.id ? null : p.id)}
                className={`flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-white active:scale-95 ${sel === p.id ? "ring-2 ring-brand-400 ring-offset-1" : ""}`}
                style={{ background: strengthColor(p.strength) }}>
                {attending && <span>✓</span>}{p.jersey_number ? `${p.jersey_number} ` : ""}{p.first_name}
              </button>
            );
          })}
          {bench.length === 0 && <span className="text-sm text-slate-400">Everyone is on the pitch.</span>}
        </div>
        <p className="mt-1 text-xs text-slate-400">Color = strength (green strong → red developing). ✓ = marked attending. Tap a placed player to take them off.</p>
      </div>

      <button onClick={pushGame} className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-white active:scale-95">▶ Use this lineup in the game</button>
    </div>
  );
}
