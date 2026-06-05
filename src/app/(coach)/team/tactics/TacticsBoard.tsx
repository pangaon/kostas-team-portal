"use client";
import { useState, useCallback, useMemo } from "react";
import { FORMATIONS_8, type LineupSlot, type LineupPlan } from "@/lib/types";

type P = {
  id: string; first_name: string; last_name: string;
  jersey_number: string | null; strength: number | null;
  preferred_position: string | null; coach_notes: string | null;
};

const STRENGTH_COLORS: Record<number, string> = {
  5: "#10b981", 4: "#22c55e", 3: "#f59e0b", 2: "#f97316", 1: "#f43f5e",
};
const strengthColor = (s: number | null) => (s && STRENGTH_COLORS[s]) || "#94a3b8";

function buildSlots(formation: string, prev: LineupSlot[]): LineupSlot[] {
  const base = FORMATIONS_8[formation] ?? FORMATIONS_8["3-3-1"];
  const ids = prev.filter((s) => s.player_id).map((s) => s.player_id);
  return base.map((b, i) => ({ ...b, player_id: ids[i] ?? null }));
}

export function TacticsBoard({ eventId, players, attendingIds, initialPlans }: {
  eventId: string; players: P[]; attendingIds: string[]; initialPlans: LineupPlan[];
}) {
  const [roster, setRoster] = useState<P[]>(players);
  const [formation, setFormation] = useState(initialPlans[0]?.formation ?? "3-3-1");
  const [slots, setSlots] = useState<LineupSlot[]>(
    initialPlans[0]?.slots?.length ? initialPlans[0].slots : buildSlots(initialPlans[0]?.formation ?? "3-3-1", [])
  );
  const [plans, setPlans] = useState<LineupPlan[]>(initialPlans);
  const [planId, setPlanId] = useState<string | null>(initialPlans[0]?.id ?? null);
  const [name, setName] = useState(initialPlans[0]?.name ?? "Plan A");
  const [sel, setSel] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [showStrengths, setShowStrengths] = useState(false);

  const post = useCallback(async (op: string, payload: Record<string, unknown>) => {
    const r = await fetch("/api/tactics", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId, op, payload }),
    });
    return r.json().catch(() => null);
  }, [eventId]);

  const byId = useCallback((id: string | null) => roster.find((p) => p.id === id), [roster]);
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 1800); };

  const placedIds = useMemo(() => new Set(slots.filter((s) => s.player_id).map((s) => s.player_id)), [slots]);
  const bench = useMemo(() => {
    return roster.filter((p) => !placedIds.has(p.id)).sort((a, b) => {
      const aa = attendingIds.includes(a.id) ? 0 : 1, bb = attendingIds.includes(b.id) ? 0 : 1;
      if (aa !== bb) return aa - bb;
      return (b.strength ?? 0) - (a.strength ?? 0);
    });
  }, [roster, placedIds, attendingIds]);

  const changeFormation = (f: string) => { setFormation(f); setSlots(buildSlots(f, slots)); };

  const tapSlot = (i: number) => {
    setSlots((cur) => {
      const next = [...cur];
      if (next[i].player_id) {
        // tapping a filled slot selects that player (to edit) and removes from pitch
        setSel(next[i].player_id);
        next[i] = { ...next[i], player_id: null };
        return next;
      }
      if (sel) {
        const cleared = next.map((s) => (s.player_id === sel ? { ...s, player_id: null } : s));
        cleared[i] = { ...cleared[i], player_id: sel };
        setSel(null);
        return cleared;
      }
      return next;
    });
  };

  const autoPick = () => {
    const pool = roster
      .filter((p) => attendingIds.length === 0 || attendingIds.includes(p.id))
      .sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0));
    const used = new Set<string>();
    const next = buildSlots(formation, []).map((s) => {
      const pick = pool.find((p) => !used.has(p.id));
      if (pick) { used.add(pick.id); return { ...s, player_id: pick.id }; }
      return s;
    });
    setSlots(next); setSel(null); flash("Best XI filled ✨");
  };

  const clearPitch = () => { setSlots(buildSlots(formation, [])); setSel(null); };

  const setStrength = async (playerId: string, val: number) => {
    setRoster((r) => r.map((p) => (p.id === playerId ? { ...p, strength: val } : p)));
    await post("setStrength", { playerId, strength: val });
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
  const loadPlan = (pl: LineupPlan) => {
    setPlanId(pl.id); setName(pl.name); setFormation(pl.formation);
    setSlots(pl.slots?.length ? pl.slots : buildSlots(pl.formation, [])); setSel(null);
  };
  const delPlan = async (id: string) => {
    await post("delete", { id });
    setPlans((ps) => ps.filter((x) => x.id !== id));
    if (planId === id) { setPlanId(null); setName("Plan"); }
  };
  const pushGame = async () => { await post("push", { slots }); flash("Lineup sent to the game ✓"); };

  const selP = byId(sel);
  const startersCount = slots.filter((s) => s.player_id).length;

  return (
    <div className="space-y-4">
      {/* Formation segmented control */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Formation</span>
          <span className="text-xs text-slate-400">{startersCount}/8 placed</span>
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
          {Object.keys(FORMATIONS_8).map((f) => (
            <button key={f} onClick={() => changeFormation(f)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                formation === f ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* PITCH */}
      <div
        className="relative mx-auto w-full max-w-sm overflow-hidden rounded-[20px] shadow-[inset_0_2px_24px_rgba(0,0,0,0.35),0_8px_24px_rgba(0,0,0,0.18)]"
        style={{
          aspectRatio: "3 / 4",
          background:
            "repeating-linear-gradient(0deg,#1f9d4d 0,#1f9d4d 12.5%,#1c9147 12.5%,#1c9147 25%)",
        }}
      >
        {/* markings */}
        <div className="pointer-events-none absolute inset-2 rounded-[14px] border-2 border-white/35" />
        <div className="pointer-events-none absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 bg-white/35" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/35" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50" />
        {/* top goal + box */}
        <div className="pointer-events-none absolute left-1/2 top-2 h-12 w-32 -translate-x-1/2 border-2 border-t-0 border-white/35" />
        <div className="pointer-events-none absolute left-1/2 top-2 h-6 w-16 -translate-x-1/2 border-2 border-t-0 border-white/35" />
        {/* bottom goal + box */}
        <div className="pointer-events-none absolute bottom-2 left-1/2 h-12 w-32 -translate-x-1/2 border-2 border-b-0 border-white/35" />
        <div className="pointer-events-none absolute bottom-2 left-1/2 h-6 w-16 -translate-x-1/2 border-2 border-b-0 border-white/35" />

        {slots.map((s, i) => {
          const pl = byId(s.player_id);
          return (
            <button key={i} onClick={() => tapSlot(i)}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 focus:outline-none"
              style={{ left: `${s.x}%`, top: `${s.y}%` }}>
              {pl ? (
                <>
                  <span className="grid h-11 w-11 place-items-center rounded-full text-base font-extrabold text-white shadow-md ring-2 ring-white/70"
                    style={{ background: strengthColor(pl.strength) }}>
                    {pl.jersey_number ?? pl.first_name.charAt(0)}
                  </span>
                  <span className="max-w-[64px] truncate rounded bg-black/45 px-1.5 text-[10px] font-semibold leading-4 text-white">
                    {pl.first_name}
                  </span>
                </>
              ) : (
                <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-dashed border-white/55 text-[10px] font-bold text-white/85">
                  {s.pos}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick actions under pitch */}
      <div className="flex gap-2">
        <button onClick={autoPick}
          className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white active:scale-95">
          ✨ Auto-pick best XI
        </button>
        <button onClick={clearPitch}
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 active:scale-95">
          Clear
        </button>
      </div>

      {/* Selected player card with inline strength stars */}
      {selP && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">
                {selP.jersey_number ? `#${selP.jersey_number} ` : ""}{selP.first_name} {selP.last_name}
              </p>
              {selP.preferred_position && <p className="text-xs text-slate-500">Best position: {selP.preferred_position}</p>}
            </div>
            <button onClick={() => setSel(null)} className="text-sm text-slate-400">✕</button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Strength</span>
            <StarPicker value={selP.strength} onPick={(v) => setStrength(selP.id, v)} />
          </div>
          {selP.coach_notes && <p className="mt-2 text-xs text-slate-500">📝 {selP.coach_notes}</p>}
          <p className="mt-2 text-xs text-slate-400">Tap an empty spot on the pitch to place {selP.first_name}.</p>
        </div>
      )}

      {/* Bench / available */}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Available — tap a player, then tap a spot
        </p>
        <div className="flex flex-wrap gap-2">
          {bench.map((p) => {
            const attending = attendingIds.includes(p.id);
            return (
              <button key={p.id} onClick={() => setSel(sel === p.id ? null : p.id)}
                className={`flex items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-semibold text-white shadow-sm active:scale-95 ${
                  sel === p.id ? "ring-2 ring-brand-500 ring-offset-1" : ""}`}
                style={{ background: strengthColor(p.strength) }}>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/25 text-xs">
                  {p.jersey_number ?? p.first_name.charAt(0)}
                </span>
                {p.first_name}
                {attending && <span title="Marked attending">✓</span>}
              </button>
            );
          })}
          {bench.length === 0 && <span className="text-sm text-slate-400">Everyone is on the pitch.</span>}
        </div>
      </div>

      {/* Squad strength editor */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <button onClick={() => setShowStrengths((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700">
          <span>⭐ Set player strengths</span>
          <span className="text-slate-400">{showStrengths ? "▲" : "▼"}</span>
        </button>
        {showStrengths && (
          <div className="space-y-1 border-t border-slate-100 px-3 py-2">
            {roster.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 py-1.5">
                <span className="flex items-center gap-2 truncate text-sm text-slate-700">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: strengthColor(p.strength) }}>
                    {p.jersey_number ?? p.first_name.charAt(0)}
                  </span>
                  <span className="truncate">{p.first_name} {p.last_name}</span>
                </span>
                <StarPicker value={p.strength} onPick={(v) => setStrength(p.id, v)} />
              </div>
            ))}
            {roster.length === 0 && <p className="py-2 text-sm text-slate-400">No players yet — add them in Roster.</p>}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
        <span className="flex items-center gap-1"><Dot c="#10b981" /> Strong</span>
        <span className="flex items-center gap-1"><Dot c="#f59e0b" /> Solid</span>
        <span className="flex items-center gap-1"><Dot c="#f43f5e" /> Developing</span>
        <span className="flex items-center gap-1"><Dot c="#94a3b8" /> Not rated</span>
        <span>· ✓ = attending</span>
      </div>

      {/* Save / plans */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="input min-w-0 flex-1 py-2" placeholder="Lineup name" />
          <button onClick={() => save(false)}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white active:scale-95">Save</button>
          <button onClick={() => save(true)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm active:scale-95">+ New</button>
          {msg && <span className="text-sm font-semibold text-emerald-600">{msg}</span>}
        </div>
        {plans.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {plans.map((pl) => (
              <span key={pl.id}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                  planId === pl.id ? "border-brand-400 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600"}`}>
                <button onClick={() => loadPlan(pl)} className="font-semibold">{pl.name} · {pl.formation}</button>
                <button onClick={() => delPlan(pl.id)} className="text-rose-400">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button onClick={pushGame}
        className="w-full rounded-xl bg-emerald-600 py-3.5 font-bold text-white shadow-sm active:scale-95">
        ▶ Use this lineup in the game
      </button>
    </div>
  );
}

function StarPicker({ value, onPick }: { value: number | null; onPick: (v: number) => void }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onPick(n)} aria-label={`Strength ${n}`}
          className={`text-lg leading-none transition ${value && n <= value ? "text-amber-400" : "text-slate-300"}`}>
          ★
        </button>
      ))}
    </span>
  );
}

function Dot({ c }: { c: string }) {
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c }} />;
}
