import type { ColumnDef } from "@tanstack/react-table"
import { Wifi, WifiOff, Trash2, Copy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "./data-table-column-header"

export type Device = {
  id: number
  name: string
  ip: string
  pubkey: string
  region: string
  status: "online" | "offline"
  last_seen: string
}

export const columns = (
  onDelete: (pubkey: string) => void
): ColumnDef<Device>[] => [
  /* ---------------- Select ---------------- */
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
      />
    ),
    enableSorting: false,
  },

  /* ---------------- Status ---------------- */
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant="outline"
          className={
            status === "online"
              ? "text-green-500 border-green-500/30"
              : "text-red-500 border-red-500/30"
          }
        >
          {status === "online" ? (
            <Wifi className="mr-1 h-3 w-3" />
          ) : (
            <WifiOff className="mr-1 h-3 w-3" />
          )}
          {status}
        </Badge>
      )
    },
  },

  /* ---------------- Name ---------------- */
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">
        {row.getValue("name") || "Unnamed device"}
      </span>
    ),
  },

  /* ---------------- IP ---------------- */
  {
    accessorKey: "ip",
    header: "IP",
    cell: ({ row }) =>
      row.getValue("ip") ? (
        <code className="rounded bg-muted px-2 py-1 text-xs">
          {row.getValue("ip")}
        </code>
      ) : (
        "—"
      ),
  },

  /* ---------------- Pubkey ---------------- */
  {
    accessorKey: "pubkey",
    header: "Public Key",
    cell: ({ row }) => {
      const pubkey = row.getValue("pubkey") as string
      return (
        <div className="flex items-center gap-2">
          <code className="rounded bg-muted px-2 py-1 text-xs">
            {pubkey.slice(0, 18)}…
          </code>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigator.clipboard.writeText(pubkey)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },

  /* ---------------- Region ---------------- */
  {
    accessorKey: "region",
    header: "Region",
    cell: ({ row }) => row.getValue("region") || "global",
  },

  /* ---------------- Last Seen ---------------- */
  {
    accessorKey: "last_seen",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Seen" />
    ),
    cell: ({ row }) =>
      new Date(row.getValue("last_seen")).toLocaleString(),
  },

  /* ---------------- ACTION ---------------- */
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const pubkey = row.original.pubkey

      return (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-600"
          onClick={() => onDelete(pubkey)}
        >
          <Trash2 className="mr-1 h-4 w-4" />
          Delete
        </Button>
      )
    },
  },
]
