import { BackBar } from "@/components/BackBar";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentSession } from "@/lib/parent";
import { getEvent, getAttendance } from "@/lib/data";
import { fmtDateTime, fmtTime } from "@/lib/format";
import {
  Card,
  PageTitle,
  SectionTitle,
  Badge,
  Button,
} from "@/components/ui";
import {
  EVENT_TYPE_LABEL,
  ATT_LABEL,
  DEFAULT_VOLUNTEER_ROLES,
  type TeamEvent,
  type AttendanceStatus,
} from "@/lib/types";
import {
  setAttendance,
  claimSnack,
  cancelSnack,
  postCarpool,
  deleteCarpool,
  setVolunteer,
  clearVolunteer,
} from "@/lib/parent-actions";

export const dynamic = "force-dynamic";

function mapsUrl(loc: string): string {
  return `https://maps.google.com/?q=${encodeURIComponent(loc)}`;
}

function eventTitle(e: TeamEvent): string {
  return e.type === "game" && e.opponent
    ? `vs ${e.opponent}`
    : e.title || EVENT_TYPE_LABEL[e.type];
}

function EventHeader({ e }: { e: TeamEvent }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge color={e.type === "game" ? "blue" : "slate"}>
          {EVENT_TYPE_LABEL[e.type]}
        </Badge>
        {e.status === "cancelled" && <Badge color="red">Cancelled</Badge>}
        {e.status === "postponed" && <Badge color="amber">Postponed</Badge>}
      </div>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">{eventTitle(e)}</h1>
      <p className="mt-1 text-slate-600">{fmtDateTime(e.start_time)}</p>
      {e.arrival_time && (
        <p className="text-sm text-amber-700">
          Arrive by {fmtTime(e.arrival_time)}
        </p>
      )}
      {e.location && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-sm text-slate-600">{e.location}</p>
          <a
            href={mapsUrl(e.location)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-brand-700"
          >
            📍 Directions
          </a>
        </div>
      )}
      {e.field_number && (
        <p className="text-sm text-slate-500">Field {e.field_number}</p>
      )}
      {e.notes && <p className="mt-2 text-sm text-slate-700">{e.notes}</p>}
    </div>
  );
}

type GuardedPlayer = { first_name: string } | null;

export default async function EventDetailPage({
  params,
}: {
  params: { eventId: string };
}) {
  const session = await getParentSession();
  const event = await getEvent(params.eventId);
  if (!event) notFound();

  // ---- Read-only view (no session, or a different team) ----
  if (!session || event.team_id !== session.team.id) {
    return (
      <main className="mx-auto w-full max-w-md space-y-4 px-4 py-8">
        <BackBar href="/" label="Home" />
        <Card>
          <EventHeader e={event} />
        </Card>
        <Card className="text-center text-sm text-slate-600">
          <p>Open your team&apos;s invite link to respond, or coaches can sign in.</p>
          <div className="mt-3">
            <Button href="/login" variant="secondary">
              Sign in
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  const db = createAdminClient();
  const playerId = session.player.id;
  const eventId = event.id;

  // Attendance for this player
  const attendance = await getAttendance(eventId);
  const myAtt = attendance.find((a) => a.player_id === playerId) ?? null;

  // Snack signup for this event
  const { data: snackRows } = await db
    .from("snack_signups")
    .select("id,player_id,snack_notes,players(first_name)")
    .eq("event_id", eventId);
  const snack =
    (snackRows as
      | Array<{
          id: string;
          player_id: string | null;
          snack_notes: string | null;
          players: GuardedPlayer;
        }>
      | null)?.[0] ?? null;
  const snackMine = snack && snack.player_id === playerId;

  // Volunteer roles for this event
  const { data: volRows } = await db
    .from("volunteer_roles")
    .select("id,role,player_id,players(first_name)")
    .eq("event_id", eventId);
  const volunteers =
    (volRows as
      | Array<{
          id: string;
          role: string;
          player_id: string | null;
          players: GuardedPlayer;
        }>
      | null) ?? [];
  const roleSet = new Set<string>(DEFAULT_VOLUNTEER_ROLES);
  for (const v of volunteers) roleSet.add(v.role);
  const allRoles = Array.from(roleSet);

  // Carpool posts for this event
  const { data: carpoolRows } = await db
    .from("carpool_posts")
    .select("id,kind,seats,note,contact,player_id,players(first_name)")
    .eq("event_id", eventId)
    .order("created_at");
  const carpool =
    (carpoolRows as
      | Array<{
          id: string;
          kind: "offer" | "need";
          seats: number | null;
          note: string | null;
          contact: string | null;
          player_id: string | null;
          players: GuardedPlayer;
        }>
      | null) ?? [];
  const offers = carpool.filter((c) => c.kind === "offer");
  const needs = carpool.filter((c) => c.kind === "need");

  const attBtnBase =
    "inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl px-3 text-sm font-semibold transition";
  function attBtn(status: AttendanceStatus, on: string) {
    const active = myAtt?.status === status;
    return active
      ? `${attBtnBase} ${on}`
      : `${attBtnBase} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`;
  }

  return (
    <main className="mx-auto w-full max-w-md space-y-4 px-4 py-8">
        <BackBar href="/" label="Home" />
      <Card>
        <EventHeader e={event} />
      </Card>

      {/* Attendance */}
      <Card>
        <SectionTitle>
          Will {session.player.first_name} be there?
        </SectionTitle>
        <form action={setAttendance} className="flex gap-2">
          <input type="hidden" name="event_id" value={eventId} />
          <button
            type="submit"
            name="status"
            value="attending"
            className={attBtn("attending", "bg-emerald-600 text-white")}
          >
            Yes
          </button>
          <button
            type="submit"
            name="status"
            value="maybe"
            className={attBtn("maybe", "bg-amber-500 text-white")}
          >
            Maybe
          </button>
          <button
            type="submit"
            name="status"
            value="not_attending"
            className={attBtn("not_attending", "bg-rose-600 text-white")}
          >
            No
          </button>
        </form>
        {myAtt && (
          <p className="mt-2 text-sm text-slate-500">
            Your response: {ATT_LABEL[myAtt.status]}
          </p>
        )}
      </Card>

      {/* Snack */}
      <Card>
        <SectionTitle>Snack</SectionTitle>
        {!snack ? (
          <form action={claimSnack} className="space-y-2">
            <input type="hidden" name="event_id" value={eventId} />
            <input
              name="snack_notes"
              className="input"
              placeholder="What you'll bring (optional)"
            />
            <Button type="submit" className="w-full">
              I&apos;ll bring snack
            </Button>
          </form>
        ) : snackMine ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-700">
              You&apos;re bringing snack
              {snack.snack_notes ? `: ${snack.snack_notes}` : "."}
            </p>
            <form action={cancelSnack}>
              <input type="hidden" name="event_id" value={eventId} />
              <Button type="submit" variant="danger" className="w-full">
                Cancel snack
              </Button>
            </form>
          </div>
        ) : (
          <p className="text-sm text-slate-700">
            Claimed by {snack.players?.first_name ?? "another family"}
            {snack.snack_notes ? ` — ${snack.snack_notes}` : ""}
          </p>
        )}
        <p className="mt-2 text-xs text-slate-400">
          Please keep snacks nut-free for everyone&apos;s safety.
        </p>
      </Card>

      {/* Volunteer roles */}
      <Card>
        <SectionTitle>Volunteer roles</SectionTitle>
        <ul className="space-y-2">
          {allRoles.map((role) => {
            const claim = volunteers.find((v) => v.role === role) ?? null;
            const mine = claim && claim.player_id === playerId;
            return (
              <li
                key={role}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-2.5"
              >
                <span className="text-sm font-medium text-slate-700">{role}</span>
                {!claim ? (
                  <form action={setVolunteer}>
                    <input type="hidden" name="event_id" value={eventId} />
                    <input type="hidden" name="role" value={role} />
                    <Button
                      type="submit"
                      variant="secondary"
                      className="min-h-[40px] px-3 text-sm"
                    >
                      Claim
                    </Button>
                  </form>
                ) : mine ? (
                  <form action={clearVolunteer}>
                    <input type="hidden" name="id" value={claim.id} />
                    <input type="hidden" name="event_id" value={eventId} />
                    <Button
                      type="submit"
                      variant="danger"
                      className="min-h-[40px] px-3 text-sm"
                    >
                      Clear
                    </Button>
                  </form>
                ) : (
                  <span className="text-sm text-slate-500">
                    {claim.players?.first_name ?? "Taken"}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Carpool board */}
      <Card>
        <SectionTitle>Carpool board</SectionTitle>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Offering rides
            </p>
            {offers.length === 0 ? (
              <p className="mt-1 text-sm text-slate-400">No offers yet.</p>
            ) : (
              <ul className="mt-1 space-y-2">
                {offers.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-slate-200 p-2.5 text-sm"
                  >
                    <p className="font-medium text-slate-800">
                      {c.players?.first_name ?? "A family"}
                      {typeof c.seats === "number" ? ` · ${c.seats} seats` : ""}
                    </p>
                    {c.note && <p className="text-slate-600">{c.note}</p>}
                    {c.contact && (
                      <p className="text-slate-500">Contact: {c.contact}</p>
                    )}
                    {c.player_id === playerId && (
                      <form action={deleteCarpool} className="mt-1.5">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="event_id" value={eventId} />
                        <button
                          type="submit"
                          className="text-xs font-semibold text-rose-600"
                        >
                          Remove
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              Needing rides
            </p>
            {needs.length === 0 ? (
              <p className="mt-1 text-sm text-slate-400">No requests yet.</p>
            ) : (
              <ul className="mt-1 space-y-2">
                {needs.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-slate-200 p-2.5 text-sm"
                  >
                    <p className="font-medium text-slate-800">
                      {c.players?.first_name ?? "A family"}
                      {typeof c.seats === "number" ? ` · ${c.seats} seats` : ""}
                    </p>
                    {c.note && <p className="text-slate-600">{c.note}</p>}
                    {c.contact && (
                      <p className="text-slate-500">Contact: {c.contact}</p>
                    )}
                    {c.player_id === playerId && (
                      <form action={deleteCarpool} className="mt-1.5">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="event_id" value={eventId} />
                        <button
                          type="submit"
                          className="text-xs font-semibold text-rose-600"
                        >
                          Remove
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <form
          action={postCarpool}
          className="mt-4 space-y-2 border-t border-slate-200 pt-4"
        >
          <input type="hidden" name="event_id" value={eventId} />
          <div className="flex gap-2">
            <select name="kind" className="input" defaultValue="offer">
              <option value="offer">Offering a ride</option>
              <option value="need">Need a ride</option>
            </select>
            <input
              name="seats"
              className="input"
              type="number"
              min={0}
              placeholder="Seats"
            />
          </div>
          <input name="note" className="input" placeholder="Note (optional)" />
          <input
            name="contact"
            className="input"
            placeholder="Contact, only if you want it shown (optional)"
          />
          <Button type="submit" variant="secondary" className="w-full">
            Post to carpool
          </Button>
        </form>
      </Card>
    </main>
  );
}
