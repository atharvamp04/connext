"use client"

import * as React from "react"
import {
  Loader2,
  Check,
  Copy,
  Wifi,
  WifiOff,
  Trash2,
} from "lucide-react"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export interface Device {
  id: number
  pubkey: string
  name: string
  ip: string
  region: string
  status: "online" | "offline"
  last_seen: string
}

export default function NodeTable({
  devices = [],
  loading = false,
  showActions = false, // 👈 IMPORTANT
  onDelete,
}: {
  devices?: Device[]
  loading?: boolean
  showActions?: boolean
  onDelete?: (pubkey: string) => void
}) {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)
  const [deletingKey, setDeletingKey] = React.useState<string | null>(null)

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    setCopiedKey(text)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  async function handleDelete(pubkey: string) {
    if (!onDelete) return
    setDeletingKey(pubkey)
    await onDelete(pubkey)
    setDeletingKey(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Devices</CardTitle>
        <CardDescription>Live VPN node status</CardDescription>
      </CardHeader>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">
          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
          Loading devices…
        </div>
      ) : devices.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No devices connected yet.
        </div>
      ) : (
        <div className="relative overflow-x-auto">
          {/* 👇 prevents side overflow */}
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Public Key</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Last Seen</TableHead>
                {showActions && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {devices.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        d.status === "online"
                          ? "text-green-500 border-green-500/30"
                          : "text-red-500 border-red-500/30"
                      }
                    >
                      {d.status === "online" ? (
                        <Wifi className="mr-1 h-3 w-3" />
                      ) : (
                        <WifiOff className="mr-1 h-3 w-3" />
                      )}
                      {d.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="font-medium">
                    {d.name || "Unnamed device"}
                  </TableCell>

                  <TableCell>
                    {d.ip ? (
                      <code className="rounded bg-muted px-2 py-0.5 text-xs">
                        {d.ip}
                      </code>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-2 py-0.5 text-xs">
                        {d.pubkey.slice(0, 20)}…
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copy(d.pubkey)}
                      >
                        {copiedKey === d.pubkey ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>

                  <TableCell>{d.region || "global"}</TableCell>

                  <TableCell className="text-muted-foreground">
                    {new Date(d.last_seen).toLocaleString()}
                  </TableCell>

                  {showActions && (
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(d.pubkey)}
                        disabled={deletingKey === d.pubkey}
                      >
                        {deletingKey === d.pubkey ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  )
}
