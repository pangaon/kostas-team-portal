import { z } from "zod";

const phone = z.string().trim().max(40).optional().or(z.literal(""));
const email = z.string().trim().email("Enter a valid email").max(120).optional().or(z.literal(""));

export const joinSchema = z.object({
  player_first_name: z.string().trim().min(1, "Player first name is required").max(60),
  player_last_name: z.string().trim().min(1, "Player last name is required").max(60),
  jersey_number: z.string().trim().max(10).optional(),
  allergies: z.string().trim().max(500).optional(),
  medical_notes: z.string().trim().max(500).optional(),
  emergency_contact_name: z.string().trim().max(120).optional(),
  emergency_contact_phone: phone,
  g1_name: z.string().trim().min(1, "Guardian 1 name is required").max(80),
  g1_phone: phone,
  g1_email: email,
  g2_name: z.string().trim().max(80).optional(),
  g2_phone: phone,
  g2_email: email,
  consent_comms: z.literal("on", { errorMap: () => ({ message: "Please agree to team communication" }) }),
  consent_accurate: z.literal("on", { errorMap: () => ({ message: "Please confirm the info is accurate" }) }),
});

export const eventSchema = z.object({
  type: z.enum(["game", "practice", "event", "tournament", "other"]),
  title: z.string().trim().max(120).optional(),
  opponent: z.string().trim().max(120).optional(),
  location: z.string().trim().max(160).optional(),
  field_number: z.string().trim().max(40).optional(),
  date: z.string().min(1, "Date is required"),
  start: z.string().min(1, "Start time is required"),
  end: z.string().optional(),
  arrival: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
  status: z.enum(["scheduled", "cancelled", "postponed"]).optional(),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  body: z.string().trim().min(1, "Message is required").max(3000),
  event_id: z.string().optional(),
});
