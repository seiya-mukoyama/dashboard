"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Trophy, Target, Shield, Activity } from "lucide-react"

export function StatsCards() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setData).catch(() => {})
  }, [])

  const stats = data ? [
    {
      title: "総得点",
      value: data.matches?.reduce((s: number, m: any) => s + m.goalsFor, 0) ?? "-",
      sub: `平均 ${data.averages?.goalsFor?.toFixed(1) ?? "-"}点/試合`,
      trend: "up", icon: Target,
    },
    {
      title: "勝利数",
      value: data.wins ?? "-",
      sub: `${data.draws ?? 0}分 ${data.losses ?? 0}敗`,
      trend: "up", icon: Trophy,
    },
    {
      title: "クリーンシート",
      value: data.matches?.filter((m: any) => m.goalsAgainst === 0).length ?? "-",
      sub: "無失点試合",
      trend: "up", icon: Shield,
    },
    {
      title: "平均パッキング",
      value: data.averages?.packingRate?.toFixed(1) ?? "-",
      sub: `${data.matches?.length ?? 0}試合`,
      trend: "up", icon: Activity,
    },
  ] : [
    { title: "総得点", value: "-", sub: "読み込み中...", trend: "up", icon: Target },
    { title: "勝利数", value: "-", sub: "読み込み中...", trend: "up", icon: Trophy },
    { title: "クリーンシート", value: "-", sub: "読み込み中...", trend: "up", icon: Shield },
    { title: "平均パッキング", value: "-", sub: "読み込み中...", trend: "up", icon: Activity },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">{stat.sub}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
