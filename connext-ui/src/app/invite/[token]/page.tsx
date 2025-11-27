"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = "http://localhost:8081/api";

interface InvitationDetails {
  id: number;
  inviter_name: string;
  inviter_email: string;
  invitee_email: string;
  invitee_name: string;
  status: string;
  created_at: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === 'string' ? params.token : (Array.isArray(params.token) ? params.token[0] : '');

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Check if user is already logged in
  const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided");
      setLoading(false);
      return;
    }
    loadInvitation();
  }, [token]);

  async function loadInvitation() {
    try {
      const res = await fetch(`${API_URL}/invitations/${token}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid invitation");
        setLoading(false);
        return;
      }

      setInvitation(data.invitation);
      setEmail(data.invitation.invitee_email);
      setName(data.invitation.invitee_name || "");
    } catch (err) {
      setError("Failed to load invitation");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setSubmitting(false);
        return;
      }

      localStorage.setItem("token", data.token);
      await acceptInvitation(data.token);
    } catch (err) {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        setSubmitting(false);
        return;
      }

      localStorage.setItem("token", data.token);
      await acceptInvitation(data.token);
    } catch (err) {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  async function acceptInvitation(authToken?: string) {
    const tokenToUse = authToken || localStorage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/invitations/${token}/accept`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${tokenToUse}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to accept invitation");
        setSubmitting(false);
        return;
      }

      // Success! Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      setError("Failed to accept invitation");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading invitation...</div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-red-500/50 rounded-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Invalid Invitation</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg text-white font-medium transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  // If user is already logged in, just show accept button
  if (isLoggedIn && invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-white/10 rounded-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-pink-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📨</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Network Invitation</h2>
            <p className="text-white/60">
              <strong className="text-white">{invitation.inviter_name}</strong> has invited you to join their network
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm mb-4">
              {error}
            </div>
          )}

          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
            <div className="text-sm text-white/60 mb-1">Inviter</div>
            <div className="text-white font-medium">{invitation.inviter_email}</div>
          </div>

          <button
            onClick={() => acceptInvitation()}
            disabled={submitting}
            className="w-full px-4 py-3 bg-pink-600 hover:bg-pink-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? "Accepting..." : "Accept Invitation"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-pink-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🌐</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">You're Invited!</h2>
          {invitation && (
            <p className="text-white/60">
              <strong className="text-white">{invitation.inviter_name}</strong> invited you to join their Connext network
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2 rounded-md font-medium transition-colors ${
              mode === "login"
                ? "bg-pink-600 text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 rounded-md font-medium transition-colors ${
              mode === "signup"
                ? "bg-pink-600 text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Login Form */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-3 bg-pink-600 hover:bg-pink-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? "Logging in..." : "Login & Accept Invitation"}
            </button>
          </form>
        )}

        {/* Signup Form */}
        {mode === "signup" && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
                readOnly
              />
              <p className="text-xs text-white/40 mt-1">This email was invited</p>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-3 bg-pink-600 hover:bg-pink-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating account..." : "Sign Up & Accept Invitation"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}