"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoachTeam } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EventType, EventStatus } from "@/lib/types";

function s(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}
function nullable(v: string): string | null {
  return v === "" ? null : v;
}
function toIso(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

const EVENT_TYPES: EventType[] = ["game", "practice", "event", "tournament", "other"];

export async function upsertEvent(formData: FormData) {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  const id = s(formData, "id");

  const rawType = s(formData, "type");
  const type: EventType = (EVENT_TYPES as string[]).includes(rawType) ? (rawType as EventType) : "other";
  const startIso = toIso(s(formData, "start"));
  if (!startIso) {
    redirect("/team/schedule?saved=1");
  }

  const fields = {
    type,
    title: nullable(s(formData, "title")),
    opponent: nullable(s(formData, "opponent")),
    location: nullable(s(formData, "location")),
    field_number: nullable(s(formData, "field_number")),
    start_time: startIso,
    end_time: toIso(s(formData, "end")),
    arrival_time: toIso(s(formData, "arrival")),
    notes: nullable(s(formData, "notes")),
  };

  if (id) {
    await db.from("events").update(fields).eq("id", id).eq("team_id", team.id);
    revalidatePath("/team/schedule");
    redirect("/team/schedule?saved=" + encodeURIComponent("Event saved"));
  }

  const repeat = s(formData, "repeat") === "1";
  const weeks = repeat ? Math.max(1, Math.min(30, parseInt(s(formData, "repeat_weeks"), 10) || 1)) : 1;
  const startBase = new Date(startIso);
  const endBase = fields.end_time ? new Date(fields.end_time) : null;
  const arrBase = fields.arrival_time ? new Date(fields.arrival_time) : null;
  const rows = Array.from({ length: weeks }, (_, w) => {
    const shift = w * 7 * 24 * 3600 * 1000;
    return {
      ...fields,
      start_time: new Date(startBase.getTime() + shift).toISOString(),
      end_time: endBase ? new Date(endBase.getTime() + shift).toISOString() : null,
      arrival_time: arrBase ? new Date(arrBase.getTime() + shift).toISOString() : null,
      status: "scheduled" as const,
      team_id: team.id,
    };
  });
  await db.from("events").insert(rows);

  revalidatePath("/team/schedule");
  redirect("/team/schedule?saved=" + encodeURIComponent(weeks > 1 ? `Added ${weeks} events` : "Event added"));
}

export async function deleteEvent(formData: FormData) {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  const id = s(formData, "id");
  if (!id) return;
  await db.from("events").delete().eq("id", id).eq("team_id", team.id);
  revalidatePath("/team/schedule");
  redirect("/team/schedule?saved=1");
}

export async function setEventStatus(formData: FormData) {
  const { team } = await requireCoachTeam();
  const db = createAdminClient();
  const id = s(formData, "id");
  const rawStatus = s(formData, "status");
  const status: EventStatus =
    rawStatus === "cancelled" || rawStatus === "postponed" ? rawStatus : "scheduled";
  if (!id) return;
  await db.from("events").update({ status }).eq("id", id).eq("team_id", team.id);
  revalidatePath("/team/schedule");
  redirect("/team/schedule?saved=1");
}
