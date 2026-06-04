"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentSession, setActiveChild } from "@/lib/parent";
import type { AttendanceStatus } from "@/lib/types";

function s(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}
function nullable(v: string): string | null {
  return v === "" ? null : v;
}
function cap(v: string, n: number): string {
  return v.slice(0, n);
}

// Confirm an event belongs to the active child's team before mutating.
async function eventBelongs(
  db: ReturnType<typeof createAdminClient>,
  eventId: string,
  teamId: string
): Promise<boolean> {
  if (!eventId) return false;
  const { data } = await db
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("team_id", teamId)
    .maybeSingle();
  return !!data;
}

const ATT_STATUSES: AttendanceStatus[] = ["attending", "not_attending", "maybe"];

export async function setAttendance(formData: FormData) {
  const session = await getParentSession();
  if (!session) return;
  const db = createAdminClient();
  const event_id = s(formData, "event_id");
  if (!(await eventBelongs(db, event_id, session.team.id))) return;
  const rawStatus = s(formData, "status");
  const status: AttendanceStatus = (ATT_STATUSES as string[]).includes(rawStatus)
    ? (rawStatus as AttendanceStatus)
    : "maybe";
  const note = nullable(s(formData, "note"));

  await db.from("attendance").upsert(
    {
      event_id,
      player_id: session.player.id,
      guardian_id: null,
      status,
      note,
    },
    { onConflict: "event_id,player_id" }
  );

  revalidatePath("/parent");
  revalidatePath(`/event/${event_id}`);
  revalidatePath("/parent/schedule");
}

export async function claimSnack(formData: FormData) {
  const session = await getParentSession();
  if (!session) return;
  const db = createAdminClient();
  const event_id = s(formData, "event_id");
  if (!(await eventBelongs(db, event_id, session.team.id))) return;
  const snack_notes = nullable(s(formData, "snack_notes"));

  try {
    await db.from("snack_signups").insert({
      team_id: session.team.id,
      event_id,
      player_id: session.player.id,
      snack_notes,
    });
  } catch {
    // Unique conflict = already claimed by someone; ignore.
  }

  revalidatePath("/parent");
  revalidatePath("/parent/snacks");
  revalidatePath(`/event/${event_id}`);
}

export async function cancelSnack(formData: FormData) {
  const session = await getParentSession();
  if (!session) return;
  const db = createAdminClient();
  const event_id = s(formData, "event_id");
  if (!event_id) return;

  await db
    .from("snack_signups")
    .delete()
    .eq("event_id", event_id)
    .eq("player_id", session.player.id);

  revalidatePath("/parent");
  revalidatePath("/parent/snacks");
  revalidatePath(`/event/${event_id}`);
}

export async function updateOwnProfile(formData: FormData) {
  const session = await getParentSession();
  if (!session) return;
  const db = createAdminClient();

  await db
    .from("players")
    .update({
      allergies: nullable(s(formData, "allergies")),
      emergency_contact_name: nullable(s(formData, "emergency_contact_name")),
      emergency_contact_phone: nullable(s(formData, "emergency_contact_phone")),
      jersey_number: nullable(s(formData, "jersey_number")),
    })
    .eq("id", session.player.id);

  await db
    .from("guardians")
    .update({
      phone: nullable(s(formData, "phone")),
      email: nullable(s(formData, "email")),
      name: s(formData, "name"),
    })
    .eq("player_id", session.player.id)
    .eq("is_primary", true);

  revalidatePath("/parent/profile");
}

export async function addBlock(formData: FormData) {
  const session = await getParentSession();
  if (!session) return;
  const db = createAdminClient();
  const start_date = s(formData, "start_date");
  const end_date = s(formData, "end_date");
  if (!start_date || !end_date || start_date > end_date) return;

  await db.from("availability_blocks").insert({
    team_id: session.team.id,
    player_id: session.player.id,
    start_date,
    end_date,
    reason: nullable(cap(s(formData, "reason"), 160)),
  });

  revalidatePath("/parent/profile");
}

export async function removeBlock(formData: FormData) {
  const session = await getParentSession();
  if (!session) return;
  const db = createAdminClient();
  const id = s(formData, "id");
  if (!id) return;

  await db
    .from("availability_blocks")
    .delete()
    .eq("id", id)
    .eq("player_id", session.player.id);

  revalidatePath("/parent/profile");
}

export async function postCarpool(formData: FormData) {
  const session = await getParentSession();
  if (!session) return;
  const db = createAdminClient();
  const event_id = s(formData, "event_id");
  if (!(await eventBelongs(db, event_id, session.team.id))) return;
  const kind = s(formData, "kind") === "need" ? "need" : "offer";
  const seatsRaw = parseInt(s(formData, "seats"), 10);
  const seats = Number.isFinite(seatsRaw) ? seatsRaw : null;

  await db.from("carpool_posts").insert({
    team_id: session.team.id,
    event_id,
    player_id: session.player.id,
    kind,
    seats,
    note: nullable(cap(s(formData, "note"), 280)),
    contact: nullable(cap(s(formData, "contact"), 120)),
  });

  revalidatePath(`/event/${event_id}`);
}

export async function deleteCarpool(formData: FormData) {
  const session = await getParentSession();
  if (!session) return;
  const db = createAdminClient();
  const id = s(formData, "id");
  if (!id) return;

  await db
    .from("carpool_posts")
    .delete()
    .eq("id", id)
    .eq("player_id", session.player.id);

  const event_id = s(formData, "event_id");
  if (event_id) revalidatePath(`/event/${event_id}`);
}

export async function setVolunteer(formData: FormData) {
  const session = await getParentSession();
  if (!session) return;
  const db = createAdminClient();
  const event_id = s(formData, "event_id");
  if (!(await eventBelongs(db, event_id, session.team.id))) return;
  const role = s(formData, "role");
  if (!role) return;

  const { data: existing } = await db
    .from("volunteer_roles").select("id,player_id")
    .eq("event_id", event_id).eq("role", role).maybeSingle();
  const ex = existing as { id: string; player_id: string | null } | null;
  if (ex && ex.player_id && ex.player_id !== session.player.id) return; // already taken
  if (!ex) {
    await db.from("volunteer_roles").insert({
      team_id: session.team.id, event_id, role, player_id: session.player.id,
    });
  } else {
    await db.from("volunteer_roles").update({ player_id: session.player.id }).eq("id", ex.id);
  }

  revalidatePath(`/event/${event_id}`);
}

export async function clearVolunteer(formData: FormData) {
  const session = await getParentSession();
  if (!session) return;
  const db = createAdminClient();
  const id = s(formData, "id");
  if (!id) return;

  await db
    .from("volunteer_roles")
    .delete()
    .eq("id", id)
    .eq("player_id", session.player.id);

  const event_id = s(formData, "event_id");
  if (event_id) revalidatePath(`/event/${event_id}`);
}

export async function switchChild(formData: FormData) {
  const session = await getParentSession();
  if (!session) return;
  const token = s(formData, "token");
  if (!token) return;
  setActiveChild(token);
  revalidatePath("/parent");
}

// ---- Practice poll voting + message-coach (parent side) ----
export async function votePoll(formData: FormData) {
  const sess = await getParentSession();
  if (!sess) return;
  const option_id = s(formData, "option_id");
  const poll_id = s(formData, "poll_id");
  const response = s(formData, "response");
  if (!option_id || !poll_id || !["yes", "no", "maybe"].includes(response)) return;
  const db = createAdminClient();
  const { data: poll } = await db.from("polls").select("team_id,status").eq("id", poll_id).maybeSingle();
  if (!poll || (poll as { team_id: string }).team_id !== sess.team.id || (poll as { status: string }).status !== "open") return;
  await db.from("poll_votes").upsert(
    { team_id: sess.team.id, poll_id, option_id, player_id: sess.player.id, response },
    { onConflict: "option_id,player_id" }
  );
  revalidatePath("/parent/coach");
}

export async function sendCoachNote(formData: FormData) {
  const sess = await getParentSession();
  if (!sess) return;
  const body = s(formData, "body").slice(0, 3000);
  if (!body) return;
  const db = createAdminClient();
  await db.from("coach_inbox").insert({
    team_id: sess.team.id,
    player_id: sess.player.id,
    from_name: `${sess.player.first_name} ${sess.player.last_name}'s parent`,
    body,
  });
  revalidatePath("/parent/coach");
}
