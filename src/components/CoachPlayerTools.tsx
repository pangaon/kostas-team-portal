"use client";
import { useState } from "react";
import { SKILL_GROUPS, WORKING_ON } from "@/lib/skills";

export function CoachPlayerTools({ playerId, parentName, initialSkills }: { playerId: string; parentName: string; initialSkills: string[] }) {
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [tip, setTip] = useState("");
  const [sent, setSent] = useState(false);

  const save = async (next: string[]) => {
    setSkills(next);
    await fetch("/api/player", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ op: "skills", playerId, skills: next }) }).catch(() => {});
  };
  const toggle = (s: string) => save(skills.includes(s) ? skills.filter((x) => x !== s) : [...skills, s]);
  const sendTip = async () => {
    const t = tip.trim(); if (!t) return;
    setTip(""); setSent(true); setTimeout(() => setSent(false), 2500);
    await fetch("/api/player", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ op: "tip", playerId, text: t }) }).catch(() => {});
  };

  const chosen = skills.length;

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Player profile — tap what fits {chosen > 0 ? `· ${chosen} selected` : ""}</p>
        <div className="space-y-2.5">
          {SKILL_GROUPS.map((grp) => (
            <div key={grp.group}>
              <p className="mb-1 text-[11px] font-semibold text-slate-400">{grp.emoji} {grp.group}</p>
              <div className="flex flex-wrap gap-1.5">
                {grp.options.map((s) => {
                  const on = skills.includes(s);
                  const need = WORKING_ON.has(s);
                  return (
                    <button key={s} onClick={() => toggle(s)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${on ? (need ? "border-amber-400 bg-amber-50 text-amber-700" : "border-brand-400 bg-brand-50 text-brand-700") : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                      {on ? "✓ " : ""}{s}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">💬 Send a tip to {parentName || "the parent"}</p>
        <div className="flex gap-2">
          <input value={tip} onChange={(e) => setTip(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendTip(); }} className="input py-2 text-sm" placeholder="e.g. Great hustle today — work on left foot at home 👊" />
          <button onClick={sendTip} className="btn-primary shrink-0 text-sm">Send</button>
        </div>
        {sent && <p className="mt-1 text-xs font-semibold text-emerald-600">Sent to their chat ✓</p>}
      </div>
    </div>
  );
}
