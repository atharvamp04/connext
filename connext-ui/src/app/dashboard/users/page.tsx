"use client";

import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  headscale_user: string;
  created_at: string;
}

interface Invitation {
  id: number;
  invitee_email: string;
  invitee_name: string;
  status: string;
  token: string;
  created_at: string;
}

const Trash = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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

const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div>
    <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
    <p className="text-white/60">{subtitle}</p>
  </div>
);

const API_URL = "http://localhost:8081/api";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") : "";

  async function loadData() {
    const token = getToken();
    try {
      const [usersRes, invitesRes] = await Promise.all([
        fetch(`${API_URL}/users`, {
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
        }),
        fetch(`${API_URL}/invitations`, {
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
        })
      ]);

      const usersData = await usersRes.json();
      const invitesData = await invitesRes.json();
      
      setUsers(usersData?.users || []);
      setInvitations(invitesData?.invitations || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function sendInvitation(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/invitations`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${getToken()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send invitation");
        setSubmitting(false);
        return;
      }

      setModalOpen(false);
      setName("");
      setEmail("");
      loadData();
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteUser(userId: number) {
    try {
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${getToken()}`,
          "Content-Type": "application/json"
        },
      });

      if (res.ok) {
        setDeleteModalOpen(false);
        setUserToDelete(null);
        loadData();
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  }

  async function cancelInvitation(invitationId: number) {
    try {
      const res = await fetch(`${API_URL}/invitations/${invitationId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${getToken()}`,
          "Content-Type": "application/json"
        },
      });

      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error("Failed to cancel invitation:", err);
    }
  }

  async function copyInviteLink(token: string) {
    const link = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  useEffect(() => {
    loadData();
  }, []);

  const pendingInvites = invitations.filter(i => i.status === "pending");

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Network Users"
        subtitle="Invite users to join your network or manage existing members."
      />

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Manage Users</h3>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 transition rounded-md text-white font-medium"
        >
          + Invite User
        </button>
      </div>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl backdrop-blur-xl overflow-hidden">
          <div className="p-4 border-b border-yellow-500/30">
            <h4 className="font-semibold text-yellow-300">Pending Invitations ({pendingInvites.length})</h4>
          </div>
          <table className="w-full text-left">
            <thead className="text-white/70 text-sm bg-white/5">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Invite Link</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-white/80">
              {pendingInvites.map((invite) => (
                <tr key={invite.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3">{invite.invitee_name || "—"}</td>
                  <td className="px-4 py-3 text-white/60">{invite.invitee_email}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-white/10 px-2 py-1 rounded font-mono">
                        /invite/{invite.token.substring(0, 8)}...
                      </code>
                      <button
                        onClick={() => copyInviteLink(invite.token)}
                        className="text-white/40 hover:text-white transition-colors"
                      >
                        {copiedToken === invite.token ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => cancelInvitation(invite.id)}
                      className="text-red-400 hover:text-red-300 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Active Users */}
      <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h4 className="font-semibold text-white">Active Users ({users.length})</h4>
        </div>
        {loading ? (
          <div className="p-8 text-center text-white/60">Loading users...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="text-white/70 text-sm bg-white/5">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Headscale User</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-white/80">
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-white/60">{user.email}</td>
                    <td className="px-4 py-3">
                      <code className="text-sm bg-white/10 px-2 py-1 rounded font-mono">
                        {user.headscale_user}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setUserToDelete(user);
                          setDeleteModalOpen(true);
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center p-8 text-white/40">
                    No users yet. Send your first invitation to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Invite User to Network</h2>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setError("");
                }}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4 text-sm text-blue-300">
              <strong>How it works:</strong>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• If user exists: They'll join your network</li>
                <li>• If user is new: They'll create an account first</li>
              </ul>
            </div>

            <div className="space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setError("");
                  }}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={sendInvitation}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Remove User</h2>
            <p className="text-white/60 mb-6">
              Remove <strong className="text-white">{userToDelete.name}</strong> from your network? 
              They will lose access to your network devices.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUser(userToDelete.id)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
              >
                Remove User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}