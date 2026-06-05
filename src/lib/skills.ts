// Categorized player skills / development tags. Grouped so coaches can scan fast.
export const SKILL_GROUPS: { group: string; emoji: string; options: string[] }[] = [
  { group: "Technical", emoji: "🎯", options: ["Great first touch", "Strong passer", "Good finisher", "Dribbles well", "Good crosser", "Composed on the ball"] },
  { group: "Physical", emoji: "⚡", options: ["Fast", "Good stamina", "Strong / physical", "Agile", "Good in the air", "Quick off the mark"] },
  { group: "Mindset", emoji: "🧠", options: ["Vocal leader", "Coachable", "High work rate", "Stays calm", "Competitive", "Great teammate", "Confident"] },
  { group: "Defending", emoji: "🛡️", options: ["Tracks back", "Good tackler", "Reads the game", "Marks tightly"] },
  { group: "Set pieces", emoji: "🚩", options: ["Takes corners", "Takes free kicks", "Takes penalties", "Long throw-in"] },
  { group: "Best position", emoji: "📍", options: ["Likes goal", "Likes defence", "Likes midfield", "Likes attack", "Versatile"] },
  { group: "Working on", emoji: "🌱", options: ["Positioning", "Confidence", "Fitness", "Focus", "Using weak foot", "Staying composed", "Listening"] },
];
export const SKILL_OPTIONS = SKILL_GROUPS.flatMap((g) => g.options);
export const WORKING_ON = new Set(SKILL_GROUPS.find((g) => g.group === "Working on")?.options ?? []);
