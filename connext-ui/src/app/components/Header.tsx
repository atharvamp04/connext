"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

import useActiveSection from "@/hooks/useActiveSection"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const sections = [
  { id: "features", label: "Features" },
  { id: "pricing", label: "Pricing" },
  { id: "about", label: "About" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
]

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
}

export default function Header() {
  const active = useActiveSection(sections.map((s) => s.id))
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-6">

        {/* LEFT: LOGO */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo size={28} className="text-foreground" />
          <span className="text-lg">Accremo</span>
        </Link>

        {/* CENTER: NAV */}
        <nav className="mx-auto hidden md:flex items-center gap-6">
          {sections.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`text-sm font-medium transition-colors ${
                active === item.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* RIGHT: ACTIONS */}
        <div className="hidden md:flex items-center gap-3">
          <ModeToggle variant="ghost" />

          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>

          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>

        {/* MOBILE MENU */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="md:hidden ml-auto">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-full max-w-sm">
            <SheetHeader className="flex flex-row items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Logo size={18} />
                <span>Accremo</span>
              </SheetTitle>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </SheetHeader>

            {/* Mobile Nav */}
            <nav className="mt-6 space-y-2">
              {sections.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    scrollToSection(item.id)
                    setMobileOpen(false)
                  }}
                  className="w-full rounded-lg px-4 py-3 text-left text-sm font-medium hover:bg-accent"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Mobile Actions */}
            <div className="mt-6 space-y-4">
              <ModeToggle variant="outline" />

              <Button variant="outline" asChild className="w-full">
                <Link href="/login">Login</Link>
              </Button>

              <Button asChild className="w-full">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
