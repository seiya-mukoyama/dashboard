"use client"
import { useEffect, useState } from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"

type PlayerStat = {
  name: string; pos: string
  packing: number; packingR: number
  impact: number; impactR: number
  distance: number | null; maxSpeed: number | null; hi: number | null; sprint: number | null
  time?: string | null; lineBreak?: number | null
  minutes?: number; goals?: number; assists?: number; preAssists?: number
}

type NumericKey = 'packing' | 'packingR' | 'impact' | 'impactR' | 'lineBreak' | 'distance' | 'maxSpeed' | 'hi' | 'sprint'
type SortDir = 'desc' | 'asc'

const NUMERIC_COLS: NumericKey[] = ['packing', 'packingR', 'impact', 'impactR', 'lineBreak', 'distance', 'maxSpeed', 'hi', 'sprint']
const SESSIONS = ['合計', '前半', '後半', '3本目'] as const
type Session = typeof SESSIONS[number]

const fmt = (v: number | null | undefined) =>
  v == null ? '-' : Number.isInteger(v) ? String(v) : v.toFixed(1)

const RANK_BG: Record<number, string> = { 1: 'bg-primary/25', 2: 'bg-primary/14', 3: 'bg-primary/7' }
const RANK_TEXT: Record<number, string> = { 1: 'text-primary font-bold', 2: 'text-primary font-semibold', 3: 'text-primary/80 font-medium' }

function buildRankMap(stats: PlayerStat[]): Map<string, number> {
  const rankMap = new Map<string, number>()
  for (const col of NUMERIC_COLS) {
    const values = stats.map((s, i) => ({ i, v: s[col] as number | null }))
      .filter(x => x.v != null && x.v > 0)
      .sort((a, b) => b.v! - a.v!)
    values.forEach((x, rank) => { if (rank < 3) rankMap.set(`${x.i}-${col}`, rank + 1) })
  }
  return rankMap
}

export function PlayerStatsTable({ opponent, date }: { opponent: string; date?: string }) {
  const [session, setSession] = useState<Session>('合計')
  const [statsMap, setStatsMap] = useState<Partial<Record<Session, PlayerStat[]>>>({})
  const [availableSessions, setAvailableSessions] = useState<Session[]>(['合計'])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<keyof PlayerStat | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    if (!date) {
      // dateなし: 通常の全体集計（sessionなし）
      fetch('/api/player-stats')
        .then(r => r.json())
        .then(data => {
          setStatsMap({ '合計': data })
          setAvailableSessions(['合計'])
          setSession('合計')
        })
        .catch(() => {})
        .finally(() => setLoading(false))
      return
    }

    // dateあり: 全セッションを並列取得して存在するものだけ表示
    setLoading(true)
    Promise.all(
      SESSIONS.map(async s => {
        try {
          const r = await fetch(`/api/player-stats?date=${encodeURIComponent(date)}&session=${encodeURIComponent(s)}`)
          const data = await r.json()
          return { session: s, data: Array.isArray(data) && data.length > 0 ? data : null }
        } catch { return { session: s, data: null } }
      })
    ).then(results => {
      const map: Partial<Record<Session, PlayerStat[]>> = {}
      const available: Session[] = []
      results.forEach(({ session: s, data }) => {
        // パッキングまたはトラッキングデータが実際にある場合のみ有効
          const hasPacking = (data ?? []).some((p: PlayerStat) => p.packing > 0 || p.packingR > 0)
          const hasTracking = (data ?? []).some((p: PlayerStat) => p.distance != null || (p.sprint != null && p.sprint > 0))
          if (data && (hasPacking || hasTracking)) { map[s] = data; available.push(s) }
      })
      setStatsMap(map)
      setAvailableSessions(available.length > 0 ? available : ['合計'])
      setSession(available[0] ?? '合計')
    }).finally(() => setLoading(false))
  }, [date])

  const stats = statsMap[session] ?? []

  if (loading) return <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">読み込み中...</div>
  if (Object.keys(statsMap).length === 0) return <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">データがありません</div>

  const sorted = [...stats].sort((a, b) => {
    if (!sortKey) return 0
    const av = a[sortKey] as number | null | undefined
    const bv = b[sortKey] as number | null | undefined
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    return sortDir === 'desc' ? bv - av : av - bv
  })
  const rankMap = buildRankMap(stats)
  const origIndexMap = sorted.map(s => stats.indexOf(s))

  const handleSort = (key: keyof PlayerStat) => {
    if (sortKey === key) {
      if (sortDir === 'desc') setSortDir('asc')
      else { setSortKey(null); setSortDir('desc') }
    } else { setSortKey(key); setSortDir('desc') }
  }

  const SortIcon = ({ col }: { col: keyof PlayerStat }) => {
    if (sortKey !== col) return <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50 ml-0.5 inline" />
    if (sortDir === 'desc') return <ChevronDown className="h-3 w-3 text-primary ml-0.5 inline" />
    return <ChevronUp className="h-3 w-3 text-primary ml-0.5 inline" />
  }

  const cols: { key: keyof PlayerStat; label: string; sortable: boolean }[] = [
    { key: 'name', label: '選手名', sortable: false },
    { key: 'pos', label: 'POS', sortable: false },
    { key: 'minutes', label: '時間', sortable: true },
    { key: 'goals', label: 'G', sortable: true },
    { key: 'assists', label: 'A', sortable: true },
    { key: 'preAssists', label: 'PA', sortable: true },
    { key: 'packing', label: 'Pack', sortable: true },
    { key: 'packingR', label: 'PackR', sortable: true },
    { key: 'impact', label: 'Imp', sortable: true },
    { key: 'impactR', label: 'ImpR', sortable: true },
    { key: 'lineBreak', label: 'LB', sortable: true },
    { key: 'distance', label: '走行距離', sortable: true },
    { key: 'maxSpeed', label: '最高速度', sortable: true },
    { key: 'hi', label: 'HI', sortable: true },
    { key: 'sprint', label: 'Sprint', sortable: true },
  ]

  return (
    <div className="w-full">
      {/* セッションタブ（前半/後半/3本目がある場合のみ表示） */}
      {availableSessions.length > 1 && (
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {availableSessions.map(s => (
            <button
              key={s}
              onClick={() => setSession(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                session === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {stats.length === 0 ? (
        <div className="flex items-center justify-center h-12 text-muted-foreground text-sm">データがありません</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                {cols.map(c => (
                  <th key={c.key}
                    onClick={c.sortable ? () => handleSort(c.key) : undefined}
                    className={`py-2 px-2 text-left font-semibold text-muted-foreground whitespace-nowrap select-none ${
                      c.key === 'name' ? 'sticky left-0 bg-card z-10' : ''
                    } ${c.sortable ? 'cursor-pointer hover:text-foreground transition-colors' : ''} ${
                      sortKey === c.key ? 'text-primary' : ''
                    }`}
                  >
                    {c.label}{c.sortable && <SortIcon col={c.key} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, sortedIdx) => {
                const origIdx = origIndexMap[sortedIdx]
                return (
                  <tr key={sortedIdx} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    {cols.map(c => {
                      const isNumeric = NUMERIC_COLS.includes(c.key as NumericKey)
                      const rank = isNumeric ? rankMap.get(`${origIdx}-${c.key}`) : undefined
                      const bgClass = rank ? RANK_BG[rank] : ''
                      const textClass = rank ? RANK_TEXT[rank] : 'text-foreground'
                      if (c.key === 'name') return (
                        <td key={c.key} className={`py-1.5 px-2 whitespace-nowrap font-semibold text-foreground sticky left-0 z-10 ${bgClass || 'bg-card'}`}>
                          {s.name}
                        </td>
                      )
                      if (c.key === 'pos') return (
                        <td key={c.key} className="py-1.5 px-2 whitespace-nowrap text-muted-foreground">{s.pos}</td>
                      )
                      if (c.key === 'minutes') return (
                        <td key={c.key} className="py-1.5 px-2 whitespace-nowrap tabular-nums text-foreground">
                          {s.time ?? (s.minutes != null ? String(s.minutes) : '-')}
                        </td>
                      )
                      return (
                        <td key={c.key} className={`py-1.5 px-2 whitespace-nowrap tabular-nums rounded ${bgClass} ${textClass}`}>
                          {fmt(s[c.key] as number | null | undefined)}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground mt-2 text-right">項目名をクリックでソート（↓高い順 / ↑低い順 / もう一度でリセット）</p>
        </div>
      )}
    </div>
  )
}
