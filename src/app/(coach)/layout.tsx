import { getCoachTeam } from "@/lib/auth";
import { CoachNav } from "@/components/CoachNav";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const { team } = await getCoachTeam();
  return (
    <div className="min-h-screen">
      {team && <CoachNav teamName={team.name} />}
      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>
    </div>
  );
}
