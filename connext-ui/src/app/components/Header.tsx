"use client";

import { useState } from "react";
import useActiveSection from "@/hooks/useActiveSection";
import WaitlistModal from "./WaitlistModal";

export default function Header() {
  const sections = ["features", "usecases", "testimonials", "faq"];
  const active = useActiveSection(sections);

  const [open, setOpen] = useState(false);

  return (
    <>
      {/* HEADER */}
      <header className="
        w-full fixed top-0 left-0 h-20 
        bg-black/30 backdrop-blur-xl 
        border-b border-white/10
        flex items-center justify-between 
        px-10 z-50
      ">

        {/* LOGO */}
        <div className="text-white text-2xl font-bold tracking-wide">
          Connext
        </div>

        {/* NAVIGATION */}
        <nav className="hidden md:flex gap-10 text-white text-lg font-medium">

          {sections.map((id) => (
            <button
              key={id}
              onClick={() =>
                document
                  .getElementById(id)
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className={`
                pb-1 transition-all capitalize
                ${
                  active === id
                    ? "text-pink-400 border-b-2 border-pink-500"
                    : "text-white/60 hover:text-white"
                }
              `}
            >
              {id}
            </button>
          ))}

        </nav>

        {/* JOIN WAITLIST BUTTON */}
        <button
          onClick={() => setOpen(true)}
          className="
            px-5 py-2 rounded-md text-black font-medium 
            bg-gradient-to-r from-purple-400 to-pink-400 
            hover:opacity-90 transition shadow-lg
          "
        >
          Join Waitlist
        </button>
      </header>

      {/* POPUP MODAL */}
      <WaitlistModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
