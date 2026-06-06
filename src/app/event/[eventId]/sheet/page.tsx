import Link from "next/link";
import { readSetPieces, SET_PIECE_FIELDS } from "@/lib/setpieces";
import { BackBar } from "@/components/BackBar";
import { notFound } from "next/navigation";
import { requireCoachTeam } from "@/lib/auth";
import { getEvent, getPlayersWithGuardians, getGameRoster, getVolunteers, getAttendance } from "@/lib/data";
import { fmtDateTime, fmtTime } from "@/lib/format";
import { EVENT_TYPE_LABEL } from "@/lib/types";
import type { PlayerWithGuardians, GameRosterRow, VolunteerRole } from "@/lib/types";
import { PrintButton } from "@/components/PrintButton";

const PRINT_CSS = `
@media print {
  .print\\:hidden { display: none !important; }
  body { background: #fff !important; }
  .sheet, .sheet * { color: #000 !important; }
  .sheet { padding: 0; }
}
.sheet table { width: 100%; border-collapse: collapse; }
.sheet th, .sheet td { border: 1px solid #cbd5e1; padding: 4px 8px; text-align: left; font-size: 12px; }
.sheet th { background: #f1f5f9; }
`;

function playerName(p: PlayerWithGuardians): string {
  return `${p.first_name} ${p.last_name}`;
}
function NameLink({ p }: { p: PlayerWithGuardians }) {
  return (
    <Link href={`/team/roster?edit=${p.id}`} className="text-brand-700 underline-offset-2 hover:underline print:text-black print:no-underline">
      {p.first_name} {p.last_name}
    </Link>
  );
}

export default async function GameSheetPage({
  params,
}: {
  params: { eventId: string };
}) {
  const { team } = await requireCoachTeam();
  const event = await getEvent(params.eventId);
  if (!event || event.team_id !== team.id) notFound();

  const [players, roster, volunteers, attendance] = await Promise.all([
    getPlayersWithGuardians(team.id),
    getGameRoster(event.id),
    getVolunteers(event.id),
    getAttendance(event.id),
  ]);
  const setPieces = await readSetPieces(team.id);
  const approved = players.filter((p) => p.status === "approved");
  const byPlayer = new Map<string, PlayerWithGuardians>(approved.map((p) => [p.id, p]));
  const rosterByPlayer = new Map<string, GameRosterRow>(roster.map((r) => [r.player_id, r]));

  const starters = approved
    .filter((p) => rosterByPlayer.get(p.id)?.status === "starter")
    .sort((a, b) => (rosterByPlayer.get(a.id)?.position ?? "").localeCompare(rosterByPlayer.get(b.id)?.position ?? ""));
  const bench = approved.filter((p) => rosterByPlayer.get(p.id)?.status === "bench");

  const sortedRoster = [...approved].sort((a, b) => {
    const ja = a.jersey_number ? parseInt(a.jersey_number, 10) : 9999;
    const jb = b.jersey_number ? parseInt(b.jersey_number, 10) : 9999;
    if (ja !== jb) return ja - jb;
    return a.first_name.localeCompare(b.first_name);
  });

  const volByRole = (v: VolunteerRole): string => {
    if (v.player_id) {
      const p = byPlayer.get(v.player_id);
      return p ? playerName(p) : "Assigned";
    }
    return "—";
  };

  const title = event.title || (event.opponent ? `vs ${event.opponent}` : EVENT_TYPE_LABEL[event.type]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <BackBar />
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="print:hidden mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">Game-day sheet</p>
        <PrintButton label="Print sheet" />
      </div>

      <div className="sheet space-y-6">
        <header className="border-b border-slate-300 pb-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{team.name}</p>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-slate-600">{fmtDateTime(event.start_time)}</p>
          <p className="text-sm text-slate-600">
            {event.location && <>📍 {event.location}</>}
            {event.field_number && <> · Field {event.field_number}</>}
            {event.arrival_time && <> · Arrive {fmtTime(event.arrival_time)}</>}
          </p>
        </header>

        <section>
          <h2 className="mb-2 text-lg font-bold">Lineup</h2>
          <p className="mb-1 text-sm font-semibold">Starters</p>
          {starters.length === 0 ? (
            <p className="text-sm text-slate-500">No starters set yet. <Link href={`/team/tactics?event=${event.id}`} className="text-brand-700 underline print:hidden">Build a lineup in Tactics →</Link></p>
          ) : (
            <ul className="mb-3 space-y-0.5 text-sm">
              {starters.map((p) => {
                const r = rosterByPlayer.get(p.id);
                return (
                  <li key={p.id}>
                    <span className="font-medium">{r?.position || "—"}</span> — <NameLink p={p} />
                    {p.jersey_number && <span className="text-slate-500"> #{p.jersey_number}</span>}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mb-1 text-sm font-semibold">Bench</p>
          {bench.length === 0 ? (
            <p className="text-sm text-slate-500">No bench players.</p>
          ) : (
            <ul className="space-y-0.5 text-sm">
              {bench.map((p) => (
                <li key={p.id}>
                  <NameLink p={p} />
                  {p.jersey_number && <span className="text-slate-500"> #{p.jersey_number}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">Full roster &amp; safety</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Allergies</th>
                <th>Emergency contact</th>
                <th>Phone</th>
                <th>Guardian phone</th>
              </tr>
            </thead>
            <tbody>
              {sortedRoster.map((p) => {
                const primary = p.guardians.find((g) => g.is_primary) ?? p.guardians[0];
                return (
                  <tr key={p.id}>
                    <td>{p.jersey_number || "—"}</td>
                    <td><NameLink p={p} /></td>
                    <td style={p.allergies ? { color: "#b91c1c", fontWeight: 700 } : undefined}>
                      {p.allergies || "—"}
                    </td>
                    <td>{p.emergency_contact_name || "—"}</td>
                    <td>{p.emergency_contact_phone || "—"}</td>
                    <td>{primary?.phone || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">Set pieces</h2>
          {SET_PIECE_FIELDS.some((f) => setPieces[f.key]) ? (
            <ul className="space-y-0.5 text-sm">
              {SET_PIECE_FIELDS.filter((f) => setPieces[f.key]).map((f) => {
                const pl = byPlayer.get(setPieces[f.key] as string);
                return <li key={f.key}><span className="font-medium">{f.label}:</span> {pl ? playerName(pl) : "—"}</li>;
              })}
            </ul>
          ) : <p className="text-sm text-slate-500">Not set.</p>}
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">Volunteers</h2>
          {volunteers.length === 0 ? (
            <p className="text-sm text-slate-500">No volunteers assigned.</p>
          ) : (
            <ul className="space-y-0.5 text-sm">
              {volunteers.map((v) => (
                <li key={v.id}>
                  <span className="font-medium">{v.role}:</span> {volByRole(v)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="border-t border-slate-300 pt-2 text-xs text-slate-500">
          {attendance.filter((a) => a.status === "attending").length} confirmed attending ·
          Printed from {team.name}
        </footer>
      </div>
    </div>
  );
}
