"use client";
import Link from "next/link";
import { useState, useCallback, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Undo2, X } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";

type P = { id: string; first_name: string; last_name: string; jersey_number: string | null; allergies: string | null; emergency_contact_name: string | null; emergency_contact_phone: string | null; guardian_phone: string | null; avatar_url?: string | null };
type FieldState = Record<string, { status: "starter" | "bench" | "out"; position: string | null }>;
type Goal = { id: string; player_id: string | null; saved: boolean; minute?: number | null };
type Sub = { id: string; player_in: string; player_out: string; saved: boolean };

const POSITIONS = ["GK", "DEF", "MID", "FWD"];
const fullName = (p: P) => `${p.first_name} ${p.last_name}`;

export function LiveGameClient(props: {
  eventId: string; teamName: string; opponent: string; title: string; when: string;
  initUs: number; initThem: number;
  players: P[]; initField: FieldState; initGoals: Goal[]; initNotes: string[]; initSubs: Sub[];
  startsBy: Record<string, number>;
}) {
  const { eventId, players, startsBy } = props;
  const [us, setUs] = useState(props.initUs);
  const [them, setThem] = useState(props.initThem);
  const [field, setField] = useState<FieldState>(props.initField);
  const [goals, setGoals] = useState<Goal[]>(props.initGoals);
  const [notes, setNotes] = useState<string[]>(props.initNotes);
  const [subs, setSubs] = useState<Sub[]>(props.initSubs);
  const [noteText, setNoteText] = useState("");
  const [outSel, setOutSel] = useState("");
  const [inSel, setInSel] = useState("");

  // ---- match clock (persists across refresh) ----
  const ckey = `live_clock_${eventId}`;
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const baseRef = useRef(0);
  const startedRef = useRef<number | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ckey);
      if (raw) { const o = JSON.parse(raw); baseRef.current = o.base ?? 0; startedRef.current = o.startedAt ?? null;
        setRunning(!!o.startedAt); setElapsed((o.base ?? 0) + (o.startedAt ? Math.floor((Date.now() - o.startedAt) / 1000) : 0)); }
    } catch {}
  }, [ckey]);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed(baseRef.current + Math.floor((Date.now() - (startedRef.current ?? Date.now())) / 1000)), 1000);
    return () => clearInterval(t);
  }, [running]);
  const persistClock = () => { try { localStorage.setItem(ckey, JSON.stringify({ base: baseRef.current, startedAt: startedRef.current })); } catch {} };
  const toggleClock = () => {
    if (running) { baseRef.current = elapsed; startedRef.current = null; setRunning(false); }
    else { startedRef.current = Date.now(); setRunning(true); }
    setTimeout(persistClock, 0);
  };
  const resetClock = () => { baseRef.current = 0; startedRef.current = null; setRunning(false); setElapsed(0); setTimeout(persistClock, 0); };
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const curMinute = Math.floor(elapsed / 60) + 1;

  const post = useCallback(async (op: string, payload: Record<string, unknown>) => {
    try { const r = await fetch("/api/live", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ eventId, op, payload }) }); return await r.json(); } catch { return null; }
  }, [eventId]);

  const byId = (id: string | null) => players.find((x) => x.id === id);
  const nameOf = (id: string | null) => { const p = byId(id); return p ? `${p.first_name}${p.jersey_number ? " #" + p.jersey_number : ""}` : "—"; };
  const onField = players.filter((p) => field[p.id]?.status === "starter");
  const bench = players.filter((p) => field[p.id]?.status !== "starter");
  const benchFair = [...bench].sort((a, b) => (startsBy[a.id] ?? 0) - (startsBy[b.id] ?? 0));
  const posCount = (c: string) => onField.filter((p) => field[p.id]?.position === c).length;
  const hasGK = onField.some((p) => field[p.id]?.position === "GK");

  const score = (side: "us" | "them", delta: number) => {
    if (side === "us") { const v = Math.max(0, us + delta); setUs(v); post("score", { side, value: v }); }
    else { const v = Math.max(0, them + delta); setThem(v); post("score", { side, value: v }); }
  };
  const logGoal = async (player_id: string | null) => {
    const tmp = "tmp-" + Math.random().toString(36).slice(2);
    const minute = running || elapsed > 0 ? curMinute : null;
    setGoals((g) => [...g, { id: tmp, player_id, saved: false, minute }]);
    setUs((s) => s + 1);
    const res = await post("goal", { player_id });
    if (res?.goalId) setGoals((g) => g.map((x) => (x.id === tmp ? { ...x, id: res.goalId, saved: true } : x)));
  };
  const undoGoal = (g: Goal) => { setGoals((gs) => gs.filter((x) => x.id !== g.id)); setUs((s) => Math.max(0, s - 1)); if (g.saved) post("undoGoal", { id: g.id }); };
  const toggleField = (id: string) => {
    const cur = field[id]?.status === "starter";
    const next = { status: (cur ? "bench" : "starter") as "starter" | "bench", position: field[id]?.position ?? null };
    setField((f) => ({ ...f, [id]: next })); post("field", { player_id: id, status: next.status, position: next.position });
  };
  const setPos = (id: string, position: string) => { setField((f) => ({ ...f, [id]: { status: "starter", position } })); post("field", { player_id: id, status: "starter", position }); };
  const addNote = async () => { const t = noteText.trim(); if (!t) return; const stamped = elapsed > 0 ? `${mm}:${ss} ${t}` : t; setNoteText(""); const res = await post("note", { note: stamped }); setNotes((n) => [...n, res?.line ?? stamped]); };
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
    setField((f) => ({ ...f, [sp.player_out]: { status: "bench", position: f[sp.player_out]?.position ?? null }, [sp.player_in]: { status: "starter", position: outPos } }));
    setSubs((s) => s.filter((x) => x.id !== sp.id)); if (sp.saved) post("execSub", { id: sp.id });
  };
  const cancelSub = (sp: Sub) => { setSubs((s) => s.filter((x) => x.id !== sp.id)); if (sp.saved) post("cancelSub", { id: sp.id }); };

  return (
    <main className="mx-auto max-w-md px-4 pb-16 lg:max-w-2xl">
      {/* Scoreboard + clock */}
      <div className="sticky top-0 z-30 -mx-4 mb-5 rounded-b-3xl bg-gradient-to-b from-slate-900 to-slate-800 px-4 pb-4 pt-4 text-white shadow-xl">
        <div className="flex items-center justify-between text-xs">
          <Link href="/dashboard" className="font-semibold text-slate-300">← Exit</Link>
          <span className="chip bg-emerald-500/20 text-emerald-300">● LIVE</span>
        </div>
        <p className="mt-1 truncate text-center text-xs text-slate-400">{props.title} · {props.when}</p>
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
          <ScoreCol label={props.teamName} value={us} onMinus={() => score("us", -1)} onPlus={() => score("us", +1)} accent />
          <div className="flex flex-col items-center">
            <span className="font-mono text-2xl font-bold tabular-nums">{mm}:{ss}</span>
            <div className="mt-1 flex gap-1">
              <button onClick={toggleClock} className="grid h-8 w-8 place-items-center rounded-full bg-white/15 active:scale-90">{running ? <Pause size={15} /> : <Play size={15} />}</button>
              <button onClick={resetClock} className="grid h-8 w-8 place-items-center rounded-full bg-white/15 active:scale-90"><RotateCcw size={14} /></button>
            </div>
          </div>
          <ScoreCol label={props.opponent || "Them"} value={them} onMinus={() => score("them", -1)} onPlus={() => score("them", +1)} />
        </div>
      </div>

      {/* Goal logging */}
      <Section title="⚽ Goal for us — tap the scorer" />
      <div className="flex flex-wrap gap-2">
        {(onField.length ? onField : players).map((p) => (
          <button key={p.id} onClick={() => logGoal(p.id)} className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 py-1 pl-1 pr-3 text-sm font-semibold text-emerald-800 active:scale-95">
            <PlayerAvatar name={fullName(p)} photoUrl={p.avatar_url} size={24} />{p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}
          </button>
        ))}
        <button onClick={() => logGoal(null)} className="rounded-full border border-slate-300 px-3 py-2 text-sm active:scale-95">Own/unknown</button>
      </div>
      {goals.length > 0 && (
        <div className="mt-3 space-y-1">
          {goals.map((g, i) => (
            <div key={g.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
              <span>⚽ {nameOf(g.player_id)}{g.minute ? <span className="ml-1 text-slate-400">{g.minute}&#39;</span> : ""}</span>
              <button onClick={() => undoGoal(g)} className="flex items-center gap-1 text-rose-500"><Undo2 size={13} /> undo</button>
            </div>
          ))}
        </div>
      )}

      {/* On field */}
      <Section title={`On the field (${onField.length}/8)`} />
      <p className="mb-2 text-xs text-slate-500">🧤 GK {posCount("GK")} · DEF {posCount("DEF")} · MID {posCount("MID")} · FWD {posCount("FWD")}</p>
      {(!hasGK || onField.length !== 8) && <p className="mb-2 text-xs font-semibold text-amber-600">{!hasGK ? "⚠ No goalie set" : ""}{!hasGK && onField.length !== 8 ? " · " : ""}{onField.length !== 8 ? `${onField.length}/8 on field` : ""}</p>}
      <div className="space-y-2">
        {onField.map((p) => (
          <div key={p.id} className={`flex items-center gap-2 rounded-xl border p-2 ${field[p.id]?.position === "GK" ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
            <PlayerAvatar name={fullName(p)} photoUrl={p.avatar_url} size={32} />
            <span className="flex-1 text-sm font-semibold">{field[p.id]?.position === "GK" ? "🧤 " : ""}{p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}</span>
            <select value={field[p.id]?.position ?? ""} onChange={(e) => setPos(p.id, e.target.value)} className="input !w-auto py-1 text-sm">
              <option value="">pos</option>{POSITIONS.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <button onClick={() => toggleField(p.id)} className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 active:scale-95">off</button>
          </div>
        ))}
      </div>
      <p className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Bench — tap to bring on</p>
      <div className="flex flex-wrap gap-2">
        {bench.map((p) => (
          <button key={p.id} onClick={() => toggleField(p.id)} className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white py-1 pl-1 pr-3 text-sm font-semibold text-ink active:scale-95">
            <PlayerAvatar name={fullName(p)} photoUrl={p.avatar_url} size={24} />{p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}
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
        <select value={outSel} onChange={(e) => setOutSel(e.target.value)} className="input py-2 text-sm"><option value="">Coming OFF…</option>{onField.map((p) => <option key={p.id} value={p.id}>{p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}{field[p.id]?.position ? ` (${field[p.id]?.position})` : ""}</option>)}</select>
        <select value={inSel} onChange={(e) => setInSel(e.target.value)} className="input py-2 text-sm"><option value="">Going ON…</option>{benchFair.map((p, i) => <option key={p.id} value={p.id}>{i === 0 ? "💡 " : ""}{p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""} · {startsBy[p.id] ?? 0} starts</option>)}</select>
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

function Section({ title }: { title: string }) {
  return <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>;
}
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
