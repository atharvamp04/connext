"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Play, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DotPattern } from "@/components/ui/dot-pattern"
import { FeaturesSection } from "./FeaturesSection"
import { FaqSection } from "./FaqSection"
import { ContactSection } from "./ContactSection"
import { PricingSection } from "./PricingSection"
import { LogoCarousel } from "./TechStackStrip"
import { AboutSection } from "./AboutSection"

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background to-background/80 text-foreground">

      {/* BACKGROUND PATTERN */}
      <div className="absolute inset-0">
        <DotPattern className="opacity-100" size="md" fadeStyle="ellipse" />
      </div>

      {/* ================= HERO ================= */}
      <section className="relative z-10 pt-24 sm:pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">

          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 flex justify-center">
              <Badge variant="outline" className="px-4 py-2 border-foreground">
                <Star className="w-3 h-3 mr-2 fill-current" />
                Early Access • Peer-to-Peer • Secure
                <ArrowRight className="w-3 h-3 ml-2" />
              </Badge>
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Secure Remote Access
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {" "}Reimagined{" "}
              </span>
              for Modern Teams
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              <strong>Accremo</strong> combines Mesh VPN, Remote Desktop, and Instant File Transfer
              into one peer-to-peer platform — no servers, no port forwarding.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="text-base" asChild>
                <Link href="#">
                  Join Waitlist
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button variant="outline" size="lg" className="text-base" asChild>
                <a href="#">
                  <Play className="mr-2 h-4 w-4" />
                  Watch Demo
                </a>
              </Button>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mx-auto mt-20 max-w-6xl">
            <div className="relative">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-72 w-[90%] bg-primary/40 blur-3xl rounded-full" />

              <div className="relative rounded-xl border bg-card shadow-2xl overflow-hidden">
                <Image
                  src="/dashboard-light.png"
                  alt="Accremo Dashboard"
                  width={1200}
                  height={800}
                  className="block w-full dark:hidden"
                  priority
                />
                <Image
                  src="/dashboard-dark.png"
                  alt="Accremo Dashboard Dark"
                  width={1200}
                  height={800}
                  className="hidden w-full dark:block"
                  priority
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <FeaturesSection />
      <AboutSection />
      <PricingSection />
      <LogoCarousel />
      <FaqSection />
      <ContactSection />
    </main>
  )
}
