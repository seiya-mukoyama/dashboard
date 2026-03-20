"use client"

import { useEffect, useState } from "react"

type PlayerStat = {
  name: string; pos: string
  packing: number; packingR: number
  impact: number; impactR: number
  distance: number | null; maxSpeed: number | null; hi: number | null; sprint: number | null
  minutes?: number; goals?: number; assists?: number; preAssists?: number
}

const fmt = (v: number | null | undefined) =>
  v == null || v === 0 ? '-' : Number.isInteger(v) ? String(v) : v.toFixed(1)

export function PlayerStatsTable({ opponent, date }: { opponent: string; date?: string }) {
  const [stats, setStats] = useState<PlayerStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = date ? `/api/player-stats?date=${encodeURIComponent(date)}` : '/api/player-stats'
    fetch(url)
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [date])

  if (loading) return <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">読み込み中...</div>
  if (stats.length === 0) return <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">データがありません</div>

  const cols: { key: keyof PlayerStat; label: string }[] = [
    { key: 'name',       label: '選手名' },
    { key: 'pos',        label: 'POS' },
    { key: 'minutes',    label: '時間' },
    { key: 'goals',      label: '得点' },
    { key: 'assists',    label: 'A' },
    { key: 'preAssists', label: 'PA' },
    { key: 'packing',    label: 'Pack' },
    { key: 'packingR',   label: 'PackR' },
    { key: 'impact',     label: 'Imp' },
    { key: 'impactR',    label: 'ImpR' },
    { key: 'distance',   label: '走行距離' },
    { key: 'maxSpeed',   label: '最高速度' },
    { key: 'hi',         label: 'HI' },
    { key: 'sprint',     label: 'Sprint' },
  ]

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-xs border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-border">
            {cols.map(c => (
              <th key={c.key} className={`py-2 px-2 text-left font-semibold text-muted-foreground whitespace-nowrap ${c.key === 'name' ? 'sticky left-0 bg-card z-10' : ''}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.map((s, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
              {cols.map(c => (
                <td key={c.key} className={`py-2 px-2 whitespace-nowrap ${
                  c.key === 'name' ? 'font-semibold text-foreground sticky left-0 bg-card z-10' :
                  c.key === 'pos'  ? 'text-muted-foreground' :
                  (c.key === 'packing' || c.key === 'impact') && (s[c.key] as number) > 0 ? 'text-primary font-semibold' :
                  'text-foreground tabular-nums'
                }`}>
                  {c.key === 'name' ? s.name :
                   c.key === 'pos'  ? s.pos  :
                   fmt(s[c.key] as number | null | undefined)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}