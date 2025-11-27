"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

export default function GenerateKeyModal({ open, onClose }: any) {
  const [loading, setLoading] = useState(false);
  const [reusable, setReusable] = useState(true);
  const [key, setKey] = useState("");

  async function generateKey() {
    setLoading(true);
    try {
      const res = await api("/headscale/keys", "POST", { reusable });
      setKey(res.key);
    } catch {
      alert("Failed to generate key");
    }
    setLoading(false);
  }

  function closeAll() {
    setKey("");
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={closeAll} />

          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="relative z-10 w-full max-w-md bg-black/70 border border-white/10 rounded-xl p-6 backdrop-blur-xl"
          >
            <h3 className="text-2xl font-bold mb-4 text-white">Generate New Key</h3>

            {key ? (
              <>
                <p className="text-green-400 text-center font-mono text-lg mb-4">
                  {key}
                </p>
                <button
                  onClick={closeAll}
                  className="w-full bg-pink-600 hover:bg-pink-700 py-2 rounded-md"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <label className="flex items-center gap-2 mb-6">
                  <input
                    type="checkbox"
                    checked={reusable}
                    onChange={() => setReusable(!reusable)}
                  />
                  <span className="text-white/80">Reusable Key</span>
                </label>

                <button
                  onClick={generateKey}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-2 rounded-md font-semibold"
                >
                  {loading ? "Generating..." : "Generate Key"}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
