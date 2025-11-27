"use client";

export default function SectionGlow() {
  return (
    <div
      className="
        absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
        w-[1200px] h-[300px]
        rounded-full
        bg-gradient-to-r from-purple-700/40 via-purple-500/35 to-pink-600/40
        blur-[110px]
        opacity-70
        pointer-events-none
      "
    ></div>
  );
}
