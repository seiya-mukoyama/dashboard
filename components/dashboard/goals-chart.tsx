"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from "recharts"

const goalsData = [
  { name: "田中", goals: 12, color: "var(--chart-1)" },
  { name: "山本", goals: 4, color: "var(--chart-2)" },
  { name: "伊藤", goals: 3, color: "var(--chart-3)" },
  { name: "佐藤", goals: 2, color: "var(--chart-4)" },
  { name: "高橋", goals: 2, color: "var(--chart-5)" },
  { name: "その他", goals: 24, color: "var(--muted-foreground)" },
]

const chartConfig = {
  goals: {
    label: "ゴール数",
    color: "var(--chart-1)",
  },
}

export function GoalsChart() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-card-foreground">得点者ランキング</CardTitle>
        <CardDescription>選手別ゴール数</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            data={goalsData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis
              type="number"
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="goals" radius={[0, 4, 4, 0]}>
              {goalsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
