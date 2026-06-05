const PALETTE = ["#2348e0","#0ea5e9","#8b5cf6","#ec4899","#f97316","#14b8a6","#ef4444","#eab308","#22c55e","#6366f1"];
function colorFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
function initialsOf(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}

export function PlayerAvatar({
  name, photoUrl, size = 44, className = "",
}: { name: string; photoUrl?: string | null; size?: number; className?: string }) {
  const c = colorFor(name);
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full font-bold text-white ${className}`}
      style={{
        width: size, height: size,
        background: photoUrl ? "#e2e8f0" : `linear-gradient(135deg, ${c}, ${c}cc)`,
        fontSize: size * 0.36,
      }}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}
