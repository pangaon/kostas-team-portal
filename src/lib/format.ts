const TZ = "America/Toronto";

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", timeZone: TZ,
  });
}
export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", timeZone: TZ,
  });
}
export function fmtDateTime(iso: string): string {
  return `${fmtDate(iso)} · ${fmtTime(iso)}`;
}
export function isUpcoming(iso: string): boolean {
  return new Date(iso).getTime() >= Date.now() - 3 * 60 * 60 * 1000;
}

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}
export function randomCode(len = 5): string {
  const a = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: len }, () => a[Math.floor(Math.random() * a.length)]).join("");
}
export function parentLabel(p: { first_name: string; jersey_number: string | null }, guardian?: { name: string }): string {
  const j = p.jersey_number ? ` · #${p.jersey_number}` : "";
  return guardian ? `${guardian.name.split(" ")[0]} — ${p.first_name}${j}` : `${p.first_name}${j}`;
}
