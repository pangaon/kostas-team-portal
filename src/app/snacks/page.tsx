import { redirect } from "next/navigation";
import { getParentSession } from "@/lib/parent";

export const dynamic = "force-dynamic";

export default async function SnacksRedirect() {
  const s = await getParentSession();
  redirect(s ? "/parent/snacks" : "/team/snacks");
}
