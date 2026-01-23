// components/dashboard/device-columns.tsx
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"
import { z } from "zod"
import { nodeSchema } from "./schemas/device-schema"

type Device = z.infer<typeof nodeSchema>

export const deviceColumns: ColumnDef<Device>[] = [
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={
          row.original.status === "online"
            ? "text-green-500 border-green-500/30"
            : "text-red-500 border-red-500/30"
        }
      >
        {row.original.status === "online" ? <Wifi /> : <WifiOff />}
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "name",
    header: "Device Name",
  },
  {
    accessorKey: "ip",
    header: "IP Address",
    cell: ({ row }) => (
      <code className="rounded bg-muted px-2 py-0.5 text-xs">
        {row.original.ip}
      </code>
    ),
  },
  {
    accessorKey: "region",
    header: "Region",
  },
  {
    accessorKey: "last_seen",
    header: "Last Seen",
    cell: ({ row }) =>
      new Date(row.original.last_seen).toLocaleString(),
  },
]
