import { getCoachTeam } from "@/lib/auth";
import { Suspense } from "react";
import { CoachNav } from "@/components/CoachNav";
import { SaveToast } from "@/components/SaveToast";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const { team } = await getCoachTeam();
  return (
    <div className="min-h-screen">
      <Suspense>{<SaveToast />}</Suspense>
      {team && <CoachNav teamName={team.name} />}
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5">{children}</main>
    </div>
  );
}
