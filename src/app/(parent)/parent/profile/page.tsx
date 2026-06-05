import { getParentSession } from "@/lib/parent";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateOwnProfile, addBlock, removeBlock, updateIntake } from "@/lib/parent-actions";
import { fmtDate } from "@/lib/format";
import { Card, PageTitle, SectionTitle, Button, EmptyState } from "@/components/ui";
import type { Guardian, AvailabilityBlock } from "@/lib/types";
import { readIntake } from "@/lib/parentintake";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getParentSession();
  if (!session) return null;
  const { player, team } = session;

  const admin = createAdminClient();
  // Own child's primary guardian only (privacy: never other families).
  const { data: guardian } = await admin
    .from("guardians")
    .select("*")
    .eq("player_id", player.id)
    .eq("is_primary", true)
    .maybeSingle();
  const g = (guardian as Guardian) ?? null;
  const { data: realPlayer } = await admin.from("players").select("strong_foot, preferred_position").eq("id", player.id).maybeSingle();
  const rp = (realPlayer as { strong_foot: string | null; preferred_position: string | null } | null) ?? null;
  const intake = await readIntake(player.id);

  const { data: blockData } = await admin
    .from("availability_blocks")
    .select("*")
    .eq("player_id", player.id)
    .order("start_date");
  const blocks = (blockData as AvailabilityBlock[]) ?? [];

  return (
    <div className="space-y-5">
      <PageTitle title={`${player.first_name}'s profile`} subtitle={team.name} />

      <form action={updateIntake}>
        <Card className="space-y-3 border-brand-200 bg-brand-50/40">
          <div>
            <SectionTitle>💛 Help your coach get to know {player.first_name}</SectionTitle>
            <p className="text-sm text-slate-600">Your coach is meeting the kids fresh — you know {player.first_name} best. A few lines really help (all optional, only your coach sees this).</p>
          </div>
          <div>
            <label className="label" htmlFor="about">As a kid — personality, what makes them tick</label>
            <textarea id="about" name="about" rows={2} className="input" defaultValue={intake.about ?? ""} placeholder="e.g. Shy at first but loves encouragement; super competitive; best friends with Caleb." />
          </div>
          <div>
            <label className="label" htmlFor="asPlayer">As a player — strengths, what they love, goals</label>
            <textarea id="asPlayer" name="asPlayer" rows={2} className="input" defaultValue={intake.asPlayer ?? ""} placeholder="e.g. Quick and loves attacking; wants to try goalie; gets down on himself after mistakes." />
          </div>
          <div>
            <label className="label" htmlFor="helpMe">Anything that helps you coach them well</label>
            <textarea id="helpMe" name="helpMe" rows={2} className="input" defaultValue={intake.helpMe ?? ""} placeholder="e.g. Responds great to specific praise; needs a sub before he overheats; asthma — carries a puffer." />
          </div>
          <Button type="submit">Save for coach</Button>
        </Card>
      </form>

      <form action={updateOwnProfile} className="space-y-4">
        <Card className="space-y-3">
          <SectionTitle>Player</SectionTitle>
          <div>
            <label className="label" htmlFor="jersey_number">Jersey number</label>
            <input
              id="jersey_number"
              name="jersey_number"
              className="input"
              defaultValue={player.jersey_number ?? ""}
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="label" htmlFor="allergies">Allergies</label>
            <input
              id="allergies"
              name="allergies"
              className="input"
              defaultValue={player.allergies ?? ""}
              placeholder="e.g. peanuts, dairy"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="strong_foot">Strong foot / hand</label>
              <select id="strong_foot" name="strong_foot" className="input" defaultValue={rp?.strong_foot ?? ""}>
                <option value="">Not set</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="preferred_position">Favourite position</label>
              <input id="preferred_position" name="preferred_position" className="input" defaultValue={rp?.preferred_position ?? ""} placeholder="e.g. midfield, goalie" />
            </div>
          </div>
          <p className="text-xs text-slate-400">Helps your coach plan the lineup. You can leave these blank.</p>
        </Card>

        <Card className="space-y-3">
          <SectionTitle>Emergency contact</SectionTitle>
          <div>
            <label className="label" htmlFor="emergency_contact_name">Name</label>
            <input
              id="emergency_contact_name"
              name="emergency_contact_name"
              className="input"
              defaultValue={player.emergency_contact_name ?? ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="emergency_contact_phone">Phone</label>
            <input
              id="emergency_contact_phone"
              name="emergency_contact_phone"
              className="input"
              type="tel"
              defaultValue={player.emergency_contact_phone ?? ""}
            />
          </div>
        </Card>

        <Card className="space-y-3">
          <SectionTitle>Your contact (parent)</SectionTitle>
          <div>
            <label className="label" htmlFor="name">Your name</label>
            <input id="name" name="name" className="input" defaultValue={g?.name ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input id="phone" name="phone" className="input" type="tel" defaultValue={g?.phone ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" className="input" type="email" defaultValue={g?.email ?? ""} />
          </div>
        </Card>

        <Button type="submit" className="w-full">Save changes</Button>
      </form>

      <Card className="space-y-3">
        <SectionTitle>When {player.first_name} is away</SectionTitle>
        <p className="text-sm text-slate-600">
          Add date ranges (vacation, travel, etc). We&rsquo;ll automatically mark{" "}
          {player.first_name} as not attending any games in that range.
        </p>

        {blocks.length === 0 ? (
          <EmptyState title="No away dates set" />
        ) : (
          <ul className="space-y-2">
            {blocks.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {fmtDate(b.start_date)} – {fmtDate(b.end_date)}
                  </p>
                  {b.reason && <p className="truncate text-sm text-slate-500">{b.reason}</p>}
                </div>
                <form action={removeBlock}>
                  <input type="hidden" name="id" value={b.id} />
                  <Button type="submit" variant="danger" className="min-h-[40px] px-3 text-sm">
                    Remove
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={addBlock} className="space-y-2 border-t border-slate-100 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label" htmlFor="start_date">From</label>
              <input id="start_date" name="start_date" type="date" className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="end_date">To</label>
              <input id="end_date" name="end_date" type="date" className="input" required />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="reason">Reason (optional)</label>
            <input id="reason" name="reason" className="input" placeholder="e.g. family vacation" />
          </div>
          <Button type="submit" variant="secondary" className="w-full">
            Add away dates
          </Button>
        </form>
      </Card>

      <Card className="space-y-2">
        <SectionTitle>Add another child</SectionTitle>
        <p className="text-sm text-slate-600">
          Have a sibling on a team? Just tap that child&rsquo;s invite link again — it adds them here,
          and you can switch between kids from the Home screen.
        </p>
        <form action="/join" method="get" className="flex gap-2 pt-1">
          <input
            name="code"
            className="input"
            placeholder="Or enter an invite code"
            autoCapitalize="characters"
          />
          <Button type="submit" variant="secondary">Go</Button>
        </form>
      </Card>
    </div>
  );
}
