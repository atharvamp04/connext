"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/api";

export default function WaitlistModal({ open, onClose }: any) {
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"register" | "login">("register");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submitForm(e: any) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.target);
    const body = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
    };

    const endpoint = tab === "register" ? "/auth/register" : "/auth/login";

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      // Save token then redirect
      if (json.token) localStorage.setItem("token", json.token);

      setSuccess(true);

      setTimeout(() => {
        onClose();
        window.location.href = "/dashboard";
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    }

    setLoading(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 w-full max-w-lg bg-black/60 border border-white/10 backdrop-blur-xl rounded-2xl p-10 shadow-2xl"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">✕</button>

            <h2 className="text-3xl font-bold text-center mb-3">
              {tab === "register" ? "Join the Waitlist" : "Welcome Back"}
            </h2>

            {/* Tab Switch */}
            <div className="flex justify-center gap-6 text-white/60 mb-6">
              <button onClick={() => setTab("register")} className={tab === "register" ? "text-pink-400" : ""}>Register</button>
              <button onClick={() => setTab("login")} className={tab === "login" ? "text-purple-400" : ""}>Login</button>
            </div>

            {/* FORM */}
            <form onSubmit={submitForm} className="flex flex-col gap-6">

              {tab === "register" && (
                <input name="name" required placeholder="Your Name" className="bg-white/10 border border-white/20 px-4 py-3 rounded-md text-white placeholder-white/40 focus:ring-2 focus:ring-pink-500 outline-none" />
              )}

              <input name="email" type="email" required placeholder="Email" className="bg-white/10 border border-white/20 px-4 py-3 rounded-md text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 outline-none" />

              <input name="password" type="password" required placeholder="Password" className="bg-white/10 border border-white/20 px-4 py-3 rounded-md text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 outline-none" />

              <button disabled={loading} className="py-3 rounded-md text-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition text-white shadow-xl">
                {loading ? "Please wait..." : tab === "register" ? "Join Waitlist →" : "Login →"}
              </button>
            </form>

            {success && <p className="text-green-400 mt-4 text-center">🎉 Success!</p>}
            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
