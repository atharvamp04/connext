"use client";

export default function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 p-6 rounded-lg backdrop-blur-xl">
      <p className="text-white/60 text-sm">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
      {hint && <p className="text-white/40 text-xs mt-1">{hint}</p>}
    </div>
  );
}
