"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/use-theme"
import { useCircularTransition } from "@/hooks/use-circular-transition"

interface ModeToggleProps {
  variant?: "outline" | "ghost" | "default"
}

export function ModeToggle({ variant = "outline" }: ModeToggleProps) {
  const { theme } = useTheme()
  const { toggleTheme } = useCircularTransition()

  // IMPORTANT: default false, updated only on client
  const [isDarkMode, setIsDarkMode] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)

    const updateMode = () => {
      if (theme === "dark") {
        setIsDarkMode(true)
      } else if (theme === "light") {
        setIsDarkMode(false)
      } else {
        // SAFE: runs only on client
        setIsDarkMode(
          window.matchMedia("(prefers-color-scheme: dark)").matches
        )
      }
    }

    updateMode()

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    media.addEventListener("change", updateMode)

    return () => media.removeEventListener("change", updateMode)
  }, [theme])

  // ⛔ Prevent hydration mismatch
  if (!mounted) return null

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={toggleTheme}
      className="relative overflow-hidden"
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">
        Switch to {isDarkMode ? "light" : "dark"} mode
      </span>
    </Button>
  )
}
