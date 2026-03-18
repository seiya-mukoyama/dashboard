"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts"

const chartConfig = {
  得点: { label: "得点", color: "var(--chart-1)" },
  失点: { label: "失点", color: "var(--chart-5)" },
  パッキング: { label: "パッキング", color: "var(--chart-2)" },
}

export function PerformanceChart() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => {
      setData(d.matches?.map((m: any) => ({
        month: m.date,
        得点: m.goalsFor,
        失点: m.goalsAgainst,
      })) ?? [])
    }).catch(() => {})
  }, [])

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-card-foreground">試合別 得点・失点</CardTitle>
        <CardDescription>スプレッドシートデータ連携</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGoals" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorConceded" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-5)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-5)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="得点" stroke="var(--chart-1)" strokeWidth={2} fill="url(#colorGoals)" />
            <Area type="monotone" dataKey="失点" stroke="var(--chart-5)" strokeWidth={2} fill="url(#colorConceded)" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
