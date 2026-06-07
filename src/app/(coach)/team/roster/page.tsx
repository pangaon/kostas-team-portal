import Link from "next/link";
import { requireCoachTeam } from "@/lib/auth";
import { getPlayersWithGuardians, originFromEnv } from "@/lib/data";
import { Card, PageTitle, SectionTitle, Badge, Button, EmptyState, Field } from "@/components/ui";
import type { PlayerWithGuardians, Guardian } from "@/lib/types";
import { approvePlayer, rejectPlayer, deletePlayer, upsertPlayer, uploadAvatar, bulkAddPlayers, mergePending, resetAccessToken, mergePlayers } from "./actions";
import { AvatarUpload } from "@/components/AvatarUpload";
import { withAvatars } from "@/lib/avatars";
import { CoachPlayerTools } from "@/components/CoachPlayerTools";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CopyButton } from "@/components/CopyButton";
import { readProfiles } from "@/lib/playerprofile";
import { readIntakes } from "@/lib/parentintake";
import { readTeamRules } from "@/lib/teamrules";
import { paidSet } from "@/lib/payments";

function lev(a: string, b: string): number {
  const m = a.length, n = b.length; const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i-1][j]+1, d[i][j-1]+1, d[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
  return d[m][n];
}

function primaryGuardian(p: PlayerWithGuardians): Guardian | undefined {
  return p.guardians.find((g) => g.is_primary) ?? p.guardians[0];
}
function secondGuardian(p: PlayerWithGuardians): Guardian | undefined {
  const prim = primaryGuardian(p);
  return p.guardians.find((g) => g.id !== prim?.id);
}

function PlayerForm({ player }: { player?: PlayerWithGuardians }) {
  const g = player ? primaryGuardian(player) : undefined;
  const g2 = player ? secondGuardian(player) : undefined;
  return (
    <Card>
      <SectionTitle>{player ? "Edit player" : "Add player"}</SectionTitle>
      <form action={upsertPlayer} className="space-y-4">
        {player && <input type="hidden" name="id" value={player.id} />}
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" name="first_name" required>
            <input id="first_name" name="first_name" required className="input" defaultValue={player?.first_name ?? ""} />
          </Field>
          <Field label="Last name" name="last_name">
            <input id="last_name" name="last_name" className="input" defaultValue={player?.last_name ?? ""} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Jersey #" name="jersey_number">
            <input id="jersey_number" name="jersey_number" className="input" defaultValue={player?.jersey_number ?? ""} />
          </Field>
          <Field label="Preferred position" name="preferred_position">
            <input id="preferred_position" name="preferred_position" className="input" defaultValue={player?.preferred_position ?? ""} />
          </Field>
        </div>
        <Field label="Strong foot" name="strong_foot">
          <select id="strong_foot" name="strong_foot" className="input" defaultValue={player?.strong_foot ?? ""}>
            <option value="">Unset</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="both">Both</option>
          </select>
        </Field>

        <Field label="Strength (powers the tactics board colors)" name="strength">
          <select id="strength" name="strength" className="input" defaultValue={player?.strength ? String(player.strength) : ""}>
            <option value="">Unrated</option>
            <option value="5">5 · star</option>
            <option value="4">4 · strong</option>
            <option value="3">3 · solid</option>
            <option value="2">2 · developing</option>
            <option value="1">1 · new</option>
          </select>
        </Field>
        <Field label="Allergies" name="allergies">
          <input id="allergies" name="allergies" className="input" defaultValue={player?.allergies ?? ""} />
        </Field>
        <Field label="Medical notes" name="medical_notes">
          <textarea id="medical_notes" name="medical_notes" className="input" rows={2} defaultValue={player?.medical_notes ?? ""} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Emergency contact name" name="emergency_contact_name">
            <input id="emergency_contact_name" name="emergency_contact_name" className="input" defaultValue={player?.emergency_contact_name ?? ""} />
          </Field>
          <Field label="Emergency contact phone" name="emergency_contact_phone">
            <input id="emergency_contact_phone" name="emergency_contact_phone" className="input" defaultValue={player?.emergency_contact_phone ?? ""} />
          </Field>
        </div>
        <Field label="Coach notes (private)" name="coach_notes">
          <textarea id="coach_notes" name="coach_notes" className="input" rows={2} defaultValue={player?.coach_notes ?? ""} />
        </Field>

        <div className="border-t border-slate-200 pt-3">
          <SectionTitle>Primary guardian</SectionTitle>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" name="guardian1_name">
                <input id="guardian1_name" name="guardian1_name" className="input" defaultValue={g?.name ?? ""} />
              </Field>
              <Field label="Phone" name="guardian1_phone">
                <input id="guardian1_phone" name="guardian1_phone" className="input" defaultValue={g?.phone ?? ""} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email" name="guardian1_email">
                <input id="guardian1_email" name="guardian1_email" type="email" className="input" defaultValue={g?.email ?? ""} />
              </Field>
              <Field label="Relationship" name="guardian1_relationship">
                <input id="guardian1_relationship" name="guardian1_relationship" className="input" defaultValue={g?.relationship ?? ""} />
              </Field>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-3">
          <SectionTitle>Second guardian (optional)</SectionTitle>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" name="guardian2_name">
                <input id="guardian2_name" name="guardian2_name" className="input" defaultValue={g2?.name ?? ""} placeholder="e.g. Olivia's Dad" />
              </Field>
              <Field label="Phone" name="guardian2_phone">
                <input id="guardian2_phone" name="guardian2_phone" className="input" defaultValue={g2?.phone ?? ""} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email" name="guardian2_email">
                <input id="guardian2_email" name="guardian2_email" type="email" className="input" defaultValue={g2?.email ?? ""} />
              </Field>
              <Field label="Relationship" name="guardian2_relationship">
                <input id="guardian2_relationship" name="guardian2_relationship" className="input" defaultValue={g2?.relationship ?? ""} />
              </Field>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit">{player ? "Save changes" : "Add player"}</Button>
          <Button href="/team/roster" variant="ghost">Cancel</Button>
        </div>
      </form>
    </Card>
  );
}

export default async function RosterPage({ searchParams }: { searchParams: { edit?: string; add?: string } }) {
  const { team } = await requireCoachTeam();
  const players = await getPlayersWithGuardians(team.id);

  const pending = players.filter((p) => p.status === "pending");
  const approved = players
    .filter((p) => p.status === "approved")
    .sort((a, b) => {
      const ja = a.jersey_number ? parseInt(a.jersey_number, 10) : Number.MAX_SAFE_INTEGER;
      const jb = b.jersey_number ? parseInt(b.jersey_number, 10) : Number.MAX_SAFE_INTEGER;
      if (ja !== jb) return ja - jb;
      return a.first_name.localeCompare(b.first_name);
    });

  const approvedA = await withAvatars(approved);
  const profilesByPlayer = await readProfiles(approvedA.map((p) => p.id));
  const intakeByPlayer = await readIntakes(approvedA.map((p) => p.id));
  const origin = originFromEnv();
  const teamRules = await readTeamRules(team.id);
  const feeOn = (teamRules.feeCents ?? 0) > 0;
  const paid = feeOn ? await paidSet(approvedA.map((p) => p.id)) : new Set<string>();
  const norm = (x: string) => (x ?? "").toLowerCase().replace(/[^a-z]/g, "");
  const contactsOf = (pl: PlayerWithGuardians) => new Set(pl.guardians.flatMap((g) => [g.phone, g.email].filter(Boolean)).map((x) => String(x).toLowerCase()));
  const mergeInto: Record<string, { id: string; name: string }> = {};
  for (let i = 0; i < approvedA.length; i++) {
    const p = approvedA[i];
    for (let j = 0; j < i; j++) {
      const q = approvedA[j];
      if (mergeInto[q.id]) continue;
      const sameFirst = norm(p.first_name) === norm(q.first_name);
      const lastClose = lev(norm(p.last_name), norm(q.last_name)) <= 2;
      const pc = contactsOf(p); const qc = contactsOf(q);
      const shared = [...pc].some((c) => qc.has(c));
      if (sameFirst && (lastClose || shared)) { mergeInto[p.id] = { id: q.id, name: `${q.first_name} ${q.last_name}` }; break; }
    }
  }
  const nudgeLink = (phone: string | null | undefined, token: string) => {
    const d = (phone ?? "").replace(/\D/g, "");
    const intl = d.length === 10 ? "1" + d : d;
    const msg = `Hi! Coach here \u2014 here's your link for the ${team.name} team app: ${origin}/access/${token}  Tap it and you're in, no password. Say yes to notifications for game-day reminders \ud83d\udc4d`;
    return `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
  };
  const findDup = (pend: PlayerWithGuardians): PlayerWithGuardians | undefined => {
    const pc = contactsOf(pend);
    const fn = pend.first_name.toLowerCase();
    return approved.find((a) => {
      const ac = contactsOf(a);
      const sharedContact = [...pc].some((c) => ac.has(c));
      const sameName = a.first_name.toLowerCase() === fn && a.last_name.toLowerCase() === pend.last_name.toLowerCase();
      const sameFirstShared = a.first_name.toLowerCase() === fn && sharedContact;
      return sharedContact || sameName || sameFirstShared;
    });
  };
  const nameKey = (p: { first_name: string; last_name: string }) => `${p.first_name} ${p.last_name}`.toLowerCase().trim();
  const nameCounts: Record<string, number> = {};
  approved.forEach((p) => { nameCounts[nameKey(p)] = (nameCounts[nameKey(p)] ?? 0) + 1; });
  const dupNames = new Set(Object.keys(nameCounts).filter((k) => nameCounts[k] > 1));

  const editPlayer = searchParams.edit
    ? players.find((p) => p.id === searchParams.edit)
    : undefined;
  const showAdd = searchParams.add === "1";

  return (
    <div className="space-y-5">
      <PageTitle
        title="Roster"
        subtitle={`${approved.length} player${approved.length === 1 ? "" : "s"} · ${approved.filter((p) => p.claimed).length} joined`}
        action={!showAdd && !editPlayer ? <Button href="/team/roster?add=1">+ Add player</Button> : undefined}
      />

      {editPlayer && <PlayerForm player={editPlayer} />}
      {showAdd && !editPlayer && <PlayerForm />}

      {!editPlayer && (
        <details className="card !p-0 overflow-hidden">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-ink">⚡ Bulk add players (paste a list)</summary>
          <form action={bulkAddPlayers} className="space-y-2 border-t border-slate-100 p-4">
            <p className="text-xs text-slate-500">One name per line. Add a number like <code>Joey 7</code> if you want. Last name optional.</p>
            <textarea name="names" rows={5} className="input" placeholder={"William Bradley 10\nKaterina 11\nBenjamin"} />
            <button className="btn-primary">Add players</button>
          </form>
        </details>
      )}

      {pending.length > 0 && (
        <div>
          <SectionTitle>Pending approval</SectionTitle>
          <div className="space-y-3">
            {pending.map((p) => {
              const g = primaryGuardian(p);
              return (
                <Card key={p.id} className="border-amber-200 bg-amber-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {p.jersey_number ? `#${p.jersey_number} ` : ""}{p.first_name} {p.last_name}
                      </p>
                      {g && <p className="text-sm text-slate-600">{g.name}{g.phone ? ` · ${g.phone}` : ""}</p>}
                      {p.allergies && <p className="mt-1 text-sm text-rose-700">Allergies: {p.allergies}</p>}
                    </div>
                  </div>
                  {(() => { const dup = findDup(p); return dup ? (
                    <div className="mt-3 rounded-xl border border-amber-300 bg-white p-3">
                      <p className="text-sm font-semibold text-amber-900">⚠ Looks like {dup.first_name} {dup.last_name} who&rsquo;s already on your roster.</p>
                      <p className="text-xs text-slate-500">Probably the same child re-registered. Merge keeps the existing player and folds in any new info (like updated allergies).</p>
                      <form action={mergePending} className="mt-2">
                        <input type="hidden" name="pending" value={p.id} />
                        <input type="hidden" name="target" value={dup.id} />
                        <Button type="submit">Merge into {dup.first_name}</Button>
                      </form>
                    </div>
                  ) : null; })()}
                  <div className="mt-3 flex gap-2">
                    <form action={approvePlayer}>
                      <input type="hidden" name="id" value={p.id} />
                      <Button type="submit">Approve as new</Button>
                    </form>
                    <form action={rejectPlayer}>
                      <input type="hidden" name="id" value={p.id} />
                      <Button type="submit" variant="danger">Reject</Button>
                    </form>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <SectionTitle>Roster</SectionTitle>
        {approved.length === 0 ? (
          <EmptyState title="No players yet" hint="Add a player or share your invite link." />
        ) : (
          <div className="space-y-3">
            {approvedA.map((p) => {
              const isDup = dupNames.has(nameKey(p));
              const strengthLabel = p.strength ? `★${p.strength}` : null;
              return (
              <Card key={p.id} className="!p-0 overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <AvatarUpload id={p.id} name={`${p.first_name} ${p.last_name}`} photoUrl={p.avatar_url} action={uploadAvatar} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.first_name} {p.last_name}</p>
                    <p className="truncate text-xs text-slate-500">{[p.preferred_position, p.strong_foot ? `${p.strong_foot} foot` : null, strengthLabel].filter(Boolean).join(" · ") || "—"}</p>
                    {p.guardians.length > 0 && <p className="truncate text-xs text-slate-400">👤 {p.guardians.map((g) => g.name).filter(Boolean).join(", ")}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {p.claimed ? <Badge color="green">Joined</Badge> : <Badge color="slate">Not joined</Badge>}
                    {feeOn && (paid.has(p.id) ? <Badge color="green">Paid</Badge> : <Badge color="amber">Unpaid</Badge>)}
                    {!p.claimed && primaryGuardian(p)?.phone && (
                      <a href={nudgeLink(primaryGuardian(p)?.phone, p.access_token)} target="_blank" rel="noopener" className="text-xs font-semibold text-emerald-600">\ud83d\udcf2 Nudge</a>
                    )}
                    {p.allergies && <Badge color="red">Allergy</Badge>}
                  </div>
                </div>
                {mergeInto[p.id] ? (
                  <div className="mx-3 mb-2 rounded-xl border border-amber-300 bg-amber-50 p-2 text-xs">
                    <p className="font-semibold text-amber-900">⚠ Looks like the same player as {mergeInto[p.id].name}.</p>
                    <p className="mt-0.5 text-amber-800">Merge keeps {mergeInto[p.id].name}, moves this one&rsquo;s parent across, and <b>no one loses access</b>.</p>
                    <form action={mergePlayers} className="mt-1.5">
                      <input type="hidden" name="dup" value={p.id} />
                      <input type="hidden" name="keep" value={mergeInto[p.id].id} />
                      <ConfirmButton message={`Merge ${p.first_name} ${p.last_name} into ${mergeInto[p.id].name}? Both parents keep access; this duplicate is removed.`} className="rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white">Merge them</ConfirmButton>
                    </form>
                  </div>
                ) : isDup ? (
                  <div className="mx-3 mb-2 rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-800">⚠ Possible duplicate name — check Contacts &amp; details.</div>
                ) : null}
                <details className="border-t border-slate-100">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-600">Contacts &amp; details</summary>
                  <div className="space-y-2 px-3 pb-3 text-sm">
                    {p.guardians.length > 0 ? p.guardians.map((gg) => (
                      <div key={gg.id}>
                        <span className="font-medium">{gg.name}</span>{gg.is_primary ? <span className="text-slate-400"> · primary</span> : null}
                        <div className="text-slate-500">{[gg.phone, gg.email].filter(Boolean).join(" · ") || "no contact"}</div>
                      </div>
                    )) : <p className="text-slate-400">No guardian on file</p>}
                    {(p.allergies || p.medical_notes) && (
                      <div className="rounded-lg bg-rose-50 p-2 text-rose-800">
                        {p.allergies && <p>Allergies: {p.allergies}</p>}
                        {p.medical_notes && <p>Medical: {p.medical_notes}</p>}
                      </div>
                    )}
                    {(p.emergency_contact_name || p.emergency_contact_phone) && <p className="text-slate-600">Emergency: {[p.emergency_contact_name, p.emergency_contact_phone].filter(Boolean).join(" · ")}</p>}
                    {p.coach_notes && <p className="rounded-lg bg-slate-50 p-2 text-slate-600">📝 {p.coach_notes}</p>}
                  </div>
                </details>
                <details className="border-t border-slate-100">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-600">🧠 Coach tools — skills &amp; send a tip</summary>
                  <div className="space-y-3 px-3 pb-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">🔗 Parent access link</p>
                      <p className="mb-2 text-xs text-slate-500">Send this to a parent/guardian — tapping it logs them straight into {p.first_name}&rsquo;s parent view on their phone. No password.</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <CopyButton text={`${origin}/access/${p.access_token}`} label="Copy parent link" />
                        <form action={resetAccessToken}>
                          <input type="hidden" name="id" value={p.id} />
                          <ConfirmButton message={`Generate a new link for ${p.first_name}? Anyone using the old link — including a parent already signed in on this child — will need the new one.`} className="btn-ghost text-xs">Reset link</ConfirmButton>
                        </form>
                      </div>
                    </div>
                    {intakeByPlayer[p.id] && (
                      <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-700">💛 What the family shared</p>
                        {intakeByPlayer[p.id].about && <p className="text-slate-700"><b>As a kid:</b> {intakeByPlayer[p.id].about}</p>}
                        {intakeByPlayer[p.id].asPlayer && <p className="text-slate-700"><b>As a player:</b> {intakeByPlayer[p.id].asPlayer}</p>}
                        {intakeByPlayer[p.id].helpMe && <p className="text-slate-700"><b>Coaching tips:</b> {intakeByPlayer[p.id].helpMe}</p>}
                      </div>
                    )}
                    {(profilesByPlayer[p.id]?.notes?.length ?? 0) > 0 && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">📝 Notes</p>
                        <ul className="space-y-1 text-sm text-slate-700">
                          {profilesByPlayer[p.id]!.notes.slice(0, 8).map((n, i) => (
                            <li key={i}>{n.text} <span className="text-xs text-slate-400">· {new Date(n.at).toLocaleDateString()}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <CoachPlayerTools playerId={p.id} parentName={primaryGuardian(p)?.name ?? ""} initialSkills={profilesByPlayer[p.id]?.skills ?? []} />
                  </div>
                </details>
                <div className="flex border-t border-slate-100 text-sm font-medium">
                  <Link href={`/team/roster?edit=${p.id}`} className="flex-1 py-2.5 text-center text-brand-700">Edit</Link>
                  <form action={deletePlayer} className="flex-1 border-l border-slate-100">
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmButton message={`Delete ${p.first_name} ${p.last_name}? This removes them and their info for good.`} className="w-full py-2.5 text-center text-rose-600">Delete</ConfirmButton>
                  </form>
                </div>
              </Card>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}
