"use client";
import { useState, useCallback, useMemo, useRef } from "react";
import { toPng } from "html-to-image";
import { Undo2, Sparkles, Eraser, Share2, Save, Plus, X } from "lucide-react";
import { FORMATIONS_8, type LineupSlot, type LineupPlan } from "@/lib/types";
import { PlayerAvatar } from "@/components/PlayerAvatar";

type P = {
  id: string; first_name: string; last_name: string;
  jersey_number: string | null; strength: number | null;
  preferred_position: string | null; coach_notes: string | null;
  avatar_url?: string | null;
};

const STRENGTH_COLORS: Record<number, string> = { 5: "#10b981", 4: "#22c55e", 3: "#f59e0b", 2: "#f97316", 1: "#f43f5e" };
const ringColor = (s: number | null) => (s && STRENGTH_COLORS[s]) || "rgba(255,255,255,.85)";

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
  const [history, setHistory] = useState<LineupSlot[][]>([]);
  const [plans, setPlans] = useState<LineupPlan[]>(initialPlans);
  const [planId, setPlanId] = useState<string | null>(initialPlans[0]?.id ?? null);
  const [name, setName] = useState(initialPlans[0]?.name ?? "Plan A");
  const [sel, setSel] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);

  const pitchRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; fromSlot: number | null; sx: number; sy: number; moved: boolean } | null>(null);

  const post = useCallback(async (op: string, payload: Record<string, unknown>) => {
    const r = await fetch("/api/tactics", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ eventId, op, payload }) });
    return r.json().catch(() => null);
  }, [eventId]);

  const byId = useCallback((id: string | null) => roster.find((p) => p.id === id), [roster]);
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 1800); };
  const apply = (next: LineupSlot[]) => { setHistory((h) => [...h, slots]); setSlots(next); };
  const undo = () => setHistory((h) => { if (!h.length) return h; setSlots(h[h.length - 1]); return h.slice(0, -1); });

  const placedIds = useMemo(() => new Set(slots.filter((s) => s.player_id).map((s) => s.player_id)), [slots]);
  const bench = useMemo(() => roster.filter((p) => !placedIds.has(p.id)).sort((a, b) => {
    const aa = attendingIds.includes(a.id) ? 0 : 1, bb = attendingIds.includes(b.id) ? 0 : 1;
    if (aa !== bb) return aa - bb;
    return (b.strength ?? 0) - (a.strength ?? 0);
  }), [roster, placedIds, attendingIds]);

  const changeFormation = (f: string) => { setFormation(f); apply(buildSlots(f, slots)); };

  const placeAt = (playerId: string, slotIndex: number, fromSlot: number | null) => {
    const next = slots.map((s) => ({ ...s }));
    const occupant = next[slotIndex].player_id;
    for (const s of next) if (s.player_id === playerId) s.player_id = null;
    next[slotIndex].player_id = playerId;
    if (occupant && occupant !== playerId && fromSlot != null && fromSlot !== slotIndex) next[fromSlot].player_id = occupant;
    apply(next);
  };
  const removeFromPitch = (playerId: string) => apply(slots.map((s) => (s.player_id === playerId ? { ...s, player_id: null } : s)));

  // ---- pointer drag (works for touch + mouse) ----
  const onDown = (e: React.PointerEvent, id: string, fromSlot: number | null) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { id, fromSlot, sx: e.clientX, sy: e.clientY, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = dragRef.current; if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 6) return;
    d.moved = true;
    setDrag({ id: d.id, x: e.clientX, y: e.clientY });
  };
  const onUp = (e: React.PointerEvent) => {
    const d = dragRef.current; dragRef.current = null; setDrag(null);
    if (!d) return;
    if (!d.moved) { setSel((s) => (s === d.id ? null : d.id)); return; }
    const rect = pitchRef.current?.getBoundingClientRect();
    if (!rect) return;
    const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (!inside) { if (d.fromSlot != null) removeFromPitch(d.id); return; }
    let best = -1, bestDist = Infinity;
    slots.forEach((s, i) => {
      const cx = rect.left + (rect.width * s.x) / 100, cy = rect.top + (rect.height * s.y) / 100;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    if (best >= 0 && bestDist < rect.width * 0.18) placeAt(d.id, best, d.fromSlot);
  };

  const tapSlot = (i: number) => { if (sel) { placeAt(sel, i, null); setSel(null); } };

  const autoPick = () => {
    const pool = roster.filter((p) => attendingIds.length === 0 || attendingIds.includes(p.id)).sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0));
    const used = new Set<string>();
    const next = buildSlots(formation, []).map((s) => ({ ...s }));
    const gk = next.findIndex((s) => s.pos === "GK");
    if (gk >= 0) {
      const keeper = pool.find((p) => !used.has(p.id) && /gk|keep|goal/i.test(p.preferred_position || ""));
      const pick = keeper || pool.find((p) => !used.has(p.id));
      if (pick) { used.add(pick.id); next[gk].player_id = pick.id; }
    }
    for (let i = 0; i < next.length; i++) { if (next[i].player_id) continue; const pick = pool.find((p) => !used.has(p.id)); if (pick) { used.add(pick.id); next[i].player_id = pick.id; } }
    apply(next); setSel(null); flash("Best XI filled ✨");
  };

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
  const loadPlan = (pl: LineupPlan) => { setPlanId(pl.id); setName(pl.name); setFormation(pl.formation); apply(pl.slots?.length ? pl.slots : buildSlots(pl.formation, [])); setSel(null); };
  const delPlan = async (id: string) => { await post("delete", { id }); setPlans((ps) => ps.filter((x) => x.id !== id)); if (planId === id) { setPlanId(null); setName("Plan"); } };
  const pushGame = async () => { await post("push", { slots }); flash("Lineup sent to the game ✓"); };

  const shareImage = async () => {
    if (!pitchRef.current) return;
    try {
      const url = await toPng(pitchRef.current, { pixelRatio: 2, cacheBust: true });
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], "lineup.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
      } else {
        const a = document.createElement("a"); a.href = url; a.download = "lineup.png"; a.click();
      }
    } catch { flash("Could not export"); }
  };

  const selP = byId(sel);
  const starters = slots.filter((s) => s.player_id).length;

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 lg:space-y-0" onPointerMove={onMove} onPointerUp={onUp}>
      {/* LEFT: pitch + actions */}
      <div className="space-y-3">
        {/* formation pills */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
            {Object.keys(FORMATIONS_8).map((f) => (
              <button key={f} onClick={() => changeFormation(f)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${formation === f ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"}`}>{f}</button>
            ))}
          </div>
          <span className="ml-2 shrink-0 text-xs font-medium text-slate-400">{starters}/8</span>
        </div>

        {/* PITCH */}
        <div ref={pitchRef}
          className="relative mx-auto w-full max-w-sm select-none overflow-hidden rounded-[22px] shadow-lift lg:max-w-none"
          style={{ aspectRatio: "3 / 4", background: "repeating-linear-gradient(0deg,#2aa052 0,#2aa052 12.5%,#239049 12.5%,#239049 25%)", touchAction: "none" }}>
          {/* lighting + vignette */}
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 80% at 50% 30%, rgba(255,255,255,.18), rgba(0,0,0,0) 55%), radial-gradient(140% 100% at 50% 100%, rgba(0,0,0,.28), rgba(0,0,0,0) 60%)" }} />
          {/* markings */}
          <svg viewBox="0 0 100 133" className="pointer-events-none absolute inset-0 h-full w-full" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="0.5">
            <rect x="3" y="3" width="94" height="127" rx="2" />
            <line x1="3" y1="66.5" x2="97" y2="66.5" />
            <circle cx="50" cy="66.5" r="11" />
            <circle cx="50" cy="66.5" r="0.8" fill="rgba(255,255,255,.7)" stroke="none" />
            <rect x="28" y="3" width="44" height="18" />
            <rect x="40" y="3" width="20" height="8" />
            <rect x="28" y="112" width="44" height="18" />
            <rect x="40" y="122" width="20" height="8" />
          </svg>

          {slots.map((s, i) => {
            const pl = byId(s.player_id);
            return (
              <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
                {pl ? (
                  <div onPointerDown={(e) => onDown(e, pl.id, i)}
                    className="flex cursor-grab flex-col items-center gap-0.5 active:cursor-grabbing"
                    style={{ animation: "pop .2s both" }}>
                    <div className="relative rounded-full p-[2px] shadow-token" style={{ background: ringColor(pl.strength) }}>
                      <PlayerAvatar name={`${pl.first_name} ${pl.last_name}`} photoUrl={pl.avatar_url} size={42} />
                      {pl.jersey_number && (
                        <span className="absolute -bottom-1 -right-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-white ring-2 ring-white">{pl.jersey_number}</span>
                      )}
                    </div>
                    <span className="max-w-[68px] truncate rounded bg-black/50 px-1.5 text-[10px] font-semibold leading-4 text-white">{pl.first_name}</span>
                  </div>
                ) : (
                  <button onClick={() => tapSlot(i)}
                    className="grid h-11 w-11 place-items-center rounded-full border-2 border-dashed border-white/60 text-[10px] font-bold text-white/85 transition hover:bg-white/10">{s.pos}</button>
                )}
              </div>
            );
          })}
        </div>

        {/* action bar */}
        <div className="flex flex-wrap gap-2">
          <button onClick={autoPick} className="btn-primary flex-1"><Sparkles size={16} /> Auto-pick best XI</button>
          <button onClick={undo} disabled={!history.length} className="btn-ghost"><Undo2 size={16} /> Undo</button>
          <button onClick={() => apply(buildSlots(formation, []))} className="btn-ghost"><Eraser size={16} /> Clear</button>
          <button onClick={shareImage} className="btn-ghost"><Share2 size={16} /> Share</button>
        </div>
        {msg && <p className="text-center text-sm font-semibold text-emerald-600">{msg}</p>}
      </div>

      {/* RIGHT: squad + controls */}
      <div className="space-y-4">
        {selP && (
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlayerAvatar name={`${selP.first_name} ${selP.last_name}`} photoUrl={selP.avatar_url} size={36} />
                <div>
                  <p className="font-bold text-ink">{selP.jersey_number ? `#${selP.jersey_number} ` : ""}{selP.first_name} {selP.last_name}</p>
                  {selP.preferred_position && <p className="text-xs text-slate-500">Best: {selP.preferred_position}</p>}
                </div>
              </div>
              <button onClick={() => setSel(null)} className="text-slate-400"><X size={16} /></button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Strength</span>
              <StarPicker value={selP.strength} onPick={(v) => setStrength(selP.id, v)} />
            </div>
            {placedIds.has(selP.id) && <button onClick={() => removeFromPitch(selP.id)} className="mt-2 text-xs font-semibold text-rose-500">Take off the pitch</button>}
          </div>
        )}

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Squad — drag onto the pitch</p>
          <div className="flex flex-wrap gap-2">
            {bench.map((p) => (
              <div key={p.id} onPointerDown={(e) => onDown(e, p.id, null)}
                className={`flex cursor-grab items-center gap-1.5 rounded-full border bg-white py-1 pl-1 pr-3 text-sm font-semibold text-ink shadow-card transition active:cursor-grabbing ${sel === p.id ? "border-brand-500 ring-2 ring-brand-200" : "border-slate-200"}`}
                style={{ touchAction: "none" }}>
                <span className="relative">
                  <PlayerAvatar name={`${p.first_name} ${p.last_name}`} photoUrl={p.avatar_url} size={26} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ background: ringColor(p.strength) }} />
                </span>
                {p.first_name}
                {attendingIds.includes(p.id) && <span className="text-emerald-500">✓</span>}
              </div>
            ))}
            {bench.length === 0 && <span className="text-sm text-slate-400">Everyone is on the pitch.</span>}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">Tip: drag a player onto a spot, or drag them off to bench. ✓ = attending.</p>
        </div>

        {/* save + plans */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input min-w-0 flex-1 py-2" placeholder="Lineup name" />
            <button onClick={() => save(false)} className="btn-dark"><Save size={15} /> Save</button>
            <button onClick={() => save(true)} className="btn-ghost"><Plus size={15} /> New</button>
          </div>
          {plans.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {plans.map((pl) => (
                <span key={pl.id} className={`chip border ${planId === pl.id ? "border-brand-400 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600"}`}>
                  <button onClick={() => loadPlan(pl)}>{pl.name} · {pl.formation}</button>
                  <button onClick={() => delPlan(pl.id)} className="text-rose-400">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button onClick={pushGame} className="btn w-full bg-emerald-600 py-3.5 text-base font-bold text-white shadow-card hover:bg-emerald-700">▶ Use this lineup in the game</button>
      </div>

      {/* drag ghost */}
      {drag && (() => { const p = byId(drag.id); if (!p) return null; return (
        <div className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2" style={{ left: drag.x, top: drag.y }}>
          <div className="rounded-full p-[2px] shadow-token" style={{ background: ringColor(p.strength) }}>
            <PlayerAvatar name={`${p.first_name} ${p.last_name}`} photoUrl={p.avatar_url} size={46} />
          </div>
        </div>
      ); })()}
    </div>
  );
}

function StarPicker({ value, onPick }: { value: number | null; onPick: (v: number) => void }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onPick(n)} aria-label={`Strength ${n}`}
          className={`text-lg leading-none transition ${value && n <= value ? "text-amber-400" : "text-slate-300"}`}>★</button>
      ))}
    </span>
  );
}
