export type PlayerStatus = "pending" | "approved" | "rejected";
export type EventType = "game" | "practice" | "event" | "tournament" | "other";
export type EventStatus = "scheduled" | "cancelled" | "postponed";
export type AttendanceStatus = "attending" | "not_attending" | "maybe";

export type Team = {
  id: string; name: string; sport: string | null; season: string | null;
  age_group: string | null; invite_code: string; created_by: string | null; created_at: string;
};
export type Player = {
  id: string; team_id: string; first_name: string; last_name: string;
  jersey_number: string | null; allergies: string | null; medical_notes: string | null;
  emergency_contact_name: string | null; emergency_contact_phone: string | null;
  preferred_position: string | null; strong_foot: string | null; coach_notes: string | null;
  status: PlayerStatus; access_token: string; created_at: string;
};
export type Guardian = {
  id: string; player_id: string; team_id: string | null; name: string; phone: string | null;
  email: string | null; relationship: string | null; is_primary: boolean; created_at: string;
};
export type TeamEvent = {
  id: string; team_id: string; type: EventType; title: string | null; opponent: string | null;
  location: string | null; field_number: string | null; start_time: string; end_time: string | null;
  arrival_time: string | null; notes: string | null; status: EventStatus; created_at: string;
};
export type Attendance = {
  id: string; event_id: string; player_id: string; guardian_id: string | null;
  status: AttendanceStatus; note: string | null; updated_at: string;
};
export type SnackSignup = {
  id: string; team_id: string | null; event_id: string; player_id: string | null;
  guardian_id: string | null; snack_notes: string | null; created_at: string;
};
export type Announcement = {
  id: string; team_id: string; title: string; body: string; event_id: string | null;
  created_by: string | null; created_at: string;
};
export type MessageTemplate = {
  id: string; team_id: string; type: string; title: string; body: string; created_at: string;
};
export type Notification = {
  id: string; team_id: string; kind: string; title: string; body: string | null;
  event_id: string | null; created_at: string;
};

// Player with its guardians attached (used in roster + parent views)
export type PlayerWithGuardians = Player & { guardians: Guardian[] };

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  game: "Game", practice: "Practice", event: "Team Event",
  tournament: "Tournament", other: "Other",
};
export const ATT_LABEL: Record<AttendanceStatus, string> = {
  attending: "Attending", not_attending: "Not attending", maybe: "Maybe",
};

export type RosterStatus = "starter" | "bench" | "out";
export type Lineup = {
  id: string; team_id: string; event_id: string; formation: string | null;
  notes: string | null; updated_at: string;
};
export type GameRosterRow = {
  id: string; team_id: string; event_id: string; player_id: string;
  status: RosterStatus; position: string | null; checked_in: boolean; sort: number; updated_at: string;
};
export type VolunteerRole = {
  id: string; team_id: string; event_id: string; role: string;
  player_id: string | null; guardian_id: string | null; notes: string | null; created_at: string;
};
export const FORMATIONS = ["1-2-3-1", "2-3-1", "3-2-1", "2-2-2", "3-3", "2-1-2 (5v5)", "Custom"];
export const DEFAULT_VOLUNTEER_ROLES = ["Team Parent", "Field Setup", "Scorekeeper", "Half-time Oranges", "Pack-up Crew"];

export type AvailabilityBlock = {
  id: string; team_id: string; player_id: string; start_date: string;
  end_date: string; reason: string | null; created_at: string;
};
export type CarpoolPost = {
  id: string; team_id: string; event_id: string; player_id: string | null;
  kind: "offer" | "need"; seats: number | null; note: string | null;
  contact: string | null; created_at: string;
};
