import type { Team, TeamEvent } from "@/lib/types";
import { fmtDate, fmtTime } from "@/lib/format";

type Ctx = { team: Team; origin: string; nextEvent?: TeamEvent | null };
export type Template = { id: string; label: string; build: (ctx: Ctx) => string };

export function inviteLink(origin: string, code: string) {
  return `${origin}/join/${code}`;
}

export const templates: Template[] = [
  {
    id: "welcome",
    label: "A · Welcome / Group Setup",
    build: ({ team, origin }) =>
`Hi everyone, welcome to the ${team.name} ${team.age_group ?? ""} ${team.sport ?? "soccer"} team for the ${team.season ?? ""} season!

Please use this team portal link to register your player and parent contact info:
${inviteLink(origin, team.invite_code)}

Once you join the WhatsApp group, please set your display name as:
Parent Name - Player Name - Jersey #
Example: George - Adoni - #16

This helps everyone know which parent belongs to which player.`,
  },
  {
    id: "registration",
    label: "B · Registration Reminder",
    build: ({ team, origin }) =>
`Reminder: please complete the team registration form here:
${inviteLink(origin, team.invite_code)}

This helps me organize the roster, parent contacts, allergies, attendance, and the snack schedule.`,
  },
  {
    id: "snack",
    label: "C · Snack Signup",
    build: ({ team, origin }) =>
`Snack signup is now open. 🍎
Please choose one available game/date here:
${origin}/join/${team.invite_code}

Please keep allergies in mind and avoid anything unsafe for the team (we keep it nut-free).`,
  },
  {
    id: "game",
    label: "D · Game Reminder",
    build: ({ team, origin, nextEvent }) => {
      const e = nextEvent;
      return `Game reminder for ${team.name}:
Date: ${e ? fmtDate(e.start_time) : "[date]"}
Time: ${e ? fmtTime(e.start_time) : "[time]"}
Arrival: ${e?.arrival_time ? fmtTime(e.arrival_time) : "15 min early"}
Location: ${e?.location ?? "[location]"}
Opponent: ${e?.opponent ?? "[opponent]"}

Please mark attendance here:
${origin}/event/${e?.id ?? "[eventId]"}`;
    },
  },
  {
    id: "rainout",
    label: "E · Rainout / Cancellation",
    build: ({ team }) =>
`${team.name}: today's event is cancelled/postponed due to weather/field conditions.

I'll update everyone once we have a new time or date. Thanks!`,
  },
  {
    id: "attendance",
    label: "F · Attendance Reminder",
    build: ({ origin, nextEvent }) =>
`Please mark whether your player is attending the next game/practice:
${origin}/event/${nextEvent?.id ?? "[eventId]"}

This helps with planning lines, substitutions, and snacks.`,
  },
];
