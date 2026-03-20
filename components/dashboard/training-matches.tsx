"use client"

import { useEffect, useState } from "react"
import { StatsComparisonChart } from "@/components/dashboard/stats-comparison-chart"

type Match = {
  date: string
  tournament: string
  opponent: string
  goalsFor: number
  goalsAgainst: number
  packingRate: number
  impact: number
  boxEntries: number
  goalAreaEntries: number
  lineBreak: number
  lineBreakAC: number
  crosses: number
  shots: number
  corners: number
  freeKicks: number
  opp_packingRate: number
  opp_impact: number
  opp_boxEntries: number
  opp_goalAreaEntries: number
  opp_lineBreak: number
  opp_lineBreakAC: number
  opp_crosses: number
  opp_shots: number
  opp_corners: number
  opp_freeKicks: number
}

export function TrainingMatches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(data => {
        const m = data.matches ?? []
        setMatches(m)
        if (m.length > 0) setSelected(0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">読み込み中...</div>
  )
  if (matches.length === 0) return (
    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">試合データがありません</div>
  )

  const current = selected !== null ? matches[selected] : null

  return (
    <div className="space-y-6">
      {/* 試合選択タブ */}
      <div className="flex flex-wrap gap-2">
        {matches.map((m, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selected === i
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {m.date} vs {m.opponent}
          </button>
        ))}
      </div>

      {/* 選択中の試合詳細 */}
      {current && (
        <div className="space-y-4">
          {/* スコア */}
          <div className="flex items-center justify-center gap-4 py-4 rounded-xl bg-secondary/50">
            <div className="text-center">
              <div className="text-xs text-primary font-semibold mb-1">VONDS市原</div>
              <div className="text-4xl font-bold text-primary">{current.goalsFor}</div>
            </div>
            <div className="text-center px-4">
              <div className="text-xs text-muted-foreground mb-1">{current.tournament || "TRM"}</div>
              <div className="text-lg font-bold text-muted-foreground">-</div>
              <div className="text-xs text-muted-foreground mt-1">{current.date}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground font-semibold mb-1">{current.opponent}</div>
              <div className="text-4xl font-bold text-muted-foreground">{current.goalsAgainst}</div>
            </div>
          </div>

          {/* スタッツ比較グラフ */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">スタッツ比較</h3>
            <StatsComparisonChart
              vonds={{
                packingRate: current.packingRate,
                impact: current.impact,
                boxEntries: current.boxEntries,
                goalAreaEntries: current.goalAreaEntries,
                lineBreak: current.lineBreak,
                lineBreakAC: current.lineBreakAC,
                crosses: current.crosses,
                shots: current.shots,
                corners: current.corners,
                freeKicks: current.freeKicks,
              }}
              opp={{
                packingRate: current.opp_packingRate,
                impact: current.opp_impact,
                boxEntries: current.opp_boxEntries,
                goalAreaEntries: current.opp_goalAreaEntries,
                lineBreak: current.opp_lineBreak,
                lineBreakAC: current.opp_lineBreakAC,
                crosses: current.opp_crosses,
                shots: current.opp_shots,
                corners: current.opp_corners,
                freeKicks: current.opp_freeKicks,
              }}
              opponent={current.opponent}
            />
          </div>
        </div>
      )}
    </div>
  )
}