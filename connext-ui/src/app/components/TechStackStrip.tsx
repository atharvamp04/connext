"use client"

import { Card } from "@/components/ui/card"

const logos = [
  { name: "GitHub", src: "https://cdn.simpleicons.org/github/000000" },
  { name: "Google Cloud", src: "https://cdn.simpleicons.org/googlecloud/000000" },
  { name: "Linux", src: "https://cdn.simpleicons.org/linux/000000" },
  { name: "Docker", src: "https://cdn.simpleicons.org/docker/000000" },
  { name: "DigitalOcean", src: "https://cdn.simpleicons.org/digitalocean/000000" },
]

export function LogoCarousel() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-muted-foreground mb-10">
          Built on trusted infrastructure
        </p>

        <div className="relative overflow-hidden">
          {/* Left fade */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-background to-transparent z-10" />

          {/* Right fade */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-background to-transparent z-10" />

          {/* Scrolling track */}
          <div className="flex w-max animate-logo-scroll gap-24 items-center">
            {[...logos, ...logos].map((logo, i) => (
              <LogoCard key={i} logo={logo} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function LogoCard({ logo }: { logo: { name: string; src: string } }) {
  return (
    <Card
      className="
        h-28 w-52
        flex flex-col items-center justify-center gap-3
        bg-transparent border-0 shadow-none
        opacity-80 hover:opacity-100
        transition-all duration-300
        hover:scale-105
      "
    >
      <img
        src={logo.src}
        alt={logo.name}
        className="h-12 object-contain dark:invert"
      />
      <span className="text-xs font-medium text-muted-foreground tracking-wide">
        {logo.name}
      </span>
    </Card>
  )
}
