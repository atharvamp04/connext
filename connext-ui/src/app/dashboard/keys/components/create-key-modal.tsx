"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"

import { API_URL, authHeaders } from "@/lib/api"

interface CreateKeyModalProps {
  onCreated?: () => void
}

export function CreateKeyModal({ onCreated }: CreateKeyModalProps) {
  const [open, setOpen] = useState(false)
  const [reusable, setReusable] = useState(true)
  const [expiresAt, setExpiresAt] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)

    try {
      await fetch(`${API_URL}/enroll-keys`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reusable,
          expires_at: expiresAt || null,
        }),
      })

      onCreated?.()
      setOpen(false)
      setReusable(true)
      setExpiresAt("")
    } catch (err) {
      console.error("Failed to create key", err)
      alert("Failed to create key")
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <Plus className="mr-2 h-4 w-4" />
          Create Key
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Create Enrollment Key</DialogTitle>
          <DialogDescription>
            Generate a reusable or one-time enrollment key for a device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reusable */}
          <div className="flex items-center justify-between">
            <Label>Reusable Key</Label>
            <Switch
              checked={reusable}
              onCheckedChange={setReusable}
            />
          </div>

          {/* Expiry */}
          <div className="space-y-2">
            <Label>Expiry (optional)</Label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for no expiration
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Key"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
