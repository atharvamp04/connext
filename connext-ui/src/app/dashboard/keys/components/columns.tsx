import type { ColumnDef } from "@tanstack/react-table"
import { Trash2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export type EnrollKey = {
  id: number
  key: string
  reusable: boolean
  usage_count: number
  expires_at: string | null
}

export const columns = (
  onDelete: (id: number) => void
): ColumnDef<EnrollKey>[] => [
  {
    accessorKey: "key",
    header: "Key",
    cell: ({ row }) => {
      const key = row.getValue("key") as string
      return (
        <div className="flex items-center gap-2">
          <code className="rounded bg-muted px-2 py-1 text-xs">
            {key.slice(0, 18)}…
          </code>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigator.clipboard.writeText(key)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
  {
    accessorKey: "reusable",
    header: "Reusable",
    cell: ({ row }) =>
      row.getValue("reusable") ? (
        <Badge className="bg-green-500/20 text-green-400">
          Reusable
        </Badge>
      ) : (
        <Badge className="bg-yellow-500/20 text-yellow-400">
          One-time
        </Badge>
      ),
  },
  {
    accessorKey: "usage_count",
    header: "Usage",
  },
  {
    accessorKey: "expires_at",
    header: "Expires At",
    cell: ({ row }) => {
      const v = row.getValue("expires_at") as string | null
      return v ? new Date(v).toLocaleString() : "Never"
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        className="text-red-500"
        onClick={() => onDelete(row.original.id)}
      >
        <Trash2 className="mr-1 h-4 w-4" />
        Delete
      </Button>
    ),
  },
]
