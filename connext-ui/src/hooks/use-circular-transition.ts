"use client"

import { useRef, useCallback } from "react"
import { useTheme } from "@/contexts/theme-context"

export function useCircularTransition() {
  const { theme, setTheme } = useTheme()
  const isTransitioningRef = useRef(false)

  const startTransition = useCallback(
    (coords: { x: number; y: number }, callback: () => void) => {
      if (isTransitioningRef.current) return
      isTransitioningRef.current = true

      const x = (coords.x / window.innerWidth) * 100
      const y = (coords.y / window.innerHeight) * 100

      document.documentElement.style.setProperty("--x", `${x}%`)
      document.documentElement.style.setProperty("--y", `${y}%`)

      if ("startViewTransition" in document) {
        const transition = (
          document as any
        ).startViewTransition(() => callback())

        transition.finished.finally(() => {
          isTransitioningRef.current = false
        })
      } else {
        callback()
        setTimeout(() => {
          isTransitioningRef.current = false
        }, 400)
      }
    },
    []
  )

  const toggleTheme = useCallback(
    (event: React.MouseEvent) => {
      startTransition(
        { x: event.clientX, y: event.clientY },
        () => {
          setTheme(theme === "dark" ? "light" : "dark")
        }
      )
    },
    [theme, setTheme, startTransition]
  )

  return { toggleTheme }
}
