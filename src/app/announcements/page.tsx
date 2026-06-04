import { redirect } from "next/navigation";
import { getParentSession } from "@/lib/parent";

export const dynamic = "force-dynamic";

export default async function AnnouncementsRedirect() {
  const s = await getParentSession();
  redirect(s ? "/parent/announcements" : "/team/announcements");
}
