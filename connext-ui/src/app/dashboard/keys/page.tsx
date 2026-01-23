"use client"

import { useEffect, useState } from "react"
import { API_URL, authHeaders } from "@/lib/api"
import SectionHeader from "@/app/components/dashboard/SectionHeader"

import { DataTable } from "./components/data-table"
import { columns, type EnrollKey } from "./components/columns"
import { CreateKeyModal } from "./components/create-key-modal"

export default function KeysPage() {
  const [keys, setKeys] = useState<EnrollKey[]>([])
  const [loading, setLoading] = useState(true)

  /* ---------------- Load keys ---------------- */
  async function loadKeys() {
    try {
      const res = await fetch(`${API_URL}/enroll-keys`, {
        headers: authHeaders(),
      })
      const data = await res.json()
      setKeys(data.keys ?? [])
    } catch (err) {
      console.error("Failed to load keys:", err)
      setKeys([])
    }
    setLoading(false)
  }

  /* ---------------- Delete key ---------------- */
  async function deleteKey(id: number) {
    if (!confirm("Delete this enrollment key?")) return

    await fetch(`${API_URL}/enroll-keys/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    })

    // optimistic update
    setKeys((prev) => prev.filter((k) => k.id !== id))
  }

  useEffect(() => {
    loadKeys()
  }, [])

  return (
    <div className="space-y-8 px-4 md:px-6">
      <SectionHeader
        title="Enrollment Keys"
        subtitle="Manage reusable or one-time enrollment keys for Connexr daemon onboarding."
      />

      <div className="rounded-xl border bg-background p-4 space-y-4">
        {/* 🔥 TOP BAR */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {keys.length} key{keys.length !== 1 ? "s" : ""}
          </div>

          {/* ✅ THIS WAS MISSING */}
          <CreateKeyModal onCreated={loadKeys} />
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            Loading enrollment keys…
          </div>
        ) : (
          <DataTable data={keys} columns={columns(deleteKey)} />
        )}
      </div>
    </div>
  )
}
