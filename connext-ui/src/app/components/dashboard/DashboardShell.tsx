"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Key,
  Network,
  Users,
  ShieldCheck,
  Globe,
  Settings,
  LogOut,
  User,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL, authHeaders } from "@/lib/api";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Failed to load user:", err);
      }
    }
    loadUser();
  }, []);

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      router.push("/login");
    }
  }

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="flex w-full h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-neutral-900 border-r border-white/10 transition-all duration-300 flex flex-col",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo + Toggle */}
        <div className={cn(
          "flex items-center justify-between p-4 border-b border-white/10",
          collapsed && "justify-center"
        )}>
          {!collapsed && <span className="font-bold text-lg">Connext</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded hover:bg-white/10 transition"
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-4 flex-1">
          <SidebarLink icon={<LayoutDashboard size={18} />} label="Overview" href="/dashboard" collapsed={collapsed} />
          <SidebarLink icon={<Network size={18} />} label="Nodes" href="/dashboard/nodes" collapsed={collapsed} />
          <SidebarLink icon={<Users size={18} />} label="Users" href="/dashboard/users" collapsed={collapsed} />
          <SidebarLink icon={<Key size={18} />} label="Auth Keys" href="/dashboard/keys" collapsed={collapsed} />
          <SidebarLink icon={<Download size={18} />} label="Download Client" href="/dashboard/download" collapsed={collapsed} />
          <SidebarLink icon={<Globe size={18} />} label="DNS" href="/dashboard/dns" collapsed={collapsed} />
          <SidebarLink icon={<ShieldCheck size={18} />} label="ACL" href="/dashboard/acl" collapsed={collapsed} />
          <SidebarLink icon={<Settings size={18} />} label="Settings" href="/dashboard/settings" collapsed={collapsed} />
        </nav>

        {/* User Account Section */}
        <div className="border-t border-white/10 p-4">
          <Link
            href="/dashboard/account"
            className={cn(
              "flex items-center gap-3 p-2 rounded hover:bg-white/10 transition mb-2",
              collapsed && "justify-center"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
              {userInitial}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || "Loading..."}
                </p>
                <p className="text-xs text-white/60 truncate">
                  Account
                </p>
              </div>
            )}
          </Link>
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full p-2 rounded text-white/80 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition border border-transparent",
              collapsed && "justify-center"
            )}
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10">{children}</main>
    </div>
  );
}

/* 🟣 Component: Sidebar Link */
function SidebarLink({
  icon,
  label,
  collapsed,
  href,
}: {
  icon: JSX.Element;
  label: string;
  collapsed: boolean;
  href: string;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 p-2 rounded transition text-white/80 hover:text-white hover:bg-white/10",
        collapsed && "justify-center",
        active && "bg-white text-black font-semibold hover:bg-white hover:text-black"
      )}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}