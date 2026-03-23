"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin } from "lucide-react"

type Match = {
  date: string; time: string; round: string; competition: string
  home: string; away: string; score: string | null
  isHome: boolean; venue: string; hasResult: boolean
}

export function RecentMatches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // JFL日程 + スプレッドシートの両方から取得してマージ
    Promise.all([
      fetch('/api/schedule').then(r => r.json()).catch(() => ({ past: [] })),
      fetch('/api/stats').then(r => r.json()).catch(() => ({ matches: [] })),
    ]).then(([schedule, stats]) => {
      // スプレッドシートの試合（公式戦+TM）を結果あり試合として取得
      const statsPast: Match[] = (stats.matches ?? []).slice().reverse().map((m: any) => ({
        date: m.date,
        time: '',
        round: m.tournament ?? '',
        competition: m.tournament ?? 'TM',
        home: m.venue?.toUpperCase() === 'HOME' ? 'VONDS市原' : m.opponent,
        away: m.venue?.toUpperCase() === 'HOME' ? m.opponent : 'VONDS市原',
        score: `${m.goalsFor}-${m.goalsAgainst}`,
        isHome: m.venue?.toUpperCase() === 'HOME',
        venue: '',
        hasResult: true,
      }))
      setMatches(statsPast.slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  const handleClick = (m: Match) => {
    // トレーニングマッチか公式戦かでページを切り替え
    const isTM = m.competition?.toUpperCase() === 'TM' || m.round?.toUpperCase() === 'TM'
    // 日付でURLを組み立てて公式戦/TM詳細へ（将来的な拡張用）
    // 現時点ではトレーニングマッチ/公式戦ページへ遷移
    if (isTM) {
      router.push('/?section=training')
    } else {
      router.push('/?section=official')
    }
  }

  const resultInfo = (m: Match) => {
    if (!m.score) return { label: '-', color: 'bg-secondary text-muted-foreground' }
    const [homeScore, awayScore] = m.score.split('-').map(Number)
    const vondsScore = m.isHome ? homeScore : awayScore
    const oppScore = m.isHome ? awayScore : homeScore
    if (vondsScore > oppScore) return { label: '勝', color: 'bg-primary text-primary-foreground' }
    if (vondsScore < oppScore) return { label: '敗', color: 'bg-destructive text-destructive-foreground' }
    return { label: '分', color: 'bg-yellow-500 text-black' }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-card-foreground">最近の試合</CardTitle>
        <CardDescription>直近の試合結果</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">読み込み中...</div>
        ) : (
          <div className="space-y-3">
            {matches.map((m, i) => {
              const { label, color } = resultInfo(m)
              const opponent = m.isHome ? m.away : m.home
              const vondsScore = m.score ? (m.isHome ? m.score.split('-')[0] : m.score.split('-')[1]) : '-'
              const oppScore = m.score ? (m.isHome ? m.score.split('-')[1] : m.score.split('-')[0]) : '-'
              return (
                <button key={i} onClick={() => handleClick(m)}
                  className="w-full flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-3 hover:bg-secondary/60 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-md text-sm font-bold ${color}`}>
                      {label}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-card-foreground">vs {opponent}</p>
                        <Badge variant={m.isHome ? "default" : "outline"} className="text-xs">
                          {m.isHome ? "H" : "A"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{m.date}</span>
                        </div>
                        <span className="text-xs">{m.competition}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-card-foreground tabular-nums">
                    {vondsScore} - {oppScore}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
