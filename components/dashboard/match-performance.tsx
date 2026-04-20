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
  packing: number
  packingReceive: number
  impact: number
  impactReceive: number
  hi: number
  maxSpeed: number
  distance: number
  lineBreak: number
  sprint: number
  shoot: number
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

  const headers = ["日付","試合","結果","G","A","PA","出場時間","Pack","PackR","Imp","ImpR","HI","Sprint","最高速度","走行距離","LB","Shoot"]

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm whitespace-nowrap">
        <thead>
          <tr className="border-b border-border">
            {headers.map(h => (
              <th key={h} className="text-center py-2 px-2 text-muted-foreground font-medium text-xs">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matches.map((m, i) => (
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
              <td className="py-2 px-2 text-center text-xs font-semibold">
                {m.goals > 0 ? <span className="text-primary">{m.goals}</span> : <span className="text-muted-foreground">-</span>}
              </td>
              <td className="py-2 px-2 text-center text-xs">
                {m.assists > 0 ? <span className="text-card-foreground">{m.assists}</span> : <span className="text-muted-foreground">-</span>}
              </td>
              <td className="py-2 px-2 text-center text-xs">
                {m.preAssists > 0 ? <span className="text-card-foreground">{m.preAssists}</span> : <span className="text-muted-foreground">-</span>}
              </td>
              <td className="py-2 px-2 text-center text-muted-foreground text-xs">{m.minutes > 0 ? `${m.minutes}分` : '-'}</td>
              <td className="py-2 px-2 text-center text-card-foreground text-xs">{m.packing > 0 ? m.packing.toFixed(1) : '-'}</td>
              <td className="py-2 px-2 text-center text-card-foreground text-xs">{m.packingReceive > 0 ? m.packingReceive.toFixed(1) : '-'}</td>
              <td className="py-2 px-2 text-center text-card-foreground text-xs">{m.impact > 0 ? m.impact.toFixed(1) : '-'}</td>
              <td className="py-2 px-2 text-center text-card-foreground text-xs">{m.impactReceive > 0 ? m.impactReceive.toFixed(1) : '-'}</td>
              <td className="py-2 px-2 text-center text-muted-foreground text-xs">{m.hi > 0 ? m.hi.toFixed(1) : '-'}</td>
              <td className="py-2 px-2 text-center text-muted-foreground text-xs">{m.sprint > 0 ? m.sprint : '-'}</td>
              <td className="py-2 px-2 text-center text-muted-foreground text-xs">{m.maxSpeed > 0 ? m.maxSpeed.toFixed(1) : '-'}</td>
              <td className="py-2 px-2 text-center text-muted-foreground text-xs">{m.distance > 0 ? m.distance.toFixed(0) : '-'}</td>
              <td className="py-2 px-2 text-center text-card-foreground text-xs">{m.lineBreak > 0 ? m.lineBreak : '-'}</td>
          <td className="py-2 px-2 text-center text-xs">
            {(m.shoot ?? 0) > 0 ? <span className="text-orange-500 font-semibold">{m.shoot}</span> : <span className="text-muted-foreground">-</span>}
          </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
