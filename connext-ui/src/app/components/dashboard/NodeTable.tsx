// @/app/components/dashboard/NodeTable.tsx
"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface Node {
  id: number;
  name: string;
  given_name?: string;
  ip_addresses: string[];
  online: boolean;
  last_seen?: { seconds: number };
  user?: { name: string };
}

const CopyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function NodeTable({ nodes }: { nodes: Node[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  if (nodes.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl p-8 text-center">
        <p className="text-white/60">No nodes connected yet.</p>
        <p className="text-white/40 text-sm mt-1">
          Generate a pre-auth key and use it to connect your first device.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-white/70 text-sm bg-white/5">
            <tr>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">IP Address</th>
              <th className="px-4 py-3 font-medium">Last Seen</th>
            </tr>
          </thead>
          <tbody className="text-white/80">
            {nodes.map((node) => (
              <tr key={node.id} className="border-t border-white/10 hover:bg-white/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        node.online ? "bg-green-400 animate-pulse" : "bg-red-400"
                      }`}
                    />
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        node.online
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
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
                      node.ip_addresses.slice(0, 1).map((ip, idx) => (
                        <div key={`${node.id}-${ip}-${idx}`} className="flex items-center gap-2">
                          <code className="text-sm bg-white/10 px-2 py-1 rounded font-mono">
                            {ip}
                          </code>
                          <button
                            className="text-white/40 hover:text-white transition-colors"
                            onClick={() => copyIP(ip, node.id)}
                          >
                            {copiedId === `${node.id}-${ip}` ? (
                              <CheckIcon className="w-4 h-4 text-green-400" />
                            ) : (
                              <CopyIcon className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ))
                    ) : (
                      <code className="text-sm bg-white/10 px-2 py-1 rounded font-mono">
                        N/A
                      </code>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-white/60">
                  {formatLastSeen(node.last_seen?.seconds)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}