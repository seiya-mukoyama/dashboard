"use client"

import { useEffect, useState } from "react"

type PlayerStat = {
  name: string; pos: string
  packing: number; packingR: number
  impact: number; impactR: number
  distance: number | null; maxSpeed: number | null; hi: number | null; sprint: number | null
  minutes?: number; goals?: number; assists?: number; preAssists?: number
}

type NumericKey = 'packing' | 'packingR' | 'impact' | 'impactR' | 'distance' | 'maxSpeed' | 'hi' | 'sprint'

const NUMERIC_COLS: NumericKey[] = ['packing', 'packingR', 'impact', 'impactR', 'distance', 'maxSpeed', 'hi', 'sprint']

const fmt = (v: number | null | undefined) =>
  v == null ? '-' : Number.isInteger(v) ? String(v) : v.toFixed(1)

// 上位3位のハイライト色（1位が最も濃い）
const RANK_COLORS: Record<number, string> = {
  1: 'bg-primary/30 text-primary font-bold',
  2: 'bg-primary/18 text-primary font-semibold',
  3: 'bg-primary/9 text-primary/80 font-medium',
}

// 各列の上位3位インデックスを計算
function buildRankMap(stats: PlayerStat[]): Map<string, number> {
  const rankMap = new Map<string, number>()
  for (const col of NUMERIC_COLS) {
    const values = stats.map((s, i) => ({ i, v: s[col] as number | null }))
      .filter(x => x.v != null && x.v > 0)
      .sort((a, b) => b.v! - a.v!)
    values.forEach((x, rank) => {
      if (rank < 3) rankMap.set(`${x.i}-${col}`, rank + 1)
    })
  }
  return rankMap
}

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

  const rankMap = buildRankMap(stats)

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
              {cols.map(c => {
                const isNumeric = NUMERIC_COLS.includes(c.key as NumericKey)
                const rank = isNumeric ? rankMap.get(`${i}-${c.key}`) : undefined
                const rankClass = rank ? RANK_COLORS[rank] : ''

                if (c.key === 'name') return (
                  <td key={c.key} className="py-2 px-2 whitespace-nowrap font-semibold text-foreground sticky left-0 bg-card z-10">
                    {s.name}
                  </td>
                )
                if (c.key === 'pos') return (
                  <td key={c.key} className="py-2 px-2 whitespace-nowrap text-muted-foreground">
                    {s.pos}
                  </td>
                )
                return (
                  <td key={c.key} className={`py-2 px-2 whitespace-nowrap tabular-nums rounded ${rankClass || 'text-foreground'}`}>
                    {fmt(s[c.key] as number | null | undefined)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}