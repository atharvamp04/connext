"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

export default function CreateUserModal({ open, onClose, onCreated }: any) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createUser(e: any) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.target);
    const body = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
    };

    try {
      const res = await api.post("/auth/register", body);
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      setError("⚠️ Failed to create user");
    }

    setLoading(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="relative z-20 bg-black/60 border border-white/10 rounded-2xl p-8 w-full max-w-md backdrop-blur-xl shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6 text-white">Create User</h2>

            <form className="flex flex-col gap-5" onSubmit={createUser}>
              <input
                name="name"
                placeholder="Full name"
                required
                className="bg-white/10 border border-white/20 px-4 py-3 rounded-md text-white placeholder-white/40"
              />

              <input
                name="email"
                type="email"
                placeholder="email@example.com"
                required
                className="bg-white/10 border border-white/20 px-4 py-3 rounded-md text-white placeholder-white/40"
              />

              <input
                name="password"
                type="password"
                placeholder="Password"
                required
                className="bg-white/10 border border-white/20 px-4 py-3 rounded-md text-white placeholder-white/40"
              />

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                disabled={loading}
                className="py-3 rounded-md bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition"
              >
                {loading ? "Creating..." : "Create User"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
