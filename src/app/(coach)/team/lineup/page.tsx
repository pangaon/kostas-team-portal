import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
// The old dropdown lineup is replaced by the visual Tactics pitch.
export default function LineupRedirect({ searchParams }: { searchParams: { event?: string } }) {
  redirect(searchParams.event ? `/team/tactics?event=${searchParams.event}` : "/team/tactics");
}
