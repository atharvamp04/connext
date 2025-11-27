"use client";

import { useEffect, useState } from "react";
import { API_URL, authHeaders } from "@/lib/api";
import StatCard from "@/app/components/dashboard/StatCard";
import NodeTable from "@/app/components/dashboard/NodeTable";
import SectionHeader from "@/app/components/dashboard/SectionHeader";

export default function DashboardPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalKeys, setTotalKeys] = useState(0);

  useEffect(() => {
    async function loadNodes() {
      try {
        const res = await fetch(`${API_URL}/headscale/nodes`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        setNodes(data.nodes || []);
      } catch (err) {
        console.error("Failed to load nodes:", err);
        setNodes([]);
      }
    }

    async function loadUsers() {
      try {
        const res = await fetch(`${API_URL}/users`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        setTotalUsers(data.users?.length || 0);
      } catch (err) {
        console.error("Failed to load users:", err);
        setTotalUsers(0);
      }
    }

    async function loadKeys() {
      try {
        const res = await fetch(`${API_URL}/headscale/keys`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        // Count only active (non-expired) keys
        const activeKeys = (data.keys || []).filter((k: any) => {
          const isExpired = Date.now() > k.expiration.seconds * 1000;
          return !isExpired;
        });
        setTotalKeys(activeKeys.length);
      } catch (err) {
        console.error("Failed to load keys:", err);
        setTotalKeys(0);
      }
    }

    loadNodes();
    loadUsers();
    loadKeys();
  }, []);

  const onlineNodes = nodes.filter(n => n.online).length;

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Overview"
        subtitle="Monitor your mesh network at a glance."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total nodes" value={nodes.length} hint="Connected" />
        <StatCard label="Online" value={onlineNodes} hint="Active now" />
        <StatCard label="Users" value={totalUsers} hint="Tailnet owner" />
        <StatCard label="Preauth keys" value={totalKeys} hint="Reusable" />
      </div>

      <div className="space-y-4 mt-6">
        <h3 className="text-lg font-semibold">Nodes</h3>
        <NodeTable nodes={nodes} />
      </div>
    </div>
  );
}