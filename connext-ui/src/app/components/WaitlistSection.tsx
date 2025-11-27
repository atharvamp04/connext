"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SectionGlow from "./SectionGlow";

export default function WaitlistSection() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function joinWaitlist(e: any) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const form = new FormData(e.target);
    const data = {
      name: form.get("name"),
      email: form.get("email"),
      password: "123456", // temporary auto password for waitlist users
      useCase: form.get("useCase"),
    };

    try {
      /** 1) Register User */
      const register = await fetch("http://localhost:8081/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!register.ok) throw new Error("Registration failed");

      /** 2) Auto Login */
      const login = await fetch("http://localhost:8081/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      if (!login.ok) throw new Error("Login failed");

      const result = await login.json();
      localStorage.setItem("token", result.token);

      setSuccess(true);
      window.location.href = "/dashboard";

    } catch (err: any) {
      setError("Something went wrong. Try again.");
    }

    setLoading(false);
  }

  return (
    <section className="w-full py-32 bg-black text-white flex flex-col items-center px-6 relative">

      {/* Glow behind heading */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2">
        <SectionGlow />
      </div>

      <h2 className="text-4xl font-bold mb-4 relative z-10">
        Join the Waitlist
      </h2>

      <p className="text-white/70 mb-12 max-w-xl text-center relative z-10">
        Get early access, priority onboarding and exclusive beta features.
      </p>

      <motion.form
        onSubmit={joinWaitlist}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/5 border border-white/10 backdrop-blur-xl p-10 rounded-2xl w-full max-w-xl flex flex-col gap-6 shadow-xl relative z-10"
      >
        {/* NAME */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Your Name</label>
          <input
            type="text"
            name="name"
            required
            className="bg-white/10 border border-white/20 px-4 py-3 rounded-md text-white placeholder-white/40 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="Atharva"
          />
        </div>

        {/* EMAIL */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Email</label>
          <input
            type="email"
            name="email"
            required
            className="bg-white/10 border border-white/20 px-4 py-3 rounded-md text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 outline-none"
            placeholder="you@example.com"
          />
        </div>

        {/* USE CASE */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">How will you use Connext?</label>
          <select
            name="useCase"
            className="bg-white/10 border border-white/20 px-4 py-3 rounded-md text-white focus:ring-2 focus:ring-purple-600 outline-none"
          >
            <option className="bg-black">Remote Desktop</option>
            <option className="bg-black">File Transfer</option>
            <option className="bg-black">Gaming / LAN</option>
            <option className="bg-black">SSH & DevOps</option>
            <option className="bg-black">General VPN</option>
          </select>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          disabled={loading}
          className="
            mt-4 py-3 rounded-md text-lg font-semibold
            bg-gradient-to-r from-purple-500 to-pink-600
            hover:opacity-90 transition
            text-white shadow-lg
          "
        >
          {loading ? "Joining..." : "Join Waitlist →"}
        </button>

        {/* USER FEEDBACK */}
        {success && (
          <p className="text-green-400 mt-3 text-sm">
            🎉 You’re in! Redirecting…
          </p>
        )}

        {error && (
          <p className="text-red-400 mt-3 text-sm">{error}</p>
        )}
      </motion.form>
    </section>
  );
}
