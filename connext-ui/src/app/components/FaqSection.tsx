"use client"

import { CircleHelp } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"

type FaqItem = {
  value: string
  question: string
  answer: string
}

const faqItems: FaqItem[] = [
  {
    value: "item-1",
    question: "What is Accremo and how does it work?",
    answer:
      "Accremo is a peer-to-peer remote access platform that combines Mesh VPN, Remote Desktop, and Instant File Transfer. Devices connect directly using encrypted WireGuard tunnels, forming a private network without relying on central servers or port forwarding.",
  },
  {
    value: "item-2",
    question: "Is Accremo truly peer-to-peer?",
    answer:
      "Yes. Accremo establishes direct device-to-device connections whenever possible using NAT hole punching. Relay servers are used only as a fallback when direct connectivity is not possible, and never for traffic inspection.",
  },
  {
    value: "item-3",
    question: "How is my data secured?",
    answer:
      "All traffic in Accremo is encrypted end-to-end using WireGuard. Devices authenticate using cryptographic identities, not passwords, and Accremo never decrypts or inspects your traffic.",
  },
  {
    value: "item-4",
    question: "Do you log or monitor user activity?",
    answer:
      "No. Accremo does not log traffic, record sessions, analyze behavior, or inspect data. Privacy is the default, not an optional feature.",
  },
  {
    value: "item-5",
    question: "Which platforms are supported?",
    answer:
      "Accremo currently supports Windows, macOS, and Linux with native clients. Mobile clients for iOS and Android are planned for future releases.",
  },
  {
    value: "item-6",
    question: "Is Accremo open-source or commercial?",
    answer:
      "Core networking components are designed to remain transparent and auditable. Advanced enterprise tooling, management features, and hosted services may be offered commercially in the future.",
  },
]

const FaqSection = () => {
  return (
    <section id="faq" className="relative z-10 py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* ---------- SECTION HEADER ---------- */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            FAQ
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about Accremo, its architecture,
            security model, and platform support.
          </p>
        </div>

        {/* ---------- FAQ CONTENT ---------- */}
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-5">
            {faqItems.map((item) => (
              <AccordionItem
                key={item.value}
                value={item.value}
                className="rounded-md border border-border/50 bg-transparent"
              >
                <AccordionTrigger className="cursor-pointer items-center gap-4 rounded-none bg-transparent py-3 px-4 hover:no-underline data-[state=open]:border-b">
                  <div className="flex items-center gap-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CircleHelp className="size-5" />
                    </div>
                    <span className="text-start font-semibold">
                      {item.question}
                    </span>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4 pt-2 text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* ---------- SUPPORT CTA ---------- */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Still have questions? We’re happy to help.
            </p>
            <Button className="relative z-10 bg-primary text-primary-foreground" asChild>
              <a href="#contact">
                Contact Support
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export { FaqSection }
