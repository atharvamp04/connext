// components/dashboard/connexr-section-cards.tsx
"use client"

import { Wifi, Users, Key, TrendingUp } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function ConnexrSectionCards({
  devices,
  users,
  keys,
}: {
  devices: any[]
  users: any[]
  keys: any[]
}) {
  const online = devices.filter(d => d.status === "online").length

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card bg-gradient-to-t grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      
      <StatCard
        title="Total Devices"
        value={devices.length}
        subtitle="Daemons connected"
        icon={<Wifi />}
      />

      <StatCard
        title="Online Devices"
        value={online}
        subtitle="Currently active"
        icon={<TrendingUp />}
        badge="+ live"
      />

      <StatCard
        title="Users"
        value={users.length}
        subtitle="Admin accounts"
        icon={<Users />}
      />

      <StatCard
        title="Enrollment Keys"
        value={keys.length}
        subtitle="Reusable auth keys"
        icon={<Key />}
      />
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  badge,
}: any) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">
          {value}
        </CardTitle>
        {badge && (
          <Badge variant="outline" className="w-fit">
            {icon}
            {badge}
          </Badge>
        )}
      </CardHeader>
      <CardFooter className="text-sm text-muted-foreground">
        {subtitle}
      </CardFooter>
    </Card>
  )
}
