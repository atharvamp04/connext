"use client";

import { useEffect, useState } from "react";
import SectionHeader from "@/app/components/dashboard/SectionHeader";
import { API_URL, authHeaders } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Copy, Check, Key, Loader2, Trash2, Info } from "lucide-react";

interface PreAuthKey {
  id: number;
  key: string;
  reusable: boolean;
  expiration: { seconds: number };
  created_at: { seconds: number };
  used: boolean;
}

interface Owner {
  name: string;
  email: string;
  is_owner: boolean;
  headscale_user: string;
}

export default function KeysPage() {
  const [keys, setKeys] = useState<PreAuthKey[]>([]);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  async function loadKeys() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/headscale/keys`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      // Filter out expired keys
      const activeKeys = (data.keys || []).filter((k: PreAuthKey) => !isExpired(k.expiration.seconds));
      setKeys(activeKeys);
      setOwner(data.owner || null);
    } catch {
      setKeys([]);
    }
    setLoading(false);
  }

  async function generateKey() {
    setGenerating(true);
    setNewKey(null);
    try {
      const res = await fetch(`${API_URL}/headscale/keys`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.key) {
        setNewKey(data.key);
        loadKeys();
      }
    } catch (err) {
      console.error("Failed to generate key", err);
    }
    setGenerating(false);
  }

  async function deleteKey(keyId: number) {
    if (!confirm("Are you sure you want to delete this key? This action cannot be undone.")) {
      return;
    }

    setDeletingId(keyId);
    try {
      const res = await fetch(`${API_URL}/headscale/keys/${keyId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      
      if (res.ok) {
        setKeys(keys.filter(k => k.id !== keyId));
      } else {
        const error = await res.json();
        alert(`Failed to delete key: ${error.detail || error.error}`);
      }
    } catch (err) {
      console.error("Failed to delete key:", err);
      alert("Failed to delete key. Please try again.");
    }
    setDeletingId(null);
  }

  async function copyToClipboard(key: string, id: number) {
    await navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function formatDate(seconds: number) {
    return new Date(seconds * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function isExpired(seconds: number) {
    return Date.now() > seconds * 1000;
  }

  useEffect(() => {
    loadKeys();
  }, []);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Pre-Auth Keys"
        subtitle="Generate reusable access keys to connect new devices to your network."
        center={false}
      />

      {/* Network Owner Info Banner */}
      {owner && !owner.is_owner && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-blue-400 font-medium mb-1">Shared Network Access</h3>
            <p className="text-white/70 text-sm">
              You're managing keys for <strong className="text-white">{owner.name}'s</strong> network ({owner.email}).
              Keys you create will allow devices to join the <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono">{owner.headscale_user}</code> namespace.
            </p>
          </div>
        </div>
      )}

      {/* Generate Key Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Generate New Key</h3>
            <p className="text-white/60 text-sm">
              Keys expire after 24 hours and can be reused.
              {owner && !owner.is_owner && ` Devices will join ${owner.name}'s network.`}
            </p>
          </div>
          <Button
            className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50"
            onClick={generateKey}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                Generate Key
              </>
            )}
          </Button>
        </div>

        {/* Newly Generated Key Display */}
        {newKey && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-green-400 text-sm font-medium mb-2">✓ New key generated!</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-black/30 px-3 py-2 rounded text-white font-mono text-sm break-all">
                {newKey}
              </code>
              <Button
                size="sm"
                variant="ghost"
                className="text-green-400 hover:text-green-300"
                onClick={() => copyToClipboard(newKey, -1)}
              >
                {copiedId === -1 ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-white/50 text-xs mt-2">
              Use this key with: <code className="text-white/70">tailscale up --login-server YOUR_SERVER --authkey {newKey.slice(0, 12)}...</code>
            </p>
          </div>
        )}
      </div>

      {/* Keys List */}
      <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">Your Keys</h3>
            {owner && owner.is_owner && (
              <span className="text-xs bg-pink-500/20 text-pink-300 px-2 py-1 rounded font-medium">
                Network Owner
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-white/60 mx-auto" />
            <p className="text-white/60 mt-2">Loading keys...</p>
          </div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center">
            <Key className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">No keys found.</p>
            <p className="text-white/40 text-sm">
              {owner && !owner.is_owner 
                ? `Generate a key to add your devices to ${owner.name}'s network.`
                : "Generate a key to connect your first device."
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-white/70 text-sm bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium">Key</th>
                  <th className="px-4 py-3 font-medium">Reusable</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="text-white/80">
                {keys.map((k) => {
                  const expired = isExpired(k.expiration.seconds);
                  return (
                    <tr key={k.id} className="border-t border-white/10 hover:bg-white/5">
                      <td className="px-4 py-3 font-mono text-sm">
                        {k.key.slice(0, 12)}...
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${k.reusable ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-400"}`}>
                          {k.reusable ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">
                        {formatDate(k.created_at.seconds)}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">
                        {formatDate(k.expiration.seconds)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${expired ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                          {expired ? "Expired" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white/60 hover:text-white"
                            onClick={() => copyToClipboard(k.key, k.id)}
                            disabled={deletingId === k.id}
                          >
                            {copiedId === k.id ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => deleteKey(k.id)}
                            disabled={deletingId === k.id}
                          >
                            {deletingId === k.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}