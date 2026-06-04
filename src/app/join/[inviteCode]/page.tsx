import { createAdminClient } from "@/lib/supabase/admin";
import { Card, PageTitle, Badge } from "@/components/ui";
import { JoinForm } from "./JoinForm";

export const dynamic = "force-dynamic";

type TeamRow = {
  id: string;
  name: string;
  sport: string | null;
  season: string | null;
  age_group: string | null;
  invite_code: string;
};

export default async function JoinPage({
  params,
}: {
  params: { inviteCode: string };
}) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("teams")
    .select("id,name,sport,season,age_group,invite_code")
    .eq("invite_code", params.inviteCode)
    .maybeSingle();
  const team = (data as TeamRow) ?? null;

  if (!team) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-10">
        <Card className="text-center">
          <p className="text-2xl">🤔</p>
          <p className="mt-2 font-semibold text-slate-800">
            This invite link isn&apos;t valid
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Double-check the link your coach sent.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <div className="mb-5">
        <PageTitle title={team.name} />
        <div className="-mt-2 flex flex-wrap items-center gap-2">
          {team.age_group && <Badge color="blue">{team.age_group}</Badge>}
          {team.season && <Badge color="slate">{team.season}</Badge>}
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Add your player to join the team.
        </p>
      </div>
      <JoinForm inviteCode={params.inviteCode} teamName={team.name} />
    </main>
  );
}
