import { getCoachTeam, listCoachTeams, requireUser } from "@/lib/auth";
import { Suspense } from "react";
import { CoachNav } from "@/components/CoachNav";
import { SaveToast } from "@/components/SaveToast";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const teams = await listCoachTeams(user);
  const { team } = await getCoachTeam();
  return (
    <div className="min-h-screen">
      <Suspense>{<SaveToast />}</Suspense>
      {team && <CoachNav teamName={team.name} teams={teams.map((t) => ({ id: t.id, name: t.name }))} currentId={team.id} />}
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5 lg:mx-0 lg:ml-60 lg:max-w-4xl lg:pb-10 lg:pl-8 lg:pr-8 lg:pt-8">{children}</main>
    </div>
  );
}
