"use client"

import { Github, Twitter, Linkedin, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-6 py-16">

        {/* ================= TOP ================= */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-10">

          {/* Brand */}
          <div className="text-center md:text-left max-w-md">
            <h3 className="text-xl font-bold text-foreground">
              Accremo
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Infrastructure-grade peer-to-peer networking for secure remote
              access, file transfer, and distributed systems.
            </p>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </Button>

            <Button variant="ghost" size="icon" asChild>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </Button>

            <Button variant="ghost" size="icon" asChild>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>


        {/* ================= BOTTOM ================= */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-current" />
            <span>by</span>
            <span className="font-medium text-foreground">
              Accremo
            </span>
          </div>

          <span>
            © {new Date().getFullYear()} Accremo — All rights reserved.
          </span>
        </div>

      </div>
    </footer>
  )
}
