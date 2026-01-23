"use client"

import {
  Network,
  ShieldCheck,
  Zap,
  Users,
  ArrowRight,
  HardDrive,
  Cpu,
  Monitor,
  Lock,
  Globe,
  Router,
  Files
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Image3D } from "@/components/ui/image-3d"

/* ---------------- FEATURE DATA ---------------- */

const coreFeatures = [
  {
    icon: Network,
    title: "Pure Peer-to-Peer Mesh",
    description:
      "Devices connect directly with stable 100.x IPs using WireGuard tunnels. No central routing."
  },
  {
    icon: ShieldCheck,
    title: "WireGuard Encryption",
    description:
      "Modern cryptography with minimal attack surface and kernel-grade performance."
  },
  {
    icon: Router,
    title: "Automatic NAT Traversal",
    description:
      "UDP hole punching enables direct connections even behind CGNAT or firewalls."
  },
  {
    icon: Lock,
    title: "Zero-Trust Identity",
    description:
      "Every device is authenticated via cryptographic identity, not shared secrets."
  }
]

const systemFeatures = [
  {
    icon: Monitor,
    title: "High-Performance Remote Desktop",
    description:
      "Low-latency, high-FPS remote access with keyboard, mouse, and clipboard sync."
  },
  {
    icon: Files,
    title: "Instant File Transfer",
    description:
      "Direct P2P file transfer with resume support and LAN-speed throughput."
  },
  {
    icon: Cpu,
    title: "Lightweight Daemon",
    description:
      "Background service handles discovery, peering, and tunnel orchestration efficiently."
  },
  {
    icon: HardDrive,
    title: "Offline & LAN Friendly",
    description:
      "Works on local networks even without internet once peers are discovered."
  }
]

const platformFeatures = [
  {
    icon: Globe,
    title: "Cross-Platform Support",
    description:
      "Native clients for Windows, macOS, and Linux. Mobile clients planned."
  },
  {
    icon: Zap,
    title: "Userspace WireGuard",
    description:
      "Bundled userspace WG for environments without kernel module access."
  },
  {
    icon: ShieldCheck,
    title: "No Traffic Inspection",
    description:
      "Accremo never inspects, logs, or stores user traffic or session data."
  },
  {
    icon: Users,
    title: "Built for Teams & Enterprises",
    description:
      "Scales from personal devices to large internal networks."
  }
]

/* ---------------- COMPONENT ---------------- */

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative z-10 py-24 sm:py-32 bg-muted/30"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* ---------- SECTION HEADER ---------- */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Accremo Capabilities
          </Badge>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Infrastructure-grade remote access, redesigned
          </h2>

          <p className="text-lg text-muted-foreground">
            Accremo unifies Mesh VPN, Remote Desktop, and File Transfer into a
            single peer-to-peer networking layer — built for performance,
            privacy, and control.
          </p>
        </div>

        {/* ---------- FEATURE BLOCK 1 ---------- */}
        <div className="relative z-10 grid items-center gap-12 lg:grid-cols-2 lg:gap-8 xl:gap-16 mb-24">
          {/* Visual */}
          <Image3D
            lightSrc="/feature-network-light.png"
            darkSrc="/feature-network-dark.png"
            alt="Accremo mesh network visualization"
            direction="left"
          />

          {/* Content */}
          <div className="space-y-6 relative z-10">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                A true peer-to-peer networking layer
              </h3>

              <p className="text-muted-foreground text-base">
                Accremo behaves like infrastructure, not SaaS. Devices form a
                private mesh with deterministic addressing and encrypted tunnels
                — without relying on central gateways.
              </p>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2">
              {coreFeatures.map((feature, index) => (
                <li
                  key={index}
                  className="group flex items-start gap-3 p-2 rounded-lg transition-colors hover:bg-accent/5"
                >
                  <feature.icon className="mt-1 size-5 text-primary" />
                  <div>
                    <h4 className="font-medium text-foreground">
                      {feature.title}
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                size="lg"
                className="relative z-10 bg-primary text-primary-foreground"
              >
                <a href="#" className="flex items-center">
                  Explore Architecture
                  <ArrowRight className="ms-2 size-4" />
                </a>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="relative z-10 bg-background"
              >
                <a href="#">View Whitepaper</a>
              </Button>
            </div>
          </div>
        </div>

        {/* ---------- FEATURE BLOCK 2 (FLIPPED) ---------- */}
        <div className="relative z-10 grid items-center gap-12 lg:grid-cols-2 lg:gap-8 xl:gap-16">
          {/* Content */}
          <div className="space-y-6 order-2 lg:order-1 relative z-10">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Built for real-world workflows
              </h3>

              <p className="text-muted-foreground text-base">
                From remote development to enterprise IT operations, Accremo is
                designed to handle real latency, real security constraints, and
                real infrastructure complexity.
              </p>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2">
              {[...systemFeatures, ...platformFeatures].map((feature, index) => (
                <li
                  key={index}
                  className="group flex items-start gap-3 p-2 rounded-lg transition-colors hover:bg-accent/5"
                >
                  <feature.icon className="mt-1 size-5 text-primary" />
                  <div>
                    <h4 className="font-medium text-foreground">
                      {feature.title}
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                size="lg"
                className="relative z-10 bg-primary text-primary-foreground"
              >
                <a href="#" className="flex items-center">
                  View Documentation
                  <ArrowRight className="ms-2 size-4" />
                </a>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="relative z-10 bg-background"
              >
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Repository
                </a>
              </Button>
            </div>
          </div>

          {/* Visual */}
          <Image3D
            lightSrc="/feature-remote-light.png"
            darkSrc="/feature-remote-dark.png"
            alt="Accremo remote access dashboard"
            direction="right"
            className="order-1 lg:order-2"
          />
        </div>
      </div>
    </section>
  )
}
