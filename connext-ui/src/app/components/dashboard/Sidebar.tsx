"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function DashboardSidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Overview", href: "/dashboard" },
    { name: "Keys", href: "/dashboard/keys" },
    { name: "Settings", href: "/dashboard/settings" },
    { name: "DNS", href: "/dashboard/dns" },
    { name: "ACL", href: "/dashboard/acl" },
  ];

  return (
    <aside className="w-60 min-h-screen bg-black/40 border-r border-white/10 text-white backdrop-blur-xl">
      <div className="flex flex-col gap-1 p-4 pt-8">

        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2 rounded-md transition flex items-center",
                active
                  ? "bg-pink-600 text-white font-semibold"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              {link.name}
            </Link>
          );
        })}

      </div>
    </aside>
  );
}
