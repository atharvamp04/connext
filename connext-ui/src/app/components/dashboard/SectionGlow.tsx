"use client";

import { motion } from "framer-motion";

export default function SectionGlow() {
  return (
    <motion.div
      initial={{ opacity: 0.5, scale: 0.9 }}
      animate={{ opacity: [0.5, 0.8, 0.5], scale: [0.9, 1.05, 0.9] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="
        absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
        w-[1200px] h-[280px]
        rounded-full
        bg-gradient-to-r from-purple-700/40 via-purple-500/35 to-pink-600/40
        blur-[110px]
        opacity-70
        pointer-events-none
      "
    />
  );
}
