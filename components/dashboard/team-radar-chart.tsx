"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"

const teamStats = [
  { stat: "攻撃力", value: 85, fullMark: 100 },
  { stat: "守備力", value: 78, fullMark: 100 },
  { stat: "パス精度", value: 82, fullMark: 100 },
  { stat: "体力", value: 75, fullMark: 100 },
  { stat: "チームワーク", value: 88, fullMark: 100 },
  { stat: "戦術理解", value: 80, fullMark: 100 },
]

const chartConfig = {
  value: {
    label: "能力値",
    color: "var(--chart-1)",
  },
}

export function TeamRadarChart() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-card-foreground">チーム総合力</CardTitle>
        <CardDescription>各能力の評価</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <RadarChart data={teamStats} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="stat"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Radar
              name="能力値"
              dataKey="value"
              stroke="var(--chart-1)"
              fill="var(--chart-1)"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
