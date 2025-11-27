"use client";

export default function Footer() {
  return (
    <footer className="relative w-full bg-black text-white py-24 px-6 overflow-hidden">


      {/* Bottom Section */}
      <div className="relative z-10 max-w-7xl mx-auto mt-8 flex flex-col md:flex-row justify-between items-center gap-6">

        <p className="text-white/50 text-sm">
          © {new Date().getFullYear()} Connext — All rights reserved.
        </p>

        {/* Social Icons */}
        <div className="flex items-center gap-6 opacity-80 hover:opacity-100 transition">
          <a href="#">
            <img
              src="https://cdn.simpleicons.org/github/ffffff"
              width="24"
              alt="GitHub"
              className="hover:scale-110 transition"
            />
          </a>
          <a href="#">
            <img
              src="https://cdn.simpleicons.org/linkedin/ffffff"
              width="24"
              alt="LinkedIn"
              className="hover:scale-110 transition"
            />
          </a>
        </div>
      </div>

    </footer>
  );
}
