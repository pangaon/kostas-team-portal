export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 pt-6">
      <div className="skeleton h-7 w-40 rounded-lg" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  );
}
