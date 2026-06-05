// Central sport registry — drives terminology, periods, roster size, positions
// and formations across the app so nothing is soccer-hardcoded.

export type PeriodType = "Half" | "Quarter" | "Period" | "Inning" | "Set";

export type SportConfig = {
  id: string;
  label: string;
  emoji: string;
  noun: "game" | "match";
  scoreTerm: string;     // what a score is called
  scoreEmoji: string;
  onField: number;       // players on the field/court at once
  periodType: PeriodType;
  periodCount: number;
  defaultPeriodMin: number; // minutes per period (timed sports)
  timed: boolean;        // false = innings/sets advance manually
  positions: string[];
  hasPitch: boolean;     // spatial tactics board available
};

export const SPORTS: Record<string, SportConfig> = {
  soccer8: { id: "soccer8", label: "Soccer (8v8)", emoji: "⚽", noun: "game", scoreTerm: "Goal", scoreEmoji: "⚽", onField: 8, periodType: "Half", periodCount: 2, defaultPeriodMin: 25, timed: true, positions: ["GK", "DEF", "MID", "FWD"], hasPitch: true },
  soccer11: { id: "soccer11", label: "Soccer (11v11)", emoji: "⚽", noun: "match", scoreTerm: "Goal", scoreEmoji: "⚽", onField: 11, periodType: "Half", periodCount: 2, defaultPeriodMin: 45, timed: true, positions: ["GK", "DEF", "MID", "FWD"], hasPitch: true },
  basketball: { id: "basketball", label: "Basketball", emoji: "🏀", noun: "game", scoreTerm: "Basket", scoreEmoji: "🏀", onField: 5, periodType: "Quarter", periodCount: 4, defaultPeriodMin: 10, timed: true, positions: ["PG", "SG", "SF", "PF", "C"], hasPitch: true },
  hockey: { id: "hockey", label: "Hockey", emoji: "🏒", noun: "game", scoreTerm: "Goal", scoreEmoji: "🥅", onField: 6, periodType: "Period", periodCount: 3, defaultPeriodMin: 20, timed: true, positions: ["G", "D", "LW", "C", "RW"], hasPitch: true },
  baseball: { id: "baseball", label: "Baseball / Softball", emoji: "⚾", noun: "game", scoreTerm: "Run", scoreEmoji: "⚾", onField: 9, periodType: "Inning", periodCount: 7, defaultPeriodMin: 0, timed: false, positions: ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"], hasPitch: false },
  volleyball: { id: "volleyball", label: "Volleyball", emoji: "🏐", noun: "match", scoreTerm: "Point", scoreEmoji: "🏐", onField: 6, periodType: "Set", periodCount: 5, defaultPeriodMin: 0, timed: false, positions: ["S", "OH", "MB", "OPP", "L"], hasPitch: false },
};

export const SPORT_OPTIONS = Object.values(SPORTS).map((s) => ({ value: s.label, label: `${s.emoji} ${s.label}`, id: s.id }));

// Map a team's stored sport string to a config (heuristic, no DB change needed).
export function sportFromString(sport?: string | null): SportConfig {
  const t = (sport ?? "").toLowerCase();
  if (t.includes("11")) return SPORTS.soccer11;
  if (t.includes("basket")) return SPORTS.basketball;
  if (t.includes("hock")) return SPORTS.hockey;
  if (t.includes("base") || t.includes("soft")) return SPORTS.baseball;
  if (t.includes("volley")) return SPORTS.volleyball;
  return SPORTS.soccer8;
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
