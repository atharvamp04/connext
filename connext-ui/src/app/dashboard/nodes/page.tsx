"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

import { DataTable } from "./components/data-table"
import { columns as baseColumns, type Device } from "./components/columns"

export default function NodesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await api.get("/devices")
      setDevices(data.devices ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleDelete(pubkey: string) {
    if (!confirm("Are you sure you want to delete this node?")) return

    await api.delete(`/devices/${pubkey}`)

    // remove from UI
    setDevices((prev) =>
      prev.filter((d) => d.pubkey !== pubkey)
    )
  }

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading nodes…</div>
  }

  // inject delete handler into columns
  const columns = baseColumns(handleDelete)

  return (
    <div className="px-4 md:px-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nodes</h2>
        <p className="text-muted-foreground">
          Devices connected to your Connexr network
        </p>
      </div>

      <DataTable data={devices} columns={columns} />
    </div>
  )
}
