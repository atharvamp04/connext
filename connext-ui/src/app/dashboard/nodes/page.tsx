"use client";

import { useEffect, useState } from "react";
import { API_URL, authHeaders } from "@/lib/api";

interface Node {
  id: number;
  name: string;
  given_name?: string;
  ip_addresses: string[];
  online: boolean;
  last_seen?: { seconds: number };
  user?: { name: string };
}

interface Owner {
  name: string;
  email: string;
  is_owner: boolean;
  headscale_user: string;
}

const Monitor = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

const Info = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const Wifi = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
  </svg>
);

const WifiOff = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
  </svg>
);

const Copy = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const Check = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const Trash2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div>
    <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
    <p className="text-white/60">{subtitle}</p>
  </div>
);

export default function NodesPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadNodes(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`${API_URL}/headscale/nodes`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setNodes(data.nodes || []);
      setOwner(data.owner || null);
    } catch (error) {
      console.error("Failed to load nodes:", error);
      setNodes([]);
    }

    setLoading(false);
    setRefreshing(false);
  }

  async function deleteNode(nodeId: number, nodeName: string) {
    if (!confirm(`Are you sure you want to delete node "${nodeName}"? This action cannot be undone and will disconnect the device.`)) {
      return;
    }

    setDeletingId(nodeId);
    try {
      const res = await fetch(`${API_URL}/headscale/nodes/${nodeId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      
      if (res.ok) {
        setNodes(nodes.filter(n => n.id !== nodeId));
      } else {
        const error = await res.json();
        alert(`Failed to delete node: ${error.detail || error.error}`);
      }
    } catch (err) {
      console.error("Failed to delete node:", err);
      alert("Failed to delete node. Please try again.");
    }
    setDeletingId(null);
  }

  async function copyIP(ip: string, nodeId: number) {
    await navigator.clipboard.writeText(ip);
    setCopiedId(`${nodeId}-${ip}`);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function formatLastSeen(seconds?: number) {
    if (!seconds) return "Never";
    const date = new Date(seconds * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }

  useEffect(() => {
    loadNodes();
    const interval = setInterval(() => loadNodes(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const onlineCount = nodes.filter((n) => n.online).length;

  return (
    <div className="space-y-8">
      <SectionHeader title="Nodes" subtitle="All devices connected to your mesh network." />

      {/* Network Owner Info Banner */}
      {owner && !owner.is_owner && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-blue-400 font-medium mb-1">Shared Network Access</h3>
            <p className="text-white/70 text-sm">
              You're viewing nodes from <strong className="text-white">{owner.name}'s</strong> network ({owner.email}).
              All devices are in the <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono">{owner.headscale_user}</code> namespace.
              You can add your own devices using PreAuth Keys.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Monitor className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Total Nodes</p>
              <p className="text-2xl font-bold text-white">{nodes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Wifi className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Online</p>
              <p className="text-2xl font-bold text-green-400">{onlineCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <WifiOff className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Offline</p>
              <p className="text-2xl font-bold text-red-400">{nodes.length - onlineCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">Connected Devices</h3>
            {owner && owner.is_owner && (
              <span className="text-xs bg-pink-500/20 text-pink-300 px-2 py-1 rounded font-medium">
                Network Owner
              </span>
            )}
          </div>
          <button
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-colors disabled:opacity-50"
            onClick={() => loadNodes(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-white/60 mx-auto" />
            <p className="text-white/60 mt-2">Loading nodes...</p>
          </div>
        ) : nodes.length === 0 ? (
          <div className="p-8 text-center">
            <Monitor className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">No nodes connected yet.</p>
            <p className="text-white/40 text-sm mt-1">
              {owner && !owner.is_owner 
                ? `Generate a pre-auth key to add your devices to ${owner.name}'s network.`
                : "Generate a pre-auth key and use it to connect your first device."
              }
            </p>
            <a href="/dashboard/keys" className="inline-block mt-4 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-md transition-colors">
              Generate Key
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-white/70 text-sm bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">IP Address</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Last Seen</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="text-white/80">
                {nodes.map((node) => {
                  const isDeleting = deletingId === node.id;
                  return (
                    <tr key={node.id} className="border-t border-white/10 hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${node.online ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                          <span className={`text-xs px-2 py-1 rounded ${node.online ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                            {node.online ? "Online" : "Offline"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-white">{node.given_name || node.name}</p>
                          {node.given_name && node.name !== node.given_name && (
                            <p className="text-xs text-white/40">{node.name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {node.ip_addresses && node.ip_addresses.length > 0 ? (
                            node.ip_addresses.map((ip, idx) => (
                              <div key={`${node.id}-${ip}-${idx}`} className="flex items-center gap-2">
                                <code className="text-sm bg-white/10 px-2 py-1 rounded font-mono">{ip}</code>
                                <button className="text-white/40 hover:text-white transition-colors" onClick={() => copyIP(ip, node.id)} disabled={isDeleting}>
                                  {copiedId === `${node.id}-${ip}` ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            ))
                          ) : (
                            <code className="text-sm bg-white/10 px-2 py-1 rounded font-mono">N/A</code>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-white/60">
                          {node.user?.name || owner?.headscale_user || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">{formatLastSeen(node.last_seen?.seconds)}</td>
                      <td className="px-4 py-3">
                        <button
                          className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                          onClick={() => deleteNode(node.id, node.given_name || node.name)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </>
                          )}
                        </button>
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