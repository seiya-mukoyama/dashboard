"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"

export function RecentMatches() {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => {
        const all = d.matches ?? []
        setMatches(all.slice().reverse().slice(0, 5))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const resultInfo = (m: any) => {
    if (m.goalsFor > m.goalsAgainst) return { label: '勝', color: 'bg-primary text-primary-foreground' }
    if (m.goalsFor < m.goalsAgainst) return { label: '敗', color: 'bg-destructive text-destructive-foreground' }
    return { label: '分', color: 'bg-yellow-500 text-black' }
  }

  const handleClick = (m: any) => {
    const isTM = m.tournament?.toUpperCase() === 'TM' || !m.tournament || m.tournament.trim() === ''
    if (isTM) {
      router.push('/?section=training')
    } else {
      router.push('/?section=official')
    }
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
              const isHome = m.venue?.toUpperCase() === 'HOME'
              const isTM = m.tournament?.toUpperCase() === 'TM' || !m.tournament || m.tournament.trim() === ''
              return (
                <button key={i} onClick={() => handleClick(m)}
                  className={`w-full flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-3 hover:bg-secondary/60 transition-colors text-left ${i === 0 ? 'ring-2 ring-primary/30' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-sm font-bold ${color}`}>
                      {label}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-card-foreground">vs {m.opponent}</p>
                        <Badge variant={isHome ? "default" : "outline"} className="text-xs">
                          {isHome ? "H" : "A"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{m.date}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {isTM ? 'TM' : m.tournament}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-card-foreground tabular-nums flex-shrink-0">
                    {m.goalsFor} - {m.goalsAgainst}
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
