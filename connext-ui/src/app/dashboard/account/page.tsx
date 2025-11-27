"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SectionHeader from "@/app/components/dashboard/SectionHeader";
import { API_URL, authHeaders } from "@/lib/api";
import { User, Mail, Calendar, Shield, Loader2 } from "lucide-react";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  headscale_user?: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Failed to load user:", err);
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      router.push("/login");
    }
  }

  function formatDate(dateString: string) {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Account"
        subtitle="Manage your account settings and preferences."
        center={false}
      />

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-white/60" />
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Profile Card */}
          <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl p-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white text-3xl flex-shrink-0">
                {userInitial}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">{user?.name}</h2>
                <p className="text-white/60 mb-4">{user?.email}</p>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-pink-500/20 text-pink-400 border border-pink-500/30">
                    {user?.role || "User"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Account Details</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Full Name</p>
                  <p className="text-white font-medium">{user?.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Mail className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Email Address</p>
                  <p className="text-white font-medium">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Role</p>
                  <p className="text-white font-medium capitalize">{user?.role || "User"}</p>
                </div>
              </div>

              {user?.headscale_user && (
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Shield className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Headscale User</p>
                    <p className="text-white font-medium">{user.headscale_user}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Member Since</p>
                  <p className="text-white font-medium">{formatDate(user?.created_at || "")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl backdrop-blur-xl overflow-hidden">
            <div className="p-4 border-b border-red-500/20">
              <h3 className="text-lg font-semibold text-red-400">Logout</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium mb-1">Logout from your account</p>
                  <p className="text-white/60 text-sm">You will need to login again to access your account.</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}