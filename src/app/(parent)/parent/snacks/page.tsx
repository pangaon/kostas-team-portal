import { getParentSession } from "@/lib/parent";
import { getEvents, getSnacks } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { claimSnack, cancelSnack } from "@/lib/parent-actions";
import { fmtDateTime } from "@/lib/format";
import { Card, PageTitle, SectionTitle, Badge, Button, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

// PRIVACY: we only read first_name + allergies (a safety reminder).
// We never read or render medical_notes, phone, email, or coach_notes.
type AllergyRow = { first_name: string; allergies: string | null };

export default async function SnacksPage() {
  const session = await getParentSession();
  if (!session) return null;
  const { player, team } = session;

  const admin = createAdminClient();
  const { data: allergyData } = await admin
    .from("players")
    .select("first_name, allergies")
    .eq("team_id", team.id)
    .eq("status", "approved")
    .not("allergies", "is", null);
  const allergyRows = ((allergyData as AllergyRow[]) ?? []).filter(
    (r) => r.allergies && r.allergies.trim().length > 0
  );

  const events = await getEvents(team.id);
  const snacks = await getSnacks(team.id);
  const cutoff = Date.now() - 3 * 3600 * 1000;

  // Names of claimers (first name only) — privacy-safe lookup.
  const claimerIds = Array.from(
    new Set(snacks.map((s) => s.player_id).filter((id): id is string => !!id))
  );
  const nameById = new Map<string, string>();
  if (claimerIds.length > 0) {
    const { data: names } = await admin
      .from("players")
      .select("id, first_name")
      .in("id", claimerIds);
    for (const n of (names as { id: string; first_name: string }[]) ?? []) {
      nameById.set(n.id, n.first_name);
    }
  }

  const upcomingGames = events.filter(
    (e) =>
      e.type === "game" &&
      e.status !== "cancelled" &&
      new Date(e.start_time).getTime() >= cutoff
  );

  return (
    <div className="space-y-4">
      <PageTitle title="Snacks" subtitle={team.name} />

      <Card className="border-amber-200 bg-amber-50">
        <p className="font-semibold text-amber-900">⚠️ Please keep snacks nut-free.</p>
        {allergyRows.length > 0 && (
          <div className="mt-2 text-sm text-amber-900">
            <p className="font-medium">Allergies on this team:</p>
            <ul className="mt-1 list-inside list-disc">
              {allergyRows.map((r, i) => (
                <li key={i}>
                  <span className="font-medium">{r.first_name}</span>: {r.allergies}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <div className="space-y-3">
        <SectionTitle>Upcoming games</SectionTitle>
        {upcomingGames.length === 0 ? (
          <EmptyState title="No upcoming games" />
        ) : (
          upcomingGames.map((e) => {
            const claim = snacks.find((s) => s.event_id === e.id) ?? null;
            const mine = claim?.player_id === player.id;
            const claimerName = claim?.player_id
              ? nameById.get(claim.player_id) ?? "A family"
              : null;
            return (
              <Card key={e.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">
                    {e.opponent ? `vs ${e.opponent}` : e.title || "Game"}
                  </p>
                  {claim ? (
                    <Badge color={mine ? "blue" : "green"}>
                      {mine ? "You" : "Claimed"}
                    </Badge>
                  ) : (
                    <Badge color="amber">Open</Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600">{fmtDateTime(e.start_time)}</p>

                {claim ? (
                  <>
                    <p className="text-sm text-slate-600">
                      Bringing snacks: <span className="font-medium">{claimerName}</span>
                      {claim.snack_notes ? ` — ${claim.snack_notes}` : ""}
                    </p>
                    {mine && (
                      <form action={cancelSnack}>
                        <input type="hidden" name="event_id" value={e.id} />
                        <Button type="submit" variant="danger" className="w-full">
                          Cancel my snack
                        </Button>
                      </form>
                    )}
                  </>
                ) : (
                  <form action={claimSnack} className="space-y-2">
                    <input type="hidden" name="event_id" value={e.id} />
                    <input
                      className="input"
                      name="snack_notes"
                      placeholder="What you'll bring (optional)"
                    />
                    <Button type="submit" className="w-full">
                      I&rsquo;ll bring snacks 🍎
                    </Button>
                  </form>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
