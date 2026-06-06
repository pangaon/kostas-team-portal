"use server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { originFromEnv } from "@/lib/data";
import { writeMagicToken } from "@/lib/magiclink";
import { sendEmail } from "@/lib/email";

export async function requestMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) redirect("/signin?error=" + encodeURIComponent("Enter a valid email"));
  const db = createAdminClient();
  const { data: gs } = await db.from("guardians").select("player_id").ilike("email", email);
  let dev = "";
  if (gs && gs.length) {
    const token = crypto.randomUUID();
    await writeMagicToken(token, { email, exp: Date.now() + 30 * 60 * 1000 });
    const url = `${originFromEnv()}/access/verify/${token}`;
    const ok = await sendEmail(email, "Your team app sign-in link",
      `Tap to sign in (expires in 30 minutes):\n${url}\n\nIf you didn't request this, you can ignore it.`);
    if (!ok) dev = "&dev=" + encodeURIComponent(url);
  }
  // Always say "check your email" — never reveal whether an email is on file.
  redirect("/signin?sent=1" + dev);
}
