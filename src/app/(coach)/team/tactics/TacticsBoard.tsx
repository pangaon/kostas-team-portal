"use client";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { toPng } from "html-to-image";
import { Undo2, Sparkles, Eraser, Share2, Save, Plus, X } from "lucide-react";
import { type LineupSlot, type LineupPlan } from "@/lib/types";
import { PlayerAvatar } from "@/components/PlayerAvatar";

type P = {
  id: string; first_name: string; last_name: string;
  jersey_number: string | null; strength: number | null;
  preferred_position: string | null; coach_notes: string | null;
  avatar_url?: string | null;
};

const STRENGTH_COLORS: Record<number, string> = { 5: "#10b981", 4: "#22c55e", 3: "#f59e0b", 2: "#f97316", 1: "#f43f5e" };
const ringColor = (s: number | null) => (s && STRENGTH_COLORS[s]) || "rgba(255,255,255,.85)";

function buildSlots(formations: Record<string, { pos: string; x: number; y: number }[]>, formation: string, prev: LineupSlot[]): LineupSlot[] {
  const base = formations[formation] ?? Object.values(formations)[0] ?? [];
  const ids = prev.filter((s) => s.player_id).map((s) => s.player_id);
  return base.map((b, i) => ({ ...b, player_id: ids[i] ?? null }));
}

export function TacticsBoard({ eventId, players, attendingIds, initialPlans, formations, surface }: {
  eventId: string; players: P[]; attendingIds: string[]; initialPlans: LineupPlan[];
  formations: Record<string, { pos: string; x: number; y: number }[]>; surface: string;
}) {
  const formationNames = Object.keys(formations);
  const lightSurface = surface === "court" || surface === "rink";
  const [roster, setRoster] = useState<P[]>(players);
  const [formation, setFormation] = useState(initialPlans[0]?.formation && formations[initialPlans[0].formation] ? initialPlans[0].formation : formationNames[0]);
  const [slots, setSlots] = useState<LineupSlot[]>(
    initialPlans[0]?.slots?.length ? initialPlans[0].slots : buildSlots(formations, formationNames[0], [])
  );
  const [history, setHistory] = useState<LineupSlot[][]>([]);
  const [plans, setPlans] = useState<LineupPlan[]>(initialPlans);
  const [planId, setPlanId] = useState<string | null>(initialPlans[0]?.id ?? null);
  const [name, setName] = useState(initialPlans[0]?.name ?? "Plan A");
  const [sel, setSel] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);

  const pitchRef = useRef<HTMLDivElement>(null);
  const draftKey = `tactics_draft_${eventId}`;
  const dragRef = useRef<{ id: string; fromSlot: number | null; sx: number; sy: number; moved: boolean } | null>(null);

  const post = useCallback(async (op: string, payload: Record<string, unknown>) => {
    const r = await fetch("/api/tactics", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ eventId, op, payload }) });
    return r.json().catch(() => null);
  }, [eventId]);

  useEffect(() => {
    try { const raw = localStorage.getItem(draftKey); if (raw) { const d = JSON.parse(raw); if (d?.slots?.length) { setFormation(d.formation); setSlots(d.slots); if (d.name) setName(d.name); } } } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try { localStorage.setItem(draftKey, JSON.stringify({ formation, slots, name })); } catch {}
  }, [draftKey, formation, slots, name]);

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

  const linesByPlayer = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const pl of plans) for (const sl of (pl.slots ?? [])) if (sl.player_id) (m[sl.player_id] ??= []).push(pl.name);
    return m;
  }, [plans]);
  const planPlayers = (pl: LineupPlan) => (pl.slots ?? []).filter((sl) => sl.player_id).map((sl) => { const p = byId(sl.player_id); return p ? `${p.first_name}${p.jersey_number ? " #" + p.jersey_number : ""}` : "?"; });
  const inAnyLine = new Set(Object.keys(linesByPlayer));

  const changeFormation = (f: string) => { setFormation(f); apply(buildSlots(formations, f, slots)); };

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
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { id, fromSlot, sx: e.clientX, sy: e.clientY, moved: false };
  };
  const noNativeDrag = (e: React.DragEvent) => e.preventDefault();
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
    const next = buildSlots(formations, formation, []).map((s) => ({ ...s }));
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
  const loadPlan = (pl: LineupPlan) => { setPlanId(pl.id); setName(pl.name); setFormation(pl.formation); apply(pl.slots?.length ? pl.slots : buildSlots(formations, pl.formation, [])); setSel(null); };
  const newBlank = () => { setPlanId(null); setName(`Line ${plans.length + 1}`); apply(buildSlots(formations, formation, [])); setSel(null); flash("New blank line — Save to keep it"); };
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
            {formationNames.map((f) => (
              <button key={f} onClick={() => changeFormation(f)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${formation === f ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"}`}>{f}</button>
            ))}
          </div>
          <span className="ml-2 shrink-0 text-xs font-medium text-slate-400">{starters}/8</span>
        </div>

        {/* PITCH */}
        <div ref={pitchRef}
          className="relative mx-auto w-full max-w-sm select-none overflow-hidden rounded-[22px] shadow-lift lg:max-w-none"
          style={{ aspectRatio: "3 / 4", background: SURFACE_BG[surface] ?? SURFACE_BG.pitch, touchAction: "none" }}>
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 80% at 50% 30%, rgba(255,255,255,.16), rgba(0,0,0,0) 55%), radial-gradient(140% 100% at 50% 100%, rgba(0,0,0,.22), rgba(0,0,0,0) 60%)" }} />
          <SurfaceMarkings surface={surface} />

          {slots.map((s, i) => {
            const pl = byId(s.player_id);
            return (
              <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
                {pl ? (
                  <div onPointerDown={(e) => onDown(e, pl.id, i)} onDragStart={noNativeDrag} draggable={false}
                    className="flex cursor-grab select-none flex-col items-center gap-0.5 active:cursor-grabbing"
                    style={{ animation: "pop .2s both", touchAction: "none" }}>
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
                    className={`grid h-10 w-10 place-items-center rounded-full border text-[10px] font-bold backdrop-blur-[1px] transition ${lightSurface ? "border-slate-500/40 bg-black/5 text-slate-700 hover:bg-black/10" : "border-white/45 bg-white/10 text-white/80 hover:bg-white/20"}`}>{s.pos}</button>
                )}
              </div>
            );
          })}
        </div>

        {/* action bar */}
        <div className="flex flex-wrap gap-2">
          <button onClick={autoPick} className="btn-primary flex-1"><Sparkles size={16} /> Auto-pick best XI</button>
          <button onClick={undo} disabled={!history.length} className="btn-ghost"><Undo2 size={16} /> Undo</button>
          <button onClick={() => apply(buildSlots(formations, formation, []))} className="btn-ghost"><Eraser size={16} /> Clear</button>
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
              <button onClick={() => setSel(null)} aria-label="Close player panel" className="text-slate-400"><X size={16} /></button>
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
              <div key={p.id} onPointerDown={(e) => onDown(e, p.id, null)} onDragStart={noNativeDrag} draggable={false}
                className={`flex cursor-grab select-none items-center gap-1.5 rounded-full border bg-white py-1 pl-1 pr-3 text-sm font-semibold text-ink shadow-card transition active:cursor-grabbing ${sel === p.id ? "border-brand-500 ring-2 ring-brand-200" : "border-slate-200"}`}
                style={{ touchAction: "none" }}>
                <span className="relative">
                  <PlayerAvatar name={`${p.first_name} ${p.last_name}`} photoUrl={p.avatar_url} size={26} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ background: ringColor(p.strength) }} />
                </span>
                <span>{p.jersey_number ? <span className="text-slate-400">#{p.jersey_number} </span> : ""}{p.first_name}</span>
                {attendingIds.includes(p.id) && <span className="text-emerald-500">✓</span>}
                {linesByPlayer[p.id]?.length ? <span title={`In lines: ${linesByPlayer[p.id].join(", ")}`} className="rounded bg-violet-100 px-1 text-[9px] font-bold text-violet-700">{linesByPlayer[p.id].length}🅛</span> : null}
              </div>
            ))}
            {bench.length === 0 && <span className="text-sm text-slate-400">Everyone is on the pitch.</span>}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">Tip: drag a player onto a spot, or drag them off to bench. ✓ = attending.</p>
        </div>

        {/* save + lines */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <p className={`mb-2 text-xs font-semibold ${planId ? "text-brand-600" : "text-slate-400"}`}>
            {planId ? `✏️ Editing “${name}” — Save updates this line` : "🆕 New line — Save creates a new one"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input min-w-0 flex-1 py-2" placeholder="Line name (e.g. Aces)" />
            <button onClick={() => save(false)} className="btn-dark"><Save size={15} /> {planId ? "Update" : "Save"}</button>
            {planId && <button onClick={() => save(true)} className="btn-ghost"><Plus size={15} /> Save as new</button>}
            <button onClick={newBlank} className="btn-ghost">New blank</button>
          </div>
          {plans.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Saved lines — tap to load</p>
              <div className="flex flex-wrap gap-2">
                {plans.map((pl) => (
                  <span key={pl.id} className={`chip border ${planId === pl.id ? "border-brand-400 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600"}`}>
                    <button onClick={() => loadPlan(pl)}>{pl.name} · {pl.formation}</button>
                    <button onClick={() => delPlan(pl.id)} className="text-rose-400" aria-label="Delete line">×</button>
                  </span>
                ))}
              </div>

              <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50">
                <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-ink">📋 Who&rsquo;s on each line</summary>
                <div className="space-y-2 px-3 pb-3">
                  {plans.map((pl) => (
                    <div key={pl.id}>
                      <p className="text-xs font-semibold text-brand-700">{pl.name} <span className="text-slate-400">· {planPlayers(pl).length} players</span></p>
                      <p className="text-sm text-slate-600">{planPlayers(pl).join(", ") || "—"}</p>
                    </div>
                  ))}
                  {roster.filter((p) => !inAnyLine.has(p.id)).length > 0 && (
                    <div className="border-t border-slate-200 pt-2">
                      <p className="text-xs font-semibold text-amber-700">Not in any line yet</p>
                      <p className="text-sm text-slate-600">{roster.filter((p) => !inAnyLine.has(p.id)).map((p) => p.first_name).join(", ")}</p>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>

        <button onClick={pushGame} className="btn w-full bg-emerald-600 py-3.5 text-base font-bold text-white shadow-card hover:bg-emerald-700">▶ Use this lineup in the game</button>
      </div>

      {/* drag ghost (portal to body so it tracks the cursor exactly) */}
      {drag && typeof document !== "undefined" && (() => { const p = byId(drag.id); if (!p) return null; return createPortal(
        <div className="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-1/2" style={{ left: drag.x, top: drag.y }}>
          <div className="rounded-full p-[2px] shadow-token" style={{ background: ringColor(p.strength) }}>
            <PlayerAvatar name={`${p.first_name} ${p.last_name}`} photoUrl={p.avatar_url} size={46} />
          </div>
        </div>, document.body
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


const SURFACE_BG: Record<string, string> = {
  pitch: "repeating-linear-gradient(90deg,#2b8d4f 0,#2b8d4f 11.11%,#26824a 11.11%,#26824a 22.22%)",
  court: "linear-gradient(180deg,#d9a066,#cf9356)",
  rink: "linear-gradient(180deg,#eaf2fb,#d8e6f5)",
  diamond: "radial-gradient(circle at 50% 62%, #c89a5b 0 26%, #2f9b50 27%)",
};

function SurfaceMarkings({ surface }: { surface: string }) {
  if (surface === "court") {
    return (
      <svg viewBox="0 0 100 133" className="pointer-events-none absolute inset-0 h-full w-full" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="0.6">
        <rect x="3" y="3" width="94" height="127" rx="2" />
        <line x1="3" y1="66.5" x2="97" y2="66.5" />
        <circle cx="50" cy="66.5" r="10" />
        <rect x="34" y="3" width="32" height="33" /><circle cx="50" cy="36" r="10" />
        <rect x="34" y="97" width="32" height="33" /><circle cx="50" cy="97" r="10" />
        <path d="M14 3 A 40 40 0 0 0 14 53" /><path d="M86 3 A 40 40 0 0 1 86 53" />
        <path d="M14 130 A 40 40 0 0 1 14 80" /><path d="M86 130 A 40 40 0 0 0 86 80" />
      </svg>
    );
  }
  if (surface === "rink") {
    return (
      <svg viewBox="0 0 100 133" className="pointer-events-none absolute inset-0 h-full w-full" fill="none">
        <rect x="3" y="3" width="94" height="127" rx="14" stroke="rgba(40,80,140,.35)" strokeWidth="0.6" />
        <line x1="3" y1="66.5" x2="97" y2="66.5" stroke="#d22" strokeWidth="1" />
        <line x1="3" y1="44" x2="97" y2="44" stroke="#2456c8" strokeWidth="1" />
        <line x1="3" y1="89" x2="97" y2="89" stroke="#2456c8" strokeWidth="1" />
        <circle cx="50" cy="66.5" r="9" stroke="#2456c8" strokeWidth="0.6" />
      </svg>
    );
  }
  if (surface === "diamond") {
    return (
      <svg viewBox="0 0 100 133" className="pointer-events-none absolute inset-0 h-full w-full" fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="0.6">
        <path d="M50 86 L74 60 L50 34 L26 60 Z" />
        <rect x="48" y="84" width="4" height="4" fill="#fff" stroke="none" />
        <rect x="72" y="58" width="4" height="4" fill="#fff" stroke="none" />
        <rect x="48" y="32" width="4" height="4" fill="#fff" stroke="none" />
        <rect x="24" y="58" width="4" height="4" fill="#fff" stroke="none" />
        <circle cx="50" cy="60" r="3" />
      </svg>
    );
  }
  // pitch (soccer)
  return (
    <svg viewBox="0 0 100 133" className="pointer-events-none absolute inset-0 h-full w-full" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="0.5">
      <rect x="3" y="3" width="94" height="127" rx="2" />
      <line x1="3" y1="66.5" x2="97" y2="66.5" />
      <circle cx="50" cy="66.5" r="11" />
      <circle cx="50" cy="66.5" r="0.8" fill="rgba(255,255,255,.7)" stroke="none" />
      <rect x="28" y="3" width="44" height="18" /><rect x="40" y="3" width="20" height="8" />
      <rect x="28" y="112" width="44" height="18" /><rect x="40" y="122" width="20" height="8" />
    </svg>
  );
}