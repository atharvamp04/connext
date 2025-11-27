"use client";

import useModal from "@/hooks/useModal";
import WaitlistModal from "./WaitlistModal";

export default function Topbar() {
  const waitlist = useModal();

  return (
    <>
      <header className="w-full h-16 border-b border-white/10 bg-black/60 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 md:static md:z-auto">
        <div className="md:hidden text-lg font-semibold">
          connext<span className="text-pink-400">.mesh</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-sm text-white/60">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Headscale node online</span>
        </div>

        <button
          onClick={waitlist.open}
          className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-gray-100 transition"
        >
          Join Waitlist
        </button>
      </header>

      <WaitlistModal isOpen={waitlist.isOpen} onClose={waitlist.close} />
    </>
  );
}
