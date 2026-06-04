import { createAdminClient } from "@/lib/supabase/admin";
import { getUnclaimedPlayers } from "@/lib/data";
import { Card, PageTitle, Badge, Button } from "@/components/ui";
import { JoinForm } from "./JoinForm";
import { claimChild } from "./actions";

export const dynamic = "force-dynamic";

type TeamRow = { id: string; name: string; sport: string | null; season: string | null; age_group: string | null; invite_code: string };

export default async function JoinPage({ params }: { params: { inviteCode: string } }) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("teams").select("id,name,sport,season,age_group,invite_code")
    .eq("invite_code", params.inviteCode).maybeSingle();
  const team = (data as TeamRow) ?? null;

  if (!team) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-10">
        <Card className="text-center">
          <p className="text-2xl">🤔</p>
          <p className="mt-2 font-semibold text-slate-800">This invite link isn&apos;t valid</p>
          <p className="mt-1 text-sm text-slate-500">Double-check the link your coach sent.</p>
        </Card>
      </main>
    );
  }

  const roster = await getUnclaimedPlayers(team.id);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <div className="mb-5">
        <PageTitle title={team.name} />
        <div className="-mt-2 flex flex-wrap items-center gap-2">
          {team.age_group && <Badge color="blue">{team.age_group}</Badge>}
          {team.season && <Badge color="slate">{team.season}</Badge>}
        </div>
      </div>

      {roster.length > 0 && (
        <Card className="mb-5">
          <p className="font-semibold text-slate-800">Is your child already on the roster?</p>
          <p className="mb-3 mt-1 text-sm text-slate-500">Tap their name to join instantly — no form needed.</p>
          <div className="space-y-2">
            {roster.map((p) => (
              <form key={p.id} action={claimChild}>
                <input type="hidden" name="inviteCode" value={team.invite_code} />
                <input type="hidden" name="player_id" value={p.id} />
                <button className="flex min-h-[52px] w-full items-center justify-between rounded-xl border border-slate-300 px-4 text-left font-medium hover:bg-slate-50">
                  <span>{p.first_name} {p.last_name}</span>
                  <span className="text-sm text-slate-400">{p.jersey_number ? `#${p.jersey_number}` : ""} →</span>
                </button>
              </form>
            ))}
          </div>
          <p className="mt-3 text-center text-sm text-slate-400">Not listed? Add your child below.</p>
        </Card>
      )}

      <p className="mb-3 text-sm font-medium text-slate-700">
        {roster.length > 0 ? "Add a new player" : "Add your player to join the team."}
      </p>
      <JoinForm inviteCode={params.inviteCode} teamName={team.name} />
    </main>
  );
}
