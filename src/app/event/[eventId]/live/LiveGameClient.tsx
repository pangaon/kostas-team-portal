"use client";
import Link from "next/link";
import { useState, useCallback } from "react";

type P = { id: string; first_name: string; last_name: string; jersey_number: string | null; allergies: string | null; emergency_contact_name: string | null; emergency_contact_phone: string | null; guardian_phone: string | null };
type FieldState = Record<string, { status: "starter" | "bench" | "out"; position: string | null }>;
type Goal = { id: string; player_id: string | null; saved: boolean };
type Sub = { id: string; player_in: string; player_out: string; saved: boolean };

const POSITIONS = ["GK", "DEF", "MID", "FWD"];

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

  const post = useCallback(async (op: string, payload: Record<string, unknown>) => {
    try {
      const r = await fetch("/api/live", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ eventId, op, payload }) });
      return await r.json();
    } catch { return null; }
  }, [eventId]);

  const nameOf = (id: string | null) => {
    const p = players.find((x) => x.id === id);
    return p ? `${p.first_name}${p.jersey_number ? " #" + p.jersey_number : ""}` : "—";
  };
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
    setGoals((g) => [...g, { id: tmp, player_id, saved: false }]);
    setUs((s) => s + 1);
    const res = await post("goal", { player_id });
    if (res?.goalId) setGoals((g) => g.map((x) => (x.id === tmp ? { ...x, id: res.goalId, saved: true } : x)));
  };
  const undoGoal = (g: Goal) => {
    setGoals((gs) => gs.filter((x) => x.id !== g.id));
    setUs((s) => Math.max(0, s - 1));
    if (g.saved) post("undoGoal", { id: g.id });
  };
  const toggleField = (id: string) => {
    const cur = field[id]?.status === "starter";
    const next = { status: (cur ? "bench" : "starter") as "starter" | "bench", position: field[id]?.position ?? null };
    setField((f) => ({ ...f, [id]: next }));
    post("field", { player_id: id, status: next.status, position: next.position });
  };
  const setPos = (id: string, position: string) => {
    setField((f) => ({ ...f, [id]: { status: "starter", position } }));
    post("field", { player_id: id, status: "starter", position });
  };
  const addNote = async () => {
    const t = noteText.trim(); if (!t) return;
    setNoteText("");
    const res = await post("note", { note: t });
    setNotes((n) => [...n, res?.line ?? t]);
  };
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
    setSubs((s) => s.filter((x) => x.id !== sp.id));
    if (sp.saved) post("execSub", { id: sp.id });
  };
  const cancelSub = (sp: Sub) => { setSubs((s) => s.filter((x) => x.id !== sp.id)); if (sp.saved) post("cancelSub", { id: sp.id }); };

  const Btn = ({ on, children, onClick }: { on?: boolean; children: React.ReactNode; onClick: () => void }) => (
    <button onClick={onClick} className={`rounded-full px-3 py-2 text-sm font-medium transition active:scale-95 ${on ? "bg-brand-600 text-white" : "border border-slate-300 text-slate-700"}`}>{children}</button>
  );

  return (
    <main className="mx-auto max-w-md px-4 pb-16">
      <div className="sticky top-0 z-30 -mx-4 mb-5 border-b border-slate-800 bg-slate-900 px-4 pb-4 pt-4 text-white shadow-xl">
        <div className="flex items-center justify-between text-xs">
          <Link href="/dashboard" className="font-semibold text-slate-200">← Exit game mode</Link>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-300">● LIVE · instant</span>
        </div>
        <p className="mt-2 truncate text-center text-xs text-slate-400">{props.title} · {props.when}</p>
        <div className="mt-2 grid grid-cols-2 gap-3 text-center">
          {(["us", "them"] as const).map((side) => (
            <div key={side}>
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-400">{side === "us" ? props.teamName : (props.opponent || "Them")}</p>
              <p className="my-1 text-6xl font-extrabold tabular-nums">{side === "us" ? us : them}</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => score(side, -1)} className="h-11 w-11 rounded-full border border-slate-600 text-2xl leading-none text-slate-200 active:scale-90">−</button>
                <button onClick={() => score(side, +1)} className="h-11 w-11 rounded-full bg-emerald-500 text-2xl leading-none font-bold text-white active:scale-90">+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">⚽ Goal for us — tap the scorer</h2>
      <div className="flex flex-wrap gap-2">
        {(onField.length ? onField : players).map((p) => (
          <button key={p.id} onClick={() => logGoal(p.id)} className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 active:scale-95">{p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}</button>
        ))}
        <button onClick={() => logGoal(null)} className="rounded-full border border-slate-300 px-3 py-2 text-sm active:scale-95">Own/unknown</button>
      </div>
      {goals.length > 0 && (
        <div className="mt-3 space-y-1">
          {goals.map((g, i) => (
            <div key={g.id} className="flex items-center justify-between text-sm">
              <span>{i + 1}. ⚽ {nameOf(g.player_id)}</span>
              <button onClick={() => undoGoal(g)} className="text-rose-500">undo</button>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-1 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">On the field ({onField.length}/8)</h2>
      <p className="mb-2 text-xs text-slate-500">🧤 GK {posCount("GK")} · DEF {posCount("DEF")} · MID {posCount("MID")} · FWD {posCount("FWD")}</p>
      {(!hasGK || onField.length !== 8) && <p className="mb-2 text-xs font-semibold text-amber-600">{!hasGK ? "⚠ No goalie set" : ""}{!hasGK && onField.length !== 8 ? " · " : ""}{onField.length !== 8 ? `${onField.length}/8 on field` : ""}</p>}
      <div className="space-y-2">
        {onField.map((p) => (
          <div key={p.id} className={`flex items-center gap-2 rounded-xl border p-2 ${field[p.id]?.position === "GK" ? "border-amber-300 bg-amber-50" : "border-slate-200"}`}>
            <span className="flex-1 text-sm font-medium">{field[p.id]?.position === "GK" ? "🧤 " : ""}{p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}</span>
            <select value={field[p.id]?.position ?? ""} onChange={(e) => setPos(p.id, e.target.value)} className="input py-1 text-sm">
              <option value="">pos</option>
              {POSITIONS.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <button onClick={() => toggleField(p.id)} className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 active:scale-95">off</button>
          </div>
        ))}
      </div>
      <p className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Bench — tap to bring on</p>
      <div className="flex flex-wrap gap-2">
        {bench.map((p) => <Btn key={p.id} onClick={() => toggleField(p.id)}>+ {p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}</Btn>)}
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Sub plan — get them ready 🔁</h2>
      {subs.length > 0 && (
        <div className="mb-2 space-y-2">
          {subs.map((sp) => (
            <div key={sp.id} className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 p-2">
              <span className="flex-1 text-sm"><b>IN:</b> {nameOf(sp.player_in)} · <b>OUT:</b> {nameOf(sp.player_out)}</span>
              <button onClick={() => execSub(sp)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white active:scale-95">Make sub</button>
              <button onClick={() => cancelSub(sp)} className="text-xs text-rose-500">cancel</button>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <select value={outSel} onChange={(e) => setOutSel(e.target.value)} className="input py-2 text-sm"><option value="">Coming OFF…</option>{onField.map((p) => <option key={p.id} value={p.id}>{p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}{field[p.id]?.position ? ` (${field[p.id]?.position})` : ""}</option>)}</select>
        <select value={inSel} onChange={(e) => setInSel(e.target.value)} className="input py-2 text-sm"><option value="">Going ON…</option>{benchFair.map((p, i) => <option key={p.id} value={p.id}>{i === 0 ? "💡 " : ""}{p.first_name}{p.jersey_number ? ` #${p.jersey_number}` : ""} · {startsBy[p.id] ?? 0} starts</option>)}</select>
      </div>
      <button onClick={planSub} className="mt-2 w-full rounded-xl border border-slate-300 py-2 text-sm font-semibold active:scale-95">Add to on deck</button>

      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Game notes (live)</h2>
      <div className="flex gap-2">
        <input value={noteText} onChange={(e) => setNoteText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addNote(); }} className="input py-2" placeholder="great save, kickoff 2nd half…" />
        <button onClick={addNote} className="rounded-xl border border-slate-300 px-4 text-sm font-semibold active:scale-95">Add</button>
      </div>
      {notes.length > 0 && <ul className="mt-3 space-y-1 text-sm text-slate-700">{notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}

      <details className="mt-6">
        <summary className="cursor-pointer text-sm font-semibold text-slate-600">⚠️ Allergies & emergency contacts</summary>
        <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 p-2 text-sm">
          {players.map((p) => (
            <li key={p.id} className="py-2">
              <span className="font-medium">{p.first_name} {p.last_name}{p.jersey_number ? ` #${p.jersey_number}` : ""}</span>
              {p.allergies && <span className="ml-2 font-semibold text-rose-600">⚠ {p.allergies}</span>}
              <div className="text-xs text-slate-500">Emergency: {p.emergency_contact_name || "—"} {p.emergency_contact_phone || p.guardian_phone || ""}</div>
            </li>
          ))}
        </ul>
      </details>
    </main>
  );
}
