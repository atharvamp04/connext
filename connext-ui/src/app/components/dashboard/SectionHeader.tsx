"use client";

export default function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h2 className="text-3xl font-semibold">{title}</h2>
      {subtitle && <p className="text-white/50 mt-1">{subtitle}</p>}
    </div>
  );
}
