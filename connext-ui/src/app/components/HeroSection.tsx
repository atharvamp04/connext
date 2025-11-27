"use client";

import { motion } from "framer-motion";
import SectionGlow from "./SectionGlow";
import WaitlistModal from "./WaitlistModal";
import { useState } from "react";

export default function HeroSection() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Fixed Pulsing Background Shapes - Perfectly Centered */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.7, 0.8, 0.7] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-gradient-to-r from-purple-500/40 to-pink-500/40 blur-[80px] pointer-events-none"
          />

          <motion.div
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.6, 0.7, 0.6] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-gradient-to-r from-pink-500/30 to-purple-500/30 blur-[100px] pointer-events-none"
          />

      <div className="w-full min-h-screen bg-black text-white pt-60 flex flex-col items-center justify-center relative overflow-hidden">

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="relative text-center text-6xl font-bold tracking-wide max-w-4xl leading-tight px-6 text-white z-10"
        >
          {/* Animated Glow Circles Behind Text */}
          {/* Hero Glow — Matched to SectionGlow */}
<motion.div
  animate={{ scale: [1, 1.08, 1], opacity: [0.65, 0.8, 0.65] }}
  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
  className="
    absolute inset-0 -z-10
    w-[150%] h-[140%]
    mx-auto
    rounded-full
    bg-gradient-to-r from-purple-700/40 via-purple-500/35 to-pink-600/40
    blur-[110px]
  "
/>

{/* Hero Glow — Same as SectionGlow but animated */}
<motion.div
  animate={{ scale: [1, 1.08, 1], opacity: [0.65, 0.8, 0.65] }}
  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
  className="
    absolute left-1/2 top-1/2 
    -translate-x-1/2 -translate-y-1/2
    w-[1200px] h-[300px]
    rounded-full
    bg-gradient-to-r from-purple-700/40 via-purple-500/35 to-pink-600/40
    blur-[110px]
    opacity-70
    pointer-events-none
    -z-10
  "
/>


          Secure. Fast. Private. Remote Access Reinvented.
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mt-4 text-lg text-white/60 max-w-xl text-center z-10"
        >
          A single platform combining Mesh VPN, Remote Desktop, and File Transfer powered by pure P2P.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mt-8 flex gap-4 z-10"
        >
      <button
        onClick={() => setOpen(true)}
        className="px-8 py-3 bg-white text-black rounded-md text-lg"
      >
        Get Started →
      </button>
      <WaitlistModal open={open} onClose={() => setOpen(false)} />
        </motion.div>

        {/* Scroll Section Cards */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-7xl px-6 pb-32 z-10">

          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9 }}
            className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/20 backdrop-blur-2xl shadow-2xl p-10 rounded-2xl hover:shadow-3xl hover:scale-[1.03] hover:from-purple-500/20 hover:to-pink-500/20 transition-all"
          >
            <h3 className="text-3xl font-bold tracking-wide mb-4">Private 100.x Mesh Network</h3>
            <p className="text-white/60 leading-relaxed">
              Devices get stable private IPs inside an encrypted P2P mesh with zero configuration.
            </p>
            <ul className="mt-4 text-white/50 text-sm space-y-2">
              <li>• Zero port forwarding required</li>
              <li>• Automatic NAT traversal</li>
              <li>• Instant multi-device discovery</li>
              <li>• Encrypted WireGuard tunnels</li>
            </ul>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9 }}
            className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/20 backdrop-blur-2xl shadow-2xl p-10 rounded-2xl hover:shadow-3xl hover:scale-[1.03] hover:from-purple-500/20 hover:to-pink-500/20 transition-all"
          >
            <h3 className="text-3xl font-bold tracking-wide mb-4">Ultra-Fast Remote Desktop</h3>
            <p className="text-white/60 leading-relaxed">
              High FPS, low-latency remote control with hardware-accelerated streaming.
            </p>
            <ul className="mt-4 text-white/50 text-sm space-y-2">
              <li>• GPU-accelerated encoding</li>
              <li>• 60+ FPS smooth sessions</li>
              <li>• Multi-monitor support</li>
              <li>• Zero server relay unless needed</li>
            </ul>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9 }}
            className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/20 backdrop-blur-2xl shadow-2xl p-10 rounded-2xl hover:shadow-3xl hover:scale-[1.03] hover:from-purple-500/20 hover:to-pink-500/20 transition-all"
          >
            <h3 className="text-3xl font-bold tracking-wide mb-4">Instant File Transfer</h3>
            <p className="text-white/60 leading-relaxed">
              Secure, unlimited-size file sharing directly between devices — no cloud storage.
            </p>
            <ul className="mt-4 text-white/50 text-sm space-y-2">
              <li>• Unlimited file size</li>
              <li>• LAN-speed transfers</li>
              <li>• End-to-end encrypted</li>
              <li>• Direct device-to-device P2P</li>
            </ul>
          </motion.div>

        </div>
      </div>

{/* Features Section */}
<section id="features" className="w-full py-32 bg-black text-white flex flex-col items-center px-6">

  {/* FIXED Heading + Glow */}
  <div className="relative w-full flex justify-center mb-6">
    <div className="absolute top-1/2 -translate-y-1/2">
      <SectionGlow />
    </div>
    <h2 className="text-4xl font-bold text-center relative z-10">
      Packed With Powerful Features
    </h2>
  </div>

  <p className="text-white/60 max-w-2xl text-center mb-16 relative z-10">
    A complete toolkit to control, manage & secure all your devices remotely.
  </p>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl">

    {/* Feature 1 */}
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="bg-white/5 border border-white/10 p-8 rounded-xl backdrop-blur-xl"
    >
      <h3 className="text-xl font-semibold mb-3">Zero-Config Mesh VPN</h3>
      <p className="text-white/60">Private device-to-device networking with stable 100.x IPs.</p>
    </motion.div>

    {/* Feature 2 */}
    <motion.div whileHover={{ scale: 1.03 }} className="bg-white/5 border border-white/10 p-8 rounded-xl backdrop-blur-xl">
      <h3 className="text-xl font-semibold mb-3">Hardware Accelerated Streaming</h3>
      <p className="text-white/60">Experience ultra-smooth remote access with GPU encoding.</p>
    </motion.div>

    {/* Feature 3 */}
    <motion.div whileHover={{ scale: 1.03 }} className="bg-white/5 border border-white/10 p-8 rounded-xl backdrop-blur-xl">
      <h3 className="text-xl font-semibold mb-3">Instant File Transfer</h3>
      <p className="text-white/60">Unlimited file size and instant LAN-speed P2P transfers.</p>
    </motion.div>

    {/* Feature 4 */}
    <motion.div whileHover={{ scale: 1.03 }} className="bg-white/5 border border-white/10 p-8 rounded-xl backdrop-blur-xl">
      <h3 className="text-xl font-semibold mb-3">Military-Grade Encryption</h3>
      <p className="text-white/60">Secure all connections using pure WireGuard + AES-256.</p>
    </motion.div>

    {/* Feature 5 */}
    <motion.div whileHover={{ scale: 1.03 }} className="bg-white/5 border border-white/10 p-8 rounded-xl backdrop-blur-xl">
      <h3 className="text-xl font-semibold mb-3">Cross-Platform</h3>
      <p className="text-white/60">Windows, macOS, Linux, iOS, Android — all supported.</p>
    </motion.div>

    {/* Feature 6 */}
    <motion.div whileHover={{ scale: 1.03 }} className="bg-white/5 border border-white/10 p-8 rounded-xl backdrop-blur-xl">
      <h3 className="text-xl font-semibold mb-3">No Servers Needed</h3>
      <p className="text-white/60">Everything is pure peer-to-peer. No monthly fees.</p>
    </motion.div>

  </div>
</section>


<section id="usecases" className="w-full py-32 bg-black text-white px-6 flex flex-col items-center">

  <div className="relative w-full flex justify-center mb-10">
    <div className="absolute top-1/2 -translate-y-1/2">
      <SectionGlow />
    </div>
    <h2 className="text-4xl font-bold text-center relative z-10">
      Built For Every Scenario
    </h2>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl">

    <div className="p-8 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xl">
      <h3 className="text-xl font-semibold mb-3">IT Admins</h3>
      <p className="text-white/60">Manage distributed devices with secure mesh networking.</p>
    </div>

    <div className="p-8 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xl">
      <h3 className="text-xl font-semibold mb-3">Gamers</h3>
      <p className="text-white/60">Host servers, play via LAN, or stream gameplay remotely.</p>
    </div>

    <div className="p-8 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xl">
      <h3 className="text-xl font-semibold mb-3">Developers</h3>
      <p className="text-white/60">SSH into machines, deploy containers, and push code securely.</p>
    </div>

    <div className="p-8 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xl">
      <h3 className="text-xl font-semibold mb-3">Remote Workers</h3>
      <p className="text-white/60">Access office systems safely from anywhere.</p>
    </div>

    <div className="p-8 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xl">
      <h3 className="text-xl font-semibold mb-3">Teams</h3>
      <p className="text-white/60">Exchange files and collaborate through direct P2P links.</p>
    </div>

    <div className="p-8 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xl">
      <h3 className="text-xl font-semibold mb-3">Self-Hosting</h3>
      <p className="text-white/60">Expose services without port forwarding or static IPs.</p>
    </div>

  </div>
</section>

<section id="testimonials" className="w-full py-32 bg-black text-white px-6">

  <div className="relative w-full flex justify-center mb-10">
    <div className="absolute top-1/2 -translate-y-1/2">
      <SectionGlow />
    </div>
    <h2 className="text-4xl font-bold text-center relative z-10">
      Loved By Developers
    </h2>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">

    <div className="p-8 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl">
      <p className="text-white/70">“Fastest remote desktop I’ve ever used.”</p>
      <h4 className="mt-4 font-semibold text-white">— Alex, Cloud Architect</h4>
    </div>

    <div className="p-8 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl">
      <p className="text-white/70">“Replaced 3 tools with just one.”</p>
      <h4 className="mt-4 font-semibold text-white">— Priya, DevOps Engineer</h4>
    </div>

    <div className="p-8 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl">
      <p className="text-white/70">“Insanely easy and secure.”</p>
      <h4 className="mt-4 font-semibold text-white">— Michael, IT Admin</h4>
    </div>

  </div>
</section>



{/* Logos Section with Glow on Black */}
<div className="relative w-full py-32 flex flex-col items-center gap-12 overflow-hidden bg-black text-white">

{/* Balanced Light Glow – Wider Horizontally */}
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



  <h2 className="text-2xl font-semibold text-center opacity-90 z-10">
    Trusted by developers working with
  </h2>

  <div className="relative w-full overflow-hidden z-10">
    <div className="logos-scroll flex items-center gap-20 whitespace-nowrap opacity-80 hover:opacity-100 transition">

      {/* ROW 1 */}
      <div className="flex items-center gap-20">

        {/* AWS */}
        <img 
          src="https://cdn.simpleicons.org/amazonwebservices/ffffff"
          width="90"
          alt="AWS"
        />

        {/* GitHub */}
        <img 
          src="https://cdn.simpleicons.org/github/ffffff"
          width="70"
          alt="GitHub"
        />

        {/* Google Cloud */}
        <img 
          src="https://cdn.simpleicons.org/googlecloud/ffffff"
          width="90"
          alt="Google Cloud"
        />

        {/* Linux */}
        <img 
          src="https://cdn.simpleicons.org/linux/ffffff"
          width="70"
          alt="Linux"
        />

        {/* Docker */}
        <img 
          src="https://cdn.simpleicons.org/docker/ffffff"
          width="90"
          alt="Docker"
        />

        {/* DigitalOcean */}
        <img 
          src="https://cdn.simpleicons.org/digitalocean/ffffff"
          width="80"
          alt="DigitalOcean"
        />

      </div>

      {/* ROW 2 — Repeat for seamless animation */}
      <div className="flex items-center gap-20">
        <img src="https://cdn.simpleicons.org/amazonwebservices/ffffff" width="90" />
        <img src="https://cdn.simpleicons.org/github/ffffff" width="70" />
        <img src="https://cdn.simpleicons.org/googlecloud/ffffff" width="90" />
        <img src="https://cdn.simpleicons.org/linux/ffffff" width="70" />
        <img src="https://cdn.simpleicons.org/docker/ffffff" width="90" />
        <img src="https://cdn.simpleicons.org/digitalocean/ffffff" width="80" />
      </div>

    </div>
  </div>

  {/* Infinite Scroll Animation */}
  <style>{`
    .logos-scroll {
      animation: scroll-left 22s linear infinite;
    }
    @keyframes scroll-left {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
  `}</style>



</div>

{/* FAQ Section */}
<section id="faq" className="w-full py-32 bg-black text-white px-6">

  <h2 className="text-4xl font-bold mb-10 text-center">Frequently Asked Questions</h2>

  <div className="max-w-3xl mx-auto space-y-6">

    <div>
      <h3 className="text-xl font-semibold">Is it really peer-to-peer?</h3>
      <p className="text-white/60 mt-2">Yes — all connections use WireGuard tunnels directly between devices.</p>
    </div>

    <div>
      <h3 className="text-xl font-semibold">Do you store any data?</h3>
      <p className="text-white/60 mt-2">No servers, no logs, no session recordings.</p>
    </div>

    <div>
      <h3 className="text-xl font-semibold">What platforms are supported?</h3>
      <p className="text-white/60 mt-2">Windows, macOS, Linux, iOS, Android.</p>
    </div>

  </div>
</section>



    </>
    
  );
}
