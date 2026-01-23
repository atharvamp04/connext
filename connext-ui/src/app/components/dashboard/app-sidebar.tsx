"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Network,
  Users,
  Key,
  Download,
  Globe,
  ShieldCheck,
  Settings,
  LogOut,
  CreditCard,
  BellDot,
} from "lucide-react"

import { Logo } from "@/components/ui/logo"
import { API_URL, authHeaders } from "@/lib/api"

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
import { NavUser } from "@/app/components/dashboard/nav-user"


/* ------------------------------------------------------------------ */
/* Nav config */
/* ------------------------------------------------------------------ */
const navItems = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Nodes", href: "/dashboard/nodes", icon: Network },
  { title: "Users", href: "/dashboard/users", icon: Users },
  { title: "Auth Keys", href: "/dashboard/keys", icon: Key },
  { title: "Download Client", href: "/dashboard/download", icon: Download },
  { title: "DNS", href: "/dashboard/dns", icon: Globe },
  { title: "ACL", href: "/dashboard/acl", icon: ShieldCheck },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
]

/* ------------------------------------------------------------------ */
/* Sidebar */
/* ------------------------------------------------------------------ */
export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const [user, setUser] = React.useState<{
    name: string
    email: string
  } | null>(null)

  React.useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: authHeaders(),
        })
        const data = await res.json()
        setUser(data)
      } catch {
        setUser(null)
      }
    }
    loadUser()
  }, [])

  function logout() {
    localStorage.removeItem("token")
    router.push("/login")
  }

  return (
    <Sidebar {...props}>
      {/* ---------------------------------------------------------------- */}
      {/* Header */}
      {/* ---------------------------------------------------------------- */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Logo size={22} />
                </div>
                {!isCollapsed && (
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Accremo</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Secure Mesh Network
                    </span>
                  </div>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ---------------------------------------------------------------- */}
      {/* Navigation */}
      {/* ---------------------------------------------------------------- */}
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.title}
                >
                  <Link href={item.href}>
                    <item.icon className="size-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* ---------------------------------------------------------------- */}
      {/* Footer (Account / Billing / Notifications / Logout) */}
      {/* ---------------------------------------------------------------- */}
          <SidebarFooter>
  {user && (
    <NavUser
      user={{
        name: user.name,
        email: user.email,
        avatar: "",
      }}
    />
  )}
</SidebarFooter>
    </Sidebar>
  )
}
