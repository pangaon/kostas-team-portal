import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
// Game-day check-in is now part of the live game console (on-field toggle).
export default function CheckinRedirect({ searchParams }: { searchParams: { event?: string } }) {
  redirect(searchParams.event ? `/event/${searchParams.event}/live` : "/dashboard");
}
