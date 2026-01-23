"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { CurrentPlanCard } from "./components/current-plan-card"
import { BillingHistoryCard } from "./components/billing-history-card"



export default function BillingSettings() {
  const handlePlanSelect = (planId: string) => {
    console.log("Plan selected:", planId)
    // TODO: call upgrade/downgrade API
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-3xl font-bold">Plans & Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information.
        </p>
      </div>



      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Choose a plan that works best for you.
          </CardDescription>
        </CardHeader>

      </Card>
    </div>
  )
}
