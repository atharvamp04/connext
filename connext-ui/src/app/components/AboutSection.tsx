"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DotPattern } from "@/components/ui/dot-pattern"
import { Github, Network, ShieldCheck, Zap, Crown } from "lucide-react"

const values = [
  {
    icon: Network,
    title: "Infrastructure First",
    description:
      "Accremo is built as networking infrastructure, not SaaS. Reliability, determinism, and low-level control come first.",
  },
  {
    icon: ShieldCheck,
    title: "Security by Design",
    description:
      "Peer-to-peer connections, cryptographic identities, and encrypted tunnels ensure zero-trust networking.",
  },
  {
    icon: Zap,
    title: "Performance Focused",
    description:
      "Optimized for low latency and high throughput across mesh VPN, remote desktop, and file transfer.",
  },
  {
    icon: Crown,
    title: "Production Grade",
    description:
      "Designed for real-world environments including CGNAT, enterprise firewalls, and large device fleets.",
  },
]

export function AboutSection() {
  return (
    <section id="about" className="relative py-24 sm:py-32 overflow-hidden">
      
      {/* 🔹 DOTTED BACKGROUND — ONLY FOR HEADER */}
      <div className="absolute inset-x-0 top-0 h-[420px] -z-10">
        <DotPattern
          className="opacity-100"
          size="md"
          fadeStyle="ellipse"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ================= HEADER ================= */}
        <div className="mx-auto max-w-4xl text-center mb-16 relative">
          <Badge variant="outline" className="mb-4 bg-background">
            About Accremo
          </Badge>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            Built for secure, modern infrastructure
          </h2>

          <p className="text-lg text-muted-foreground">
            Accremo unifies mesh VPN, remote access, and file transfer into a
            single peer-to-peer networking layer  built for control, security,
            and performance.
          </p>
        </div>

        {/* ================= VALUES GRID ================= */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-4">
          {values.map((value, index) => (
            <Card
              key={index}
              className="relative z-10 bg-background shadow-sm isolate"
            >
              <CardContent className="p-8 text-center">

                {/* Icon */}
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <value.icon className="h-6 w-6" />
                </div>

                <h3 className="mt-6 font-medium">
                  {value.title}
                </h3>

                <p className="mt-3 text-sm text-muted-foreground">
                  {value.description}
                </p>

              </CardContent>
            </Card>
          ))}
        </div>

        {/* ================= CTA ================= */}
        <div className="mt-16 text-center relative z-10">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">

            <Button
              size="lg"
              className="bg-primary text-primary-foreground relative z-10"
              asChild
            >
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="bg-background relative z-10"
              asChild
            >
              <a href="#contact">
                Talk to the Accremo Team
              </a>
            </Button>

          </div>
        </div>

      </div>
    </section>
  )
}
