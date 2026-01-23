"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api";

interface PendingMachine {
  machine_key: string;
  public_key: string;
  hostname: string;
  os: string;
  created_at: string;
}

export default function ApproveDevicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ?token=xxxx from daemon
  const token = searchParams.get("token") || "";

  const [machine, setMachine] = useState<PendingMachine | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [approvalResult, setApprovalResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [redirect, setRedirect] = useState(5);

  // helper to read Bearer token from localStorage
  function getAuthHeader(): { [k: string]: string } {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!t) return {};
    return { Authorization: `Bearer ${t}` };
  }

  // ------------------------------------------------
  // 1️⃣ CHECK LOGIN STATUS (using token from localStorage)
  // ------------------------------------------------
async function checkAuth(): Promise<boolean> {
  const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (!authToken) {
    router.push(
      `/login?next=${encodeURIComponent(`/approve-device?token=${token}`)}`
    );
    return false;
  }

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!res.ok) {
      router.push(
        `/login?next=${encodeURIComponent(`/approve-device?token=${token}`)}`
      );
      return false;
    }

    return true;
  } catch {
    router.push(
      `/login?next=${encodeURIComponent(`/approve-device?token=${token}`)}`
    );
    return false;
  }
}


  // ------------------------------------------------
  // 2️⃣ INIT PAGE
  // ------------------------------------------------
  useEffect(() => {
    async function init() {
      if (!token) {
        setError("Missing approval token in URL.");
        setLoading(false);
        return;
      }

      console.log("🔍 Token from URL:", token);

      const ok = await checkAuth();
      if (!ok) return;

      await loadPending();
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ------------------------------------------------
  // 3️⃣ LOAD PENDING MACHINE INFO (public)
  // ------------------------------------------------
async function loadPending() {
  try {
    const res = await fetch(`${API_URL}/machines/pending/${token}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),  // 🔥 ADD THIS !!!
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Pending machine not found");
      return;
    }

    setMachine(data);
  } catch (err) {
    setError("Failed to contact backend.");
  } finally {
    setLoading(false);
  }
}


  // ------------------------------------------------
  // 4️⃣ APPROVE DEVICE (sends Bearer token)
  // ------------------------------------------------
  async function approve() {
    setApproving(true);
    setError("");

    try {
      const authHdrs = getAuthHeader();
      if (!authHdrs.Authorization) {
        // no token -> redirect to login
        router.push(`/login?next=/approve-device?token=${token}`);
        return;
      }

      const res = await fetch(`${API_URL}/machines/approve/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHdrs,
        },
        // Body removed - device info already in database
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to approve device");
        setApproving(false);
        return;
      }

      setApproved(true);
      setApprovalResult(data);

      // Auto redirect countdown
      const interval = setInterval(() => {
        setRedirect((s) => {
          if (s <= 1) {
            clearInterval(interval);
            router.push("/dashboard");
          }
          return s - 1;
        });
      }, 1000);
    } catch (err) {
      setError("Approval failed.");
      setApproving(false);
    }
  }

  // ------------------------------------------------
  // UI STATES
  // ------------------------------------------------

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error && !machine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
        <div className="bg-red-500/20 p-6 rounded-lg border border-red-500/40 max-w-md w-full">
          <h2 className="text-xl font-bold mb-2">Invalid Request</h2>
          <p className="mb-4 text-white/70">{error}</p>
          <p className="text-xs text-white/50 mb-4">Token: {token || "(empty)"}</p>

          <button
            onClick={() => router.push("/")}
            className="w-full py-2 bg-pink-600 rounded hover:bg-pink-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (approved && approvalResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
        <div className="bg-green-600/20 p-8 border border-green-500/40 rounded-xl max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-4">Device Approved</h2>

          <div className="bg-white/5 p-4 border border-white/10 rounded-lg text-left space-y-2 mt-6">
            <p><span className="text-white/60">IP Address:</span> {approvalResult.ip_address}</p>
            <p><span className="text-white/60">Node ID:</span> {approvalResult.node_id}</p>
            <p><span className="text-white/60">Hostname:</span> {machine?.hostname}</p>
          </div>

          <p className="text-white/70 mt-6">
            Redirecting to dashboard in <b>{redirect}s</b>...
          </p>
        </div>
      </div>
    );
  }

  // ------------------------------------------------
  // MAIN APPROVAL UI
  // ------------------------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <div className="bg-slate-900 p-8 rounded-xl border border-white/10 max-w-md w-full">

        <h2 className="text-2xl font-bold mb-2 text-center">Approve Device</h2>
        <p className="text-white/60 text-center mb-6">
          A new device wants to join your Connexr network.
        </p>

        {error && (
          <div className="bg-red-500/20 p-3 rounded border border-red-500/40 text-red-300 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="bg-white/5 p-4 rounded border border-white/10 space-y-3 mb-6">
          <p><span className="text-white/60">Hostname:</span> {machine?.hostname}</p>
          <p><span className="text-white/60">OS:</span> {machine?.os}</p>
          <p>
            <span className="text-white/60">Machine Key:</span>
            <span className="font-mono block text-xs break-all">{machine?.machine_key}</span>
          </p>
          <p>
            <span className="text-white/60">Requested:</span>{" "}
            {machine?.created_at ? new Date(machine.created_at).toLocaleString() : "—"}
          </p>
        </div>

        <div className="bg-yellow-500/10 p-3 rounded border border-yellow-500/40 text-yellow-200/80 text-xs mb-6">
          ⚠ Approve only trusted devices.
        </div>

        <button
          onClick={approve}
          disabled={approving}
          className="w-full bg-pink-600 hover:bg-pink-700 py-3 rounded-lg font-medium mb-3 disabled:opacity-50"
        >
          {approving ? "Approving…" : "Approve Device"}
        </button>

        <button
          onClick={() => window.close()}
          className="w-full bg-white/5 hover:bg-white/10 py-3 rounded-lg border border-white/10 font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}