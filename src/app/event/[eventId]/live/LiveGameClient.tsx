"use client";
import Link from "next/link";
import { useState, useCallback, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Undo2, X, Timer } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";

type P = { id: string; first_name: string; last_name: string; jersey_number: string | null; allergies: string | null; emergency_contact_name: string | null; emergency_contact_phone: string | null; guardian_phone: string | null; avatar_url?: string | null; strength?: number | null };
type FieldState = Record<string, { status: "starter" | "bench" | "out"; position: string | null }>;
type Goal = { id: string; player_id: string | null; saved: boolean; minute?: number | null };
type Sub = { id: string; player_in: string; player_out: string; saved: boolean };
type Plan = { id: string; name: string; slots: { pos: string; player_id: string | null }[] };

const POSITIONS = ["GK", "DEF", "MID", "FWD"];
const fullName = (p: P) => `${p.first_name} ${p.last_name}`;
const fmtMin = (sec: number) => { const m = Math.floor(sec / 60), s = Math.floor(sec % 60); return `${m}:${String(s).padStart(2, "0")}`; };

export function LiveGameClient(props: {
  eventId: string; teamName: string; opponent: string; title: string; when: string;
  initUs: number; initThem: number;
  players: P[]; initField: FieldState; initGoals: Goal[]; initNotes: string[]; initSubs: Sub[];
  startsBy: Record<string, number>; plans: Plan[];
  sport: { label: string; emoji: string; scoreTerm: string; scoreEmoji: string; onField: number; periodType: string; periodCount: number; defaultPeriodMin: number; timed: boolean; positions: string[]; hasPitch: boolean };
}) {
  const { eventId, players, plans, sport } = props;
  const ordinal = (n: number) => { const e = ["th", "st", "nd", "rd"], v = n % 100; return n + (e[(v - 20) % 10] || e[v] || e[0]); };
  const keeperPos = sport.positions.includes("GK") ? "GK" : sport.positions.includes("G") ? "G" : null;
  const [us, setUs] = useState(props.initUs);
  const [them, setThem] = useState(props.initThem);
  const [field, setField] = useState<FieldState>(props.initField);
  const [goals, setGoals] = useState<Goal[]>(props.initGoals);
  const [notes, setNotes] = useState<string[]>(props.initNotes);
  const [subs, setSubs] = useState<Sub[]>(props.initSubs);
  const [noteText, setNoteText] = useState("");
  const [outSel, setOutSel] = useState("");
  const [inSel, setInSel] = useState("");
  const [showMins, setShowMins] = useState(false);

  // ---------- clock w/ halves + playing-time ----------
  const ckey = `live_v2_${eventId}`;
  const [halfLen, setHalfLen] = useState(sport.defaultPeriodMin || 25); // minutes per period
  const [half, setHalf] = useState(1);
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0); // forces re-render each second
  const baseRef = useRef(0);           // committed seconds in current half
  const startedRef = useRef<number | null>(null);
  const minsRef = useRef<Record<string, number>>({});      // committed seconds played
  const onSinceRef = useRef<Record<string, number | null>>({});
  const lastWrittenRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const endAlertedRef = useRef(false);

  const persist = useCallback(() => {
    try { localStorage.setItem(ckey, JSON.stringify({ halfLen, half, base: baseRef.current, startedAt: startedRef.current, mins: minsRef.current, onSince: onSinceRef.current })); } catch {}
  }, [ckey, halfLen, half]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ckey);
      if (raw) { const o = JSON.parse(raw);
        setHalfLen(o.halfLen ?? (sport.defaultPeriodMin || 25)); setHalf(o.half ?? 1);
        baseRef.current = o.base ?? 0; startedRef.current = o.startedAt ?? null;
        minsRef.current = o.mins ?? {}; onSinceRef.current = o.onSince ?? {};
        setRunning(!!o.startedAt);
      }
    } catch {}
  }, [ckey]);

  const ensureAudio = () => { try { if (!audioRef.current) audioRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); audioRef.current?.resume?.(); } catch {} };
  const playWhistle = (long = false) => {
    try {
      const ctx = audioRef.current; if (!ctx) return;
      const blast = (t: number, f: number, d: number) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = "square"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.4, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.start(t); o.stop(t + d); };
      const now = ctx.currentTime;
      blast(now, 1760, 0.35); blast(now + 0.45, 1760, long ? 0.9 : 0.35);
      if (long) blast(now + 0.45, 1320, 0.9);
    } catch {}
    try { navigator.vibrate?.(long ? [300, 120, 300, 120, 500] : [250, 120, 250]); } catch {}
  };

  // ---- cross-device sync (clock + minutes via server) ----
  const stateBlob = () => ({ halfLen, half, base: baseRef.current, startedAt: startedRef.current, mins: minsRef.current, onSince: onSinceRef.current, writtenAt: Date.now() });
  const applyState = (st: Record<string, unknown> | null) => {
    if (!st) return;
    if (typeof st.halfLen === "number") setHalfLen(st.halfLen);
    if (typeof st.half === "number") setHalf(st.half);
    baseRef.current = (st.base as number) ?? 0;
    startedRef.current = (st.startedAt as number | null) ?? null;
    minsRef.current = (st.mins as Record<string, number>) ?? {};
    onSinceRef.current = (st.onSince as Record<string, number | null>) ?? {};
    setRunning(!!st.startedAt);
    lastWrittenRef.current = (st.writtenAt as number) ?? lastWrittenRef.current;
    setTick((n) => n + 1);
  };
  const persistServer = () => { const blob = stateBlob(); lastWrittenRef.current = blob.writtenAt; post("stateSet", { state: blob }); };
  useEffect(() => {
    let alive = true;
    (async () => { const r = await post("stateGet", {}); if (alive && r?.state) applyState(r.state); })();
    const poll = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      const r = await post("stateGet", {});
      const w = r?.state?.writtenAt as number | undefined;
      if (w && w > lastWrittenRef.current) applyState(r.state);
    }, 10000);
    return () => { alive = false; clearInterval(poll); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setTick((n) => n + 1); persist();
      if (sport.timed && startedRef.current) {
        const sec = baseRef.current + Math.floor((Date.now() - startedRef.current) / 1000);
        if (sec >= halfLen * 60 && !endAlertedRef.current) {
          endAlertedRef.current = true;
          baseRef.current = halfLen * 60; startedRef.current = null; flushMins(); setRunning(false);
          setTimeout(() => { persist(); persistServer(); }, 0);
          playWhistle(half >= sport.periodCount);
        }
      }
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, persist, halfLen, half]);

  const flushMins = () => {
    const now = Date.now();
    for (const id of Object.keys(onSinceRef.current)) {
      const since = onSinceRef.current[id];
      if (since) { minsRef.current[id] = (minsRef.current[id] ?? 0) + (now - since) / 1000; onSinceRef.current[id] = null; }
    }
  };
  const startAccrual = (fieldState: FieldState) => {
    const now = Date.now();
    onSinceRef.current = {};
    for (const p of players) if (fieldState[p.id]?.status === "starter") onSinceRef.current[p.id] = now;
  };
  const liveMins = (id: string) => { const s = onSinceRef.current[id]; return (minsRef.current[id] ?? 0) + (s ? (Date.now() - s) / 1000 : 0); };

  const secInHalf = baseRef.current + (startedRef.current ? Math.floor((Date.now() - startedRef.current) / 1000) : 0);
  const halfDone = sport.timed && secInHalf >= halfLen * 60;
  const atLastPeriod = half >= sport.periodCount;

  const toggleClock = () => {
    if (running) { baseRef.current = secInHalf; startedRef.current = null; flushMins(); setRunning(false); }
    else { ensureAudio(); endAlertedRef.current = false; startedRef.current = Date.now(); startAccrual(field); setRunning(true); }
    setTimeout(() => { persist(); persistServer(); }, 0);
  };
  const advancePeriod = () => { endAlertedRef.current = false; flushMins(); baseRef.current = 0; startedRef.current = null; onSinceRef.current = {}; setRunning(false); setHalf((h) => Math.min(sport.periodCount, h + 1)); setTimeout(() => { persist(); persistServer(); }, 0); };
  const resetClock = () => { endAlertedRef.current = false; flushMins(); baseRef.current = 0; startedRef.current = null; onSinceRef.current = {}; minsRef.current = {}; setRunning(false); setHalf(1); setTick((n) => n + 1); setTimeout(() => { persist(); persistServer(); }, 0); };

  // ---------- field mutations (keep minutes correct) ----------
  const setFieldTracked = (next: FieldState) => {
    flushMins();
    setField(next);
    if (running) startAccrual(next);
    setTimeout(() => { persist(); persistServer(); }, 0);
  };

  const post = useCallback(async (op: string, payload: Record<string, unknown>) => {
    try { const r = await fetch("/api/live", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ eventId, op, payload }) }); return await r.json(); } catch { return null; }
  }, [eventId]);

  const byId = (id: string | null) => players.find((x) => x.id === id);
  const nameOf = (id: string | null) => { const p = byId(id); return p ? `${p.first_name}${p.jersey_number ? " #" + p.jersey_number : ""}` : "—"; };
  const onField = players.filter((p) => field[p.id]?.status === "starter");
  const bench = players.filter((p) => field[p.id]?.status !== "starter");
  const benchByMins = [...bench].sort((a, b) => liveMins(a.id) - liveMins(b.id));
  const pendingOut = new Set(subs.map((x) => x.player_out));
  const pendingIn = new Set(subs.map((x) => x.player_in));
  const posCount = (c: string) => onField.filter((p) => field[p.id]?.position === c).length;
  const hasKeeper = keeperPos ? onField.some((p) => field[p.id]?.position === keeperPos) : true;

  const score = (side: "us" | "them", delta: number) => {
    if (side === "us") { const v = Math.max(0, us + delta); setUs(v); post("score", { side, value: v }); }
    else { const v = Math.max(0, them + delta); setThem(v); post("score", { side, value: v }); }
  };
  const curMinute = Math.floor((half - 1) * (sport.timed ? halfLen : 0) * 60 + secInHalf) / 60;
  const logGoal = async (player_id: string | null) => {
    const tmp = "tmp-" + Math.random().toString(36).slice(2);
    const minute = running || secInHalf > 0 ? Math.floor(curMinute) + 1 : null;
    setGoals((g) => [...g, { id: tmp, player_id, saved: false, minute }]);
    setUs((s) => s + 1);
    const res = await post("goal", { player_id });
    if (res?.goalId) setGoals((g) => g.map((x) => (x.id === tmp ? { ...x, id: res.goalId, saved: true } : x)));
  };
  const undoGoal = (g: Goal) => { setGoals((gs) => gs.filter((x) => x.id !== g.id)); setUs((s) => Math.max(0, s - 1)); if (g.saved) post("undoGoal", { id: g.id }); };

  const GRACE = 20; // seconds — taking a kid off this fast = misclick, don't bank the time
  const toggleField = (id: string) => {
    const cur = field[id]?.status === "starter";
    if (cur) {
      const since = onSinceRef.current[id];
      if (since && (Date.now() - since) / 1000 < GRACE) onSinceRef.current[id] = null; // discard misclick time
    }
    const next: FieldState = { ...field, [id]: { status: cur ? "bench" : "starter", position: field[id]?.position ?? null } };
    setFieldTracked(next);
    post("field", { player_id: id, status: next[id].status, position: next[id].position });
  };
  const resetPlayerMins = (id: string) => {
    minsRef.current[id] = 0;
    onSinceRef.current[id] = field[id]?.status === "starter" && running ? Date.now() : null;
    setTick((n) => n + 1);
    setTimeout(() => { persist(); persistServer(); }, 0);
  };
  const setPos = (id: string, position: string) => { const next = { ...field, [id]: { status: "starter" as const, position } }; setField(next); post("field", { player_id: id, status: "starter", position }); };

  const applyLine = (plan: Plan) => {
    const starters = new Map<string, string>();
    plan.slots.forEach((s) => { if (s.player_id) starters.set(s.player_id, s.pos); });
    const next: FieldState = {};
    for (const p of players) next[p.id] = starters.has(p.id) ? { status: "starter", position: starters.get(p.id) ?? null } : { status: "bench", position: field[p.id]?.position ?? null };
    setFieldTracked(next);
    for (const p of players) post("field", { player_id: p.id, status: next[p.id].status, position: next[p.id].position });
  };

  const autoPickLive = () => {
    const pos = sport.positions;
    const POS = Array.from({ length: sport.onField }, (_, i) => (i === 0 ? pos[0] : pos[1 + ((i - 1) % Math.max(1, pos.length - 1))]));
    const pool = [...players].sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0)).slice(0, sport.onField);
    const next: FieldState = {};
    for (const p of players) next[p.id] = { status: "bench", position: field[p.id]?.position ?? null };
    pool.forEach((p, i) => { next[p.id] = { status: "starter", position: POS[i] }; });
    setFieldTracked(next);
    for (const p of players) post("field", { player_id: p.id, status: next[p.id].status, position: next[p.id].position });
  };
  const addNote = async () => { const t = noteText.trim(); if (!t) return; const stamped = secInHalf > 0 ? `H${half} ${fmtMin(secInHalf)} ${t}` : t; setNoteText(""); const res = await post("note", { note: stamped }); setNotes((n) => [...n, res?.line ?? stamped]); };
  const planSub = async () => {
    if (!outSel || !inSel || outSel === inSel) return;
    const tmp = "tmp-" + Math.random().toString(36).slice(2);
    setSubs((s) => [...s, { id: tmp, player_in: inSel, player_out: outSel, saved: false }]);
    const pin = inSel, pout = outSel; setInSel(""); setOutSel("");
    const res = await post("planSub", { player_in: pin, player_out: pout });
    if (res?.id) setSubs((s) => s.map((x) => (x.id === tmp ? { ...x, id: res.id, saved: true } : x)));
  };
  const execSub = (sp: Sub) => {
    const outPos = field[sp.player_out]?.position ?? null;
    const next: FieldState = { ...field, [sp.player_out]: { status: "bench", position: field[sp.player_out]?.position ?? null }, [sp.player_in]: { status: "starter", position: outPos } };
    setFieldTracked(next);
    setSubs((s) => s.filter((x) => x.id !== sp.id)); if (sp.saved) post("execSub", { id: sp.id });
  };
  const cancelSub = (sp: Sub) => { setSubs((s) => s.filter((x) => x.id !== sp.id)); if (sp.saved) post("cancelSub", { id: sp.id }); };

  const maxMins = Math.max(60, ...players.map((p) => liveMins(p.id)));

  return (
    <main className="mx-auto max-w-md px-4 pb-16 lg:max-w-2xl">
      {/* Scoreboard + half clock */}
      <div className="sticky top-0 z-30 -mx-4 mb-4 rounded-b-3xl bg-gradient-to-b from-slate-900 to-slate-800 px-4 pb-4 pt-4 text-white shadow-xl">
        <div className="flex items-center justify-between text-xs">
          <Link href="/dashboard" className="font-semibold text-slate-300">← Exit</Link>
          <span className="chip bg-emerald-500/20 text-emerald-300">● LIVE</span>
        </div>
        <p className="mt-1 truncate text-center text-xs text-slate-400">{props.title} · {props.when}</p>
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
          <ScoreCol label={props.teamName} value={us} onMinus={() => score("us", -1)} onPlus={() => score("us", +1)} accent />
          <div className="flex flex-col items-center">
            <span className={`text-[10px] font-bold uppercase tracking-wide ${halfDone ? "text-amber-300" : "text-slate-400"}`}>{ordinal(half)} {sport.periodType}{halfDone ? (atLastPeriod ? " · FINAL" : " · BREAK") : ""}</span>
            <span className="font-mono text-3xl font-bold tabular-nums">{fmtMin(sport.timed ? Math.min(secInHalf, halfLen * 60) : secInHalf)}</span>
            {sport.timed && <span className="text-[10px] text-slate-500">/ {halfLen}:00</span>}
            <div className="mt-1 flex gap-1">
              <button onClick={toggleClock} className="grid h-8 w-8 place-items-center rounded-full bg-white/15 active:scale-90">{running ? <Pause size={15} /> : <Play size={15} />}</button>
              {(!atLastPeriod && (halfDone || !sport.timed)) ? (
                <button onClick={advancePeriod} className="rounded-full bg-emerald-500 px-2 text-[11px] font-bold active:scale-90">{ordinal(half + 1)} {sport.periodType} ▶</button>
              ) : (
                <button onClick={resetClock} className="grid h-8 w-8 place-items-center rounded-full bg-white/15 active:scale-90"><RotateCcw size={14} /></button>
              )}
            </div>
          </div>
          <ScoreCol label={props.opponent || "Them"} value={them} onMinus={() => score("them", -1)} onPlus={() => score("them", +1)} />
        </div>
        {sport.timed && (
          <div className="mt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <Timer size={12} /> {sport.periodType} length
            <select value={halfLen} onChange={(e) => { setHalfLen(parseInt(e.target.value, 10)); setTimeout(() => { persist(); persistServer(); }, 0); }} className="rounded bg-white/10 px-1 py-0.5 text-white">
              {[8, 10, 12, 15, 20, 25, 30, 35, 40, 45].map((n) => <option key={n} value={n} className="text-ink">{n} min</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Lineup setup when nobody is on yet */}
      {onField.length === 0 && (
        <div className="mb-4 rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <p className="font-bold text-ink">⚽ Set your starting lineup</p>
          <p className="mt-0.5 text-sm text-slate-600">Load a line you built in Tactics, auto-pick your strongest 8, or tap players from the bench.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {plans.map((pl) => (
              <button key={pl.id} onClick={() => applyLine(pl)} className="rounded-full border border-brand-300 bg-white px-3 py-2 text-sm font-semibold text-brand-700 active:scale-95">▶ {pl.name}</button>
            ))}
            <button onClick={autoPickLive} className="btn-primary">✨ Auto-pick {sport.onField}</button>
          </div>
          {plans.length === 0 && <p className="mt-2 text-xs text-slate-400">Tip: build &amp; name lineups in Tactics (e.g. “Aces”, “Subs”) to load them here in one tap.</p>}
        </div>
      )}

      {/* Quick lines (swap) */}
      {plans.length > 0 && onField.length > 0 && (
        <div className="mb-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">⚡ Load a line (one tap)</p>
          <div className="flex flex-wrap gap-2">
            {plans.map((pl) => (
              <button key={pl.id} onClick={() => applyLine(pl)} className="rounded-full border border-brand-300 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 active:scale-95">{pl.name}</button>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-400">Build these in Tactics (e.g. “Aces”, “Rotation”, “Subs”).</p>
        </div>
      )}

      {/* Playing time tracker */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white">
        <button onClick={() => setShowMins((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-ink">
          <span className="flex items-center gap-2">⏱️ Playing time{!showMins && <span className="text-xs font-normal text-slate-400">{onField.length} on · least {fmtMin(Math.min(...players.map((p) => liveMins(p.id)), 0))}</span>}</span><span className="text-slate-400">{showMins ? "▲" : "▼"}</span>
        </button>
        {showMins && (
          <div className="space-y-1.5 border-t border-slate-100 px-3 py-2">
            {[...players].sort((a, b) => liveMins(a.id) - liveMins(b.id)).map((p) => {
              const on = field[p.id]?.status === "starter";
              const mins = liveMins(p.id);
              return (
                <div key={p.id} className="flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${on ? "bg-emerald-500" : "bg-slate-300"}`} />
                  <span className="w-24 shrink-0 truncate text-sm">{p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}</span>
                  <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <span className="absolute inset-y-0 left-0 rounded-full bg-brand-500" style={{ width: `${Math.min(100, (mins / maxMins) * 100)}%` }} />
                  </span>
                  <span className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-600">{fmtMin(mins)}</span>
                  <button onClick={() => resetPlayerMins(p.id)} aria-label="Reset minutes" title="Reset this player's minutes" className="shrink-0 text-slate-300 hover:text-rose-500">↺</button>
                </div>
              );
            })}
            <p className="pt-1 text-[11px] text-slate-400">Green = on the field now. Bench is sorted so whoever&rsquo;s played least is first to go on.</p>
          </div>
        )}
      </div>

      {/* Goal logging */}
      <Section title={`${sport.scoreEmoji} ${sport.scoreTerm} for us — tap the scorer`} />
      {onField.length === 0 ? (
        <p className="text-sm text-slate-400">Set your lineup above first — then your on-field players show here to tap when they score.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {onField.map((p) => (
            <button key={p.id} onClick={() => logGoal(p.id)} className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 py-1 pl-1 pr-3 text-sm font-semibold text-emerald-800 active:scale-95">
              <PlayerAvatar name={fullName(p)} photoUrl={p.avatar_url} size={24} />{p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}
            </button>
          ))}
          <button onClick={() => logGoal(null)} className="rounded-full border border-slate-300 px-3 py-2 text-sm active:scale-95">Own/unknown</button>
        </div>
      )}
      {goals.length > 0 && (
        <div className="mt-3 space-y-1">
          {goals.map((g) => (
            <div key={g.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
              <span>⚽ {nameOf(g.player_id)}{g.minute ? <span className="ml-1 text-slate-400">{g.minute}&#39;</span> : ""}</span>
              <button onClick={() => undoGoal(g)} className="flex items-center gap-1 text-rose-500"><Undo2 size={13} /> undo</button>
            </div>
          ))}
        </div>
      )}

      {/* On field */}
      <Section title={`On the ${sport.hasPitch ? "field" : "lineup"} (${onField.length}/${sport.onField})`} />
      <p className="mb-2 text-xs text-slate-500">{sport.positions.map((c) => `${c} ${posCount(c)}`).join(" · ")}</p>
      {((keeperPos && !hasKeeper) || onField.length !== sport.onField) && <p className="mb-2 text-xs font-semibold text-amber-600">{keeperPos && !hasKeeper ? `⚠ No ${keeperPos} set` : ""}{keeperPos && !hasKeeper && onField.length !== sport.onField ? " · " : ""}{onField.length !== sport.onField ? `${onField.length}/${sport.onField} on` : ""}</p>}
      <div className="space-y-2">
        {onField.map((p) => (
          <div key={p.id} className={`flex items-center gap-2 rounded-xl border p-2 ${field[p.id]?.position === "GK" ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
            <PlayerAvatar name={fullName(p)} photoUrl={p.avatar_url} size={32} />
            <span className="flex-1 text-sm font-semibold">{field[p.id]?.position === "GK" ? "🧤 " : ""}{p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}{pendingOut.has(p.id) && <span className="ml-1 rounded bg-amber-100 px-1 text-[9px] font-bold text-amber-700">SUBBING OFF</span>}</span>
            <span className="text-xs font-semibold tabular-nums text-slate-400">{fmtMin(liveMins(p.id))}</span>
            <select value={field[p.id]?.position ?? ""} onChange={(e) => setPos(p.id, e.target.value)} className="input !w-auto py-1 text-sm">
              <option value="">pos</option>{sport.positions.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <button onClick={() => toggleField(p.id)} className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 active:scale-95">off</button>
          </div>
        ))}
      </div>
      <p className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Bench — least minutes first 💡</p>
      <div className="flex flex-wrap gap-2">
        {benchByMins.map((p, i) => (
          <button key={p.id} onClick={() => toggleField(p.id)} className={`flex items-center gap-1.5 rounded-full border bg-white py-1 pl-1 pr-3 text-sm font-semibold text-ink active:scale-95 ${i === 0 ? "border-emerald-400 ring-1 ring-emerald-200" : "border-slate-300"}`}>
            <PlayerAvatar name={fullName(p)} photoUrl={p.avatar_url} size={24} />{p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}<span className="text-xs text-slate-400">{fmtMin(liveMins(p.id))}</span>{pendingIn.has(p.id) && <span className="ml-1 rounded bg-brand-100 px-1 text-[9px] font-bold text-brand-700">ON DECK</span>}
          </button>
        ))}
      </div>

      {/* Subs */}
      <Section title="Sub plan — get them ready 🔁" />
      {subs.length > 0 && (
        <div className="mb-2 space-y-2">
          {subs.map((sp) => (
            <div key={sp.id} className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 p-2">
              <span className="flex-1 text-sm"><b className="text-emerald-700">IN</b> {nameOf(sp.player_in)} · <b className="text-rose-600">OUT</b> {nameOf(sp.player_out)}</span>
              <button onClick={() => execSub(sp)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white active:scale-95">Make sub</button>
              <button onClick={() => cancelSub(sp)} className="text-slate-400"><X size={15} /></button>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <select value={outSel} onChange={(e) => setOutSel(e.target.value)} className="input py-2 text-sm"><option value="">Coming OFF…</option>{onField.filter((p) => !pendingOut.has(p.id)).map((p) => <option key={p.id} value={p.id}>{p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}{field[p.id]?.position ? ` (${field[p.id]?.position})` : ""}</option>)}</select>
        <select value={inSel} onChange={(e) => setInSel(e.target.value)} className="input py-2 text-sm"><option value="">Going ON…</option>{benchByMins.filter((p) => !pendingIn.has(p.id)).map((p, i) => <option key={p.id} value={p.id}>{i === 0 ? "💡 " : ""}{p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""} · {fmtMin(liveMins(p.id))}</option>)}</select>
      </div>
      <button onClick={planSub} className="btn-ghost mt-2 w-full">Add to on deck</button>

      {/* Notes */}
      <Section title="Game notes (live)" />
      <div className="flex gap-2">
        <input value={noteText} onChange={(e) => setNoteText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addNote(); }} className="input py-2" placeholder="great save, kickoff 2nd half…" />
        <button onClick={addNote} className="btn-ghost px-4">Add</button>
      </div>
      {notes.length > 0 && <ul className="mt-3 space-y-1 text-sm text-slate-700">{notes.map((n, i) => <li key={i} className="rounded bg-slate-50 px-2 py-1">{n}</li>)}</ul>}

      {/* Safety */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm font-semibold text-slate-600">⚠️ Allergies &amp; emergency contacts</summary>
        <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 p-2 text-sm">
          {players.map((p) => (
            <li key={p.id} className="flex items-center gap-2 py-2">
              <PlayerAvatar name={fullName(p)} photoUrl={p.avatar_url} size={28} />
              <div>
                <span className="font-medium">{p.first_name} {p.last_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}</span>
                {p.allergies && <span className="ml-2 font-semibold text-rose-600">⚠ {p.allergies}</span>}
                <div className="text-xs text-slate-500">Emergency: {p.emergency_contact_name || "—"} {p.emergency_contact_phone || p.guardian_phone || ""}</div>
              </div>
            </li>
          ))}
        </ul>
      </details>
    </main>
  );
}

function Section({ title }: { title: string }) { return <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>; }
function ScoreCol({ label, value, onMinus, onPlus, accent }: { label: string; value: number; onMinus: () => void; onPlus: () => void; accent?: boolean }) {
  return (
    <div>
      <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`my-1 text-5xl font-extrabold tabular-nums ${accent ? "text-emerald-400" : ""}`}>{value}</p>
      <div className="flex justify-center gap-2">
        <button onClick={onMinus} className="h-9 w-9 rounded-full border border-slate-600 text-xl leading-none text-slate-200 active:scale-90">−</button>
        <button onClick={onPlus} className="h-9 w-9 rounded-full bg-emerald-500 text-xl font-bold leading-none text-white active:scale-90">+</button>
      </div>
    </div>
  );
}
