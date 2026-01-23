"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

const plans = [
  {
    name: "Starter",
    description: "For individuals getting started with secure peer-to-peer access",
    features: [
      "Up to 3 devices",
      "Encrypted P2P mesh VPN",
      "Stable private IPs",
      "Basic remote desktop",
      "Secure file transfer",
      "Community support",
    ],
    cta: "Get Early Access",
    popular: false,
    note: "Free during early access",
  },
  {
    name: "Pro",
    description: "For developers and small teams who need performance and scale",
    features: [
      "Up to 10 devices",
      "High-performance remote desktop",
      "Clipboard & input sync",
      "Faster file transfer",
      "Priority updates",
      "Email support",
    ],
    cta: "Contact Us",
    popular: true,
    includesPrevious: "Everything in Starter, plus",
    note: "Custom pricing",
  },
  {
    name: "Enterprise",
    description: "For organizations running critical internal infrastructure",
    features: [
      "Unlimited devices",
      "Team & org management",
      "Access policies & audit logs",
      "SSO / identity integration",
      "Dedicated support & SLA",
      "Optional relay hosting",
    ],
    cta: "Contact Sales",
    popular: false,
    includesPrevious: "Everything in Pro, plus",
    note: "Custom pricing",
  },
]

export function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")

  return (
    <section id="pricing" className="py-24 sm:py-32 bg-muted/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-12">
          <Badge variant="outline" className="mb-4">
            Pricing
          </Badge>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Flexible plans for every stage
          </h2>

          <p className="text-lg text-muted-foreground mb-2">
            Accremo pricing is based on usage and scale.
          </p>

          <p className="text-sm text-muted-foreground">
            Billing model selectable during onboarding
          </p>
        </div>

        {/* Cards */}
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`
                  relative rounded-xl p-8 border bg-card
                  transition-all duration-300 ease-out
                  hover:-translate-y-2 hover:shadow-xl
                  ${
                    plan.popular
                      ? "ring-2 ring-primary shadow-xl scale-[1.04] animate-pulse-soft"
                      : "shadow-sm"
                  }
                `}
              >
                {/* Glow for popular */}
                {plan.popular && (
                  <div className="absolute inset-0 -z-10 rounded-xl bg-primary/20 blur-2xl opacity-40" />
                )}

                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>

                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>

                {/* Pricing placeholder */}
                <div className="text-2xl font-semibold mb-1">
                  {plan.note}
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  {billing === "yearly"
                    ? "Annual billing available"
                    : "Monthly billing available"}
                </p>

                <Button
                  className="w-full mb-6"
                  variant={plan.popular ? "default" : "secondary"}
                  asChild
                >
                  <a href="#contact">{plan.cta}</a>
                </Button>

                {/* Features */}
                <ul className="space-y-3 text-sm">
                  {plan.includesPrevious && (
                    <li className="font-medium">
                      {plan.includesPrevious}:
                    </li>
                  )}

                  {plan.features.map((f, idx) => (
                    <li key={idx} className="flex gap-3 items-center">
                      <Check className="size-4 text-muted-foreground" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Looking for on-prem, air-gapped, or custom deployments?{" "}
            <a href="#contact" className="underline font-medium">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
