"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function RecentMatches() {
  const [matches, setMatches] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => {
      setMatches(d.matches?.slice().reverse().slice(0, 5) ?? [])
    }).catch(() => {})
  }, [])

  const resultLabel = (m: any) => m.goalsFor > m.goalsAgainst ? "勝" : m.goalsFor === m.goalsAgainst ? "分" : "敗"
  const resultColor = (m: any) => m.goalsFor > m.goalsAgainst
    ? "bg-primary text-primary-foreground"
    : m.goalsFor === m.goalsAgainst ? "bg-yellow-500 text-black" : "bg-destructive text-destructive-foreground"

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-card-foreground">最近の試合</CardTitle>
        <CardDescription>直近の試合結果</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {matches.length === 0 ? (
            <p className="text-muted-foreground text-sm">読み込み中...</p>
          ) : matches.map((m, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={resultColor(m)}>{resultLabel(m)}</Badge>
                <div>
                  <p className="text-sm font-medium text-card-foreground">vs {m.opponent}</p>
                  <p className="text-xs text-muted-foreground">{m.date}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-card-foreground">
                {m.goalsFor} - {m.goalsAgainst}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
