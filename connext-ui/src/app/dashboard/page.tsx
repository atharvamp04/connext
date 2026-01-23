"use client"

import { useEffect, useState } from "react"
import { api, API_URL } from "@/lib/api"

import { ConnexrSectionCards } from "@/app/components/dashboard/connexr-section-cards"
import NodeTable, { Device } from "@/app/components/dashboard/NodeTable"

export default function Page() {
  const [devices, setDevices] = useState<Device[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [keys, setKeys] = useState<any[]>([])
  const [loadingDevices, setLoadingDevices] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setLoadingDevices(true)

      const [d, u, k] = await Promise.all([
        api.get("/devices"),
        api.get("/users"),
        api.get("/enroll-keys"),
      ])

      setDevices(d.devices ?? [])
      setUsers(u.users ?? [])
      setKeys(k.keys ?? [])
      setError(null)
    } catch (err: any) {
      console.error("❌ Dashboard load failed:", err)
      setError(err.message ?? "Failed to load dashboard")
      setDevices([])
    } finally {
      setLoadingDevices(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {/* Page Header */}
      <div className="px-4 lg:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Your Accremo network at a glance
          </p>
        </div>

        {error && (
          <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Error: {error}
          </div>
        )}
      </div>

      {/* Stats Section (SAME UI AS SectionCards) */}
      <div className="@container/main px-4 lg:px-6 space-y-6">
        <ConnexrSectionCards
          devices={devices}
          users={users}
          keys={keys}
        />
      </div>

      {/* Nodes Table */}
      <div className="@container/main px-4 lg:px-6">
        <NodeTable
          devices={devices}
          loading={loadingDevices}
        />
      </div>
    </>
  )
}
