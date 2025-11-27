"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, AlertCircle, CheckCircle2 } from "lucide-react";

function SectionHeader({ title, subtitle }) {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      <p className="text-white/60">{subtitle}</p>
    </div>
  );
}

function Button({ children, className = "", disabled = false, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export default function DNSPage() {
  const [baseDomain, setBaseDomain] = useState("");
  const [nameservers, setNameservers] = useState("");
  const [magicDNSEnabled, setMagicDNSEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchDNSConfig();
  }, []);

  const fetchDNSConfig = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8081/api/dns/config", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBaseDomain(data.baseDomain || "");
        setNameservers(data.nameservers?.join(", ") || "");
        setMagicDNSEnabled(data.magicDNSEnabled || false);
      }
    } catch (error) {
      console.error("Failed to fetch DNS config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const nameserverArray = nameservers
        .split(",")
        .map(ns => ns.trim())
        .filter(ns => ns.length > 0);

      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8081/api/dns/config", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          baseDomain,
          nameservers: nameserverArray,
          magicDNSEnabled
        })
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: "DNS configuration saved successfully!"
        });
      } else {
        const error = await response.json();
        setMessage({
          type: "error",
          text: error.error || "Failed to save DNS configuration"
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Network error: Could not save configuration"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <SectionHeader
        title="DNS & MagicDNS"
        subtitle="Configure your mesh network domain settings."
      />

      {message.text && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
            <div>
              <h3 className="text-white font-medium">Enable MagicDNS</h3>
              <p className="text-sm text-white/60 mt-1">
                Allow nodes to resolve each other by hostname
              </p>
            </div>
            <button
              onClick={() => setMagicDNSEnabled(!magicDNSEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                magicDNSEnabled ? "bg-pink-600" : "bg-white/20"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  magicDNSEnabled ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-white/70 mb-2 font-medium">
              Base Domain
            </label>
            <input
              type="text"
              value={baseDomain}
              onChange={(e) => setBaseDomain(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all"
              placeholder="headscale.local"
            />
            <p className="text-sm text-white/50 mt-1">
              Domain suffix for MagicDNS (e.g., node.headscale.local)
            </p>
          </div>

          <div>
            <label className="block text-white/70 mb-2 font-medium">
              Nameservers
            </label>
            <input
              type="text"
              value={nameservers}
              onChange={(e) => setNameservers(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all"
              placeholder="1.1.1.1, 8.8.8.8"
            />
            <p className="text-sm text-white/50 mt-1">
              Comma-separated list of DNS servers for external lookups
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save DNS Configuration
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          About MagicDNS
        </h3>
        <p className="text-white/70 text-sm">
          MagicDNS allows your nodes to resolve each other using simple hostnames
          instead of IP addresses. When enabled, you can access nodes using their
          names (e.g., <code className="bg-white/10 px-1 rounded">server.headscale.local</code>)
          instead of remembering IP addresses.
        </p>
      </div>
    </div>
  );
}