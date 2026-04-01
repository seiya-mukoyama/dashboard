"use client"
import { useEffect, useState } from "react"

type MatchRecord = {
  date: string
  match: string
  result: string
  goals: number
  assists: number
  preAssists: number
  minutes: number
  maxSpeed: number
}

// 公式戦かどうか判定（TMまたは空白でなければ公式戦）
function isOfficial(match: string): boolean {
  return !match.includes('(TM)') && !match.includes('トレーニング')
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
      <table className="w-full text-sm whitespace-nowrap">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">日付</th>
            <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">試合</th>
            <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">結果</th>
            <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">出場時間</th>
            <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">G</th>
            <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">A</th>
            <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">PA</th>
            <th className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">最高速度</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((m, i) => {
            const official = isOfficial(m.match)
            return (
              <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="py-2 px-2 text-muted-foreground text-xs">{m.date}</td>
                <td className="py-2 px-2 text-card-foreground text-xs">{m.match}</td>
                <td className="py-2 px-2 text-center">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    m.result.includes('勝') ? 'bg-primary/15 text-primary' :
                    m.result.includes('負') ? 'bg-destructive/15 text-destructive' :
                    'bg-secondary text-muted-foreground'
                  }`}>{m.result}</span>
                </td>
                {/* 出場時間: 公式戦のみ表示 */}
                <td className="py-2 px-2 text-center text-xs text-muted-foreground">
                  {official ? (m.minutes > 0 ? `${m.minutes}分` : '0分') : '-'}
                </td>
                {/* G: 公式戦のみ、ないなら0 */}
                <td className="py-2 px-2 text-center text-xs font-semibold">
                  {official
                    ? (m.goals > 0 ? <span className="text-primary">{m.goals}</span> : <span className="text-muted-foreground">0</span>)
                    : <span className="text-muted-foreground">-</span>
                  }
                </td>
                {/* A: 公式戦のみ */}
                <td className="py-2 px-2 text-center text-xs">
                  {official
                    ? (m.assists > 0 ? <span className="text-card-foreground">{m.assists}</span> : <span className="text-muted-foreground">0</span>)
                    : <span className="text-muted-foreground">-</span>
                  }
                </td>
                {/* PA: 公式戦のみ */}
                <td className="py-2 px-2 text-center text-xs">
                  {official
                    ? (m.preAssists > 0 ? <span className="text-card-foreground">{m.preAssists}</span> : <span className="text-muted-foreground">0</span>)
                    : <span className="text-muted-foreground">-</span>
                  }
                </td>
                {/* 最高速度: 全試合 */}
                <td className="py-2 px-2 text-center text-muted-foreground text-xs">
                  {m.maxSpeed > 0 ? `${m.maxSpeed.toFixed(1)} km/h` : '-'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
