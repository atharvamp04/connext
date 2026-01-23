"use client"

import { CreateKeyModal } from "./create-key-modal"

export function DataTableToolbar({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Enrollment keys list
      </div>

    </div>
  )
}
