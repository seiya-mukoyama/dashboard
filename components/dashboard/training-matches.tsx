"use client"

import { useEffect, useState } from "react"
import { ChevronRight, ArrowLeft } from "lucide-react"
import { StatsComparisonChart } from "@/components/dashboard/stats-comparison-chart"
import { PackingTimelineChart, type TimelineData } from "@/components/dashboard/packing-timeline-chart"
import { PlayerStatsTable } from "@/components/dashboard/player-stats-table"

type Match = {
  date: string; tournament: string; opponent: string
  goalsFor: number; goalsAgainst: number
  packingRate: number; impact: number; boxEntries: number; goalAreaEntries: number
  lineBreak: number; lineBreakAC: number; crosses: number; shots: number
  corners: number; freeKicks: number
  opp_packingRate: number; opp_impact: number; opp_boxEntries: number; opp_goalAreaEntries: number
  opp_lineBreak: number; opp_lineBreakAC: number; opp_crosses: number; opp_shots: number
  opp_corners: number; opp_freeKicks: number
}

// "2月14日" → "2月" を返す
function getMonth(date: string): string {
  const m = date.match(/^(\d+)月/)
  return m ? m[1] + "月" : "不明"
}

export function TrainingMatches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMonth, setActiveMonth] = useState<string | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null)
  const [timelineLoading, setTimelineLoading] = useState(false)

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(data => {
        const ms = data.matches ?? []
        setMatches(ms)
        // 最新月をデフォルト選択
        if (ms.length > 0) {
          const months = [...new Set(ms.map((m: Match) => getMonth(m.date)))]
          setActiveMonth(months[months.length - 1] as string)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = async (match: Match, idx: number) => {
    setSelected(idx)
    setTimelineData(null)
    setTimelineLoading(true)
    try {
      const r = await fetch(`/api/timeline?date=${encodeURIComponent(match.date)}`)
      const d = await r.json()
      setTimelineData(d.labels?.length ? d : null)
    } catch {
      setTimelineData(null)
    } finally {
      setTimelineLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">読み込み中...</div>
  if (matches.length === 0) return <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">試合データがありません</div>

  // 月リストを古い順に並べる
  const months = [...new Set(matches.map(m => getMonth(m.date)))]

  // 詳細表示
  if (selected !== null) {
    const m = matches[selected]
    const result = m.goalsFor > m.goalsAgainst ? "win" : m.goalsFor < m.goalsAgainst ? "lose" : "draw"
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />一覧に戻る
        </button>

        {/* スコア */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs text-muted-foreground text-center mb-3">{m.tournament || "TRM"} · {m.date}</div>
          <div className="flex items-center justify-center gap-6">
            <div className="text-center flex-1">
              <div className="text-xs font-semibold text-primary mb-2">VONDS市原</div>
              <div className="text-5xl font-bold text-primary">{m.goalsFor}</div>
            </div>
            <div className="text-center">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${result==='win'?'bg-primary/15 text-primary':result==='lose'?'bg-destructive/15 text-destructive':'bg-secondary text-muted-foreground'}`}>
                {result==='win'?'勝利':result==='lose'?'敗北':'引き分け'}
              </span>
              <div className="text-2xl font-bold text-muted-foreground mt-2">-</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-xs font-semibold text-muted-foreground mb-2">{m.opponent}</div>
              <div className="text-5xl font-bold text-muted-foreground">{m.goalsAgainst}</div>
            </div>
          </div>
        </div>

        {/* スタッツ比較 */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-5">スタッツ比較</h3>
          <StatsComparisonChart
            vonds={{ packingRate:m.packingRate, impact:m.impact, boxEntries:m.boxEntries, goalAreaEntries:m.goalAreaEntries, lineBreak:m.lineBreak, lineBreakAC:m.lineBreakAC, crosses:m.crosses, shots:m.shots, corners:m.corners, freeKicks:m.freeKicks }}
            opp={{ packingRate:m.opp_packingRate, impact:m.opp_impact, boxEntries:m.opp_boxEntries, goalAreaEntries:m.opp_goalAreaEntries, lineBreak:m.opp_lineBreak, lineBreakAC:m.opp_lineBreakAC, crosses:m.opp_crosses, shots:m.opp_shots, corners:m.opp_corners, freeKicks:m.opp_freeKicks }}
            opponent={m.opponent}
          />
        </div>

        {/* タイムライン */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">パッキング・インペクト 時系列</h3>
          {timelineLoading
            ? <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">読み込み中...</div>
            : timelineData
              ? <PackingTimelineChart data={timelineData} opponent={m.opponent} />
              : <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">この試合のタイムラインデータはありません</div>
          }
        </div>

        {/* 選手別スタッツ */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">選手別スタッツ</h3>
          <PlayerStatsTable opponent={m.opponent} />
        </div>
      </div>
    )
  }

  // 一覧表示（月タブ付き）
  const filtered = matches.filter(m => getMonth(m.date) === activeMonth)

  return (
    <div className="space-y-3">
      {/* 月タブ */}
      <div className="flex gap-2 flex-wrap">
        {months.map(month => (
          <button
            key={month}
            onClick={() => setActiveMonth(month)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              activeMonth === month
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
            }`}
          >
            {month}
          </button>
        ))}
      </div>

      {/* 試合一覧 */}
      <div className="space-y-2">
        {filtered.map((m, i) => {
          const globalIdx = matches.indexOf(m)
          const result = m.goalsFor > m.goalsAgainst ? "win" : m.goalsFor < m.goalsAgainst ? "lose" : "draw"
          return (
            <button key={i} onClick={() => handleSelect(m, globalIdx)} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors text-left group">
              <div className="flex-shrink-0 w-20">
                <div className="text-xs text-muted-foreground">{m.date}</div>
                <div className="text-xs font-medium text-muted-foreground mt-0.5">{m.tournament || "TRM"}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-lg font-bold text-primary tabular-nums">{m.goalsFor}</span>
                <span className="text-sm text-muted-foreground">-</span>
                <span className="text-lg font-bold text-muted-foreground tabular-nums">{m.goalsAgainst}</span>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${result==='win'?'bg-primary/15 text-primary':result==='lose'?'bg-destructive/15 text-destructive':'bg-secondary text-muted-foreground'}`}>
                {result==='win'?'勝':result==='lose'?'負':'分'}
              </span>
              <div className="flex-1 text-sm font-medium text-card-foreground">vs {m.opponent}</div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export const trainingMatches = [
  { id: "tm-1", date: "2026/02/14", opponent: "栃木シティU-25", score: "4-2", result: "win" as const, type: "TM", duration: 120 },
]