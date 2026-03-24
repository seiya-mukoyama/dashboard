"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

type Goal = {
  name: string
  target: string | null       // 現時点ペース目標
  seasonTarget: string | null // シーズン目標
  latest: string | null
  matchCount: number
  status: 'good' | 'bad' | 'neutral'
}

export function TargetProgress() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [matchCount, setMatchCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/goals')
      .then(r => r.json())
      .then(d => {
        setGoals(d.goals ?? [])
        setMatchCount(d.totalMatches ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <Card className="border-border/50">
      <CardContent className="flex items-center justify-center h-32 text-muted-foreground text-sm">読み込み中...</CardContent>
    </Card>
  )

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">目標達成状況</CardTitle>
        <CardDescription>
          {matchCount > 0 ? `第${matchCount}節終了時点` : 'シーズン目標との比較'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map(g => {
          const isTime = g.name.includes('APT')
          const toNum = (s: string) => {
            if (isTime) {
              const p = s.replace(/^:/, '').split(':')
              if (p.length === 3) return +p[0]*3600 + +p[1]*60 + +p[2]
              if (p.length === 2) return +p[0]*60 + +p[1]
              return 0
            }
            return parseFloat(s.replace(',', '')) || 0
          }
          // プログレスバーはシーズン目標に対する割合
          const pct = g.latest && g.seasonTarget
            ? Math.min(100, Math.round(toNum(g.latest) / toNum(g.seasonTarget) * 100))
            : 0
          const color = g.status === 'good' ? 'bg-primary' : g.status === 'bad' ? 'bg-destructive' : 'bg-muted-foreground'
          const textColor = g.status === 'good' ? 'text-primary' : g.status === 'bad' ? 'text-destructive' : 'text-muted-foreground'

          return (
            <div key={g.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">{g.name}</span>
                <div className="flex items-center gap-1.5">
                  {/* 実績 */}
                  <span className={`text-sm font-bold ${textColor}`}>{g.latest ?? '—'}</span>
                  {/* 現時点ペース目標 */}
                  {g.target && (
                    <span className="text-xs text-muted-foreground">/ {g.target}</span>
                  )}
                  {/* シーズン目標（ペース目標と異なる場合のみ表示） */}
                  {g.seasonTarget && g.seasonTarget !== g.target && (
                    <span className="text-xs text-muted-foreground/60">(目標{g.seasonTarget})</span>
                  )}
                  {g.status === 'good' && <TrendingUp className="h-3.5 w-3.5 text-primary" />}
                  {g.status === 'bad' && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
                  {g.status === 'neutral' && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: pct + '%' }} />
              </div>
            </div>
          )
        })}
        {goals.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">データがありません</p>
        )}
      </CardContent>
    </Card>
  )
}
