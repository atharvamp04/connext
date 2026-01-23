"use client"

import * as React from "react"
import { AppSidebar } from "@/app/components/dashboard/app-sidebar"
import { SiteHeader } from "@/components/ui/site-header"
import { SiteFooter } from "@/components/ui/site-footer"
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar"

import {
  SidebarConfigProvider,
  useSidebarConfig,
} from "@/contexts/sidebar-context"

/* ---------------- INTERNAL SHELL ---------------- */

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { config } = useSidebarConfig()

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "14rem",
          "--sidebar-width-icon": "3rem",
          "--header-height": "calc(var(--spacing) * 14)",
        } as React.CSSProperties
      }
      className={config.collapsible === "none" ? "sidebar-none-mode" : ""}
    >
      {config.side === "left" ? (
        <>
          {/* Sidebar */}
          <AppSidebar
            variant={config.variant}
            collapsible={config.collapsible}
            side={config.side}
          />

          {/* Main */}
          <SidebarInset>
            <SiteHeader />

            <main className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  {children}
                </div>
              </div>
            </main>

            <SiteFooter />
          </SidebarInset>
        </>
      ) : (
        <>
          <SidebarInset>
            <SiteHeader />

            <main className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  {children}
                </div>
              </div>
            </main>

            <SiteFooter />
          </SidebarInset>

          <AppSidebar
            variant={config.variant}
            collapsible={config.collapsible}
            side={config.side}
          />
        </>
      )}
    </SidebarProvider>
  )
}

/* ---------------- PUBLIC LAYOUT ---------------- */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarConfigProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarConfigProvider>
  )
}
