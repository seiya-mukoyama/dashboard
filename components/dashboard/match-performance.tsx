"use client"
import { useEffect, useState } from "react"

type MatchRecord = {
  date: string
  opponent: string
  result: string
  goals: number
  assists: number
  minutes: number
  rating: number
}

type Props = { playerName: string }

export function MatchPerformance({ playerName }: Props) {
  const [matches, setMatches] = useState<MatchRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!playerName) return
    setLoading(true)
    fetch(`/api/match-performance?playerName=${encodeURIComponent(playerName)}`)
      .then(r => r.json())
      .then(data => setMatches(Array.isArray(data) ? data : []))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false))
  }, [playerName])

  if (loading) return <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">読み込み中...</div>
  if (matches.length === 0) return <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">試合記録はありません</div>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">日付</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">対戦相手</th>
            <th className="text-center py-2 px-3 text-muted-foreground font-medium">結果</th>
            <th className="text-center py-2 px-3 text-muted-foreground font-medium">得点</th>
            <th className="text-center py-2 px-3 text-muted-foreground font-medium">アシスト</th>
            <th className="text-center py-2 px-3 text-muted-foreground font-medium">出場時間</th>
            <th className="text-center py-2 px-3 text-muted-foreground font-medium">評価</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((m, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
              <td className="py-2 px-3 text-muted-foreground">{m.date}</td>
              <td className="py-2 px-3 text-card-foreground font-medium">{m.opponent}</td>
              <td className="py-2 px-3 text-center">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  m.result.startsWith('W') || m.result.startsWith('勝') ? 'bg-primary/15 text-primary' :
                  m.result.startsWith('L') || m.result.startsWith('負') ? 'bg-destructive/15 text-destructive' :
                  'bg-secondary text-muted-foreground'
                }`}>{m.result}</span>
              </td>
              <td className="py-2 px-3 text-center text-card-foreground">{m.goals}</td>
              <td className="py-2 px-3 text-center text-card-foreground">{m.assists}</td>
              <td className="py-2 px-3 text-center text-muted-foreground">{m.minutes}分</td>
              <td className="py-2 px-3 text-center">
                <span className={`font-bold ${m.rating >= 8 ? 'text-primary' : m.rating >= 6 ? 'text-card-foreground' : 'text-muted-foreground'}`}>
                  {m.rating > 0 ? m.rating.toFixed(1) : '-'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}