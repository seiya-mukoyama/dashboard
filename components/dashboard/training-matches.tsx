"use client"

import { useEffect, useState } from "react"
import { ChevronRight, ArrowLeft } from "lucide-react"
import { StatsComparisonChart } from "@/components/dashboard/stats-comparison-chart"
import { PackingTimelineChart, type TimelineData } from "@/components/dashboard/packing-timeline-chart"
import { PlayerStatsTable } from "@/components/dashboard/player-stats-table"

type StatsHalf = {
  half: string
  goalsFor: number; goalsAgainst: number
  packingRate: number; impact: number; boxEntries: number; goalAreaEntries: number
  lineBreak: number; lineBreakAC: number; crosses: number; shots: number
  corners: number; freeKicks: number
  apt?: string
  opp_packingRate: number; opp_impact: number; opp_boxEntries: number; opp_goalAreaEntries: number
  opp_lineBreak: number; opp_lineBreakAC: number; opp_crosses: number; opp_shots: number
  opp_corners: number; opp_freeKicks: number
}

type Match = StatsHalf & {
  date: string; tournament: string; venue: string; opponent: string
  halves: StatsHalf[]
}

function getMonth(date: string): string {
  const m = date.match(/^(\d+)月/)
  return m ? m[1] + "月" : "不明"
}

export function TrainingMatches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMonth, setActiveMonth] = useState<string | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [scoreTab, setScoreTab] = useState('合計')
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null)
  const [timelineLoading, setTimelineLoading] = useState(false)

  useEffect(() => {
    fetch("/api/stats?type=TM")
      .then(r => r.json())
      .then(data => {
        const ms = data.matches ?? []
        setMatches(ms)
        if (ms.length > 0) {
          const months = [...new Set(ms.map((m: Match) => getMonth(m.date)))]
          setActiveMonth(months[months.length - 1] as string)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // URLパラメータで日付が指定されていれば自動選択
  useEffect(() => {
    const dateParam = new URLSearchParams(window.location.search).get('date')
    if (!dateParam) {
      setSelected(null)
      return
    }
    if (matches.length === 0) return
    const idx = matches.findIndex(m => m.date === dateParam)
    if (idx >= 0) handleSelect(matches[idx], idx)
  }, [matches])

  const handleSelect = async (match: Match, idx: number) => {
    setSelected(idx)
    setScoreTab(match.halves?.[0]?.half ?? '合計')
    setTimelineData(null)
    setTimelineLoading(true)
    try {
      const r = await fetch(`/api/timeline?date=${encodeURIComponent(match.date)}`)
      const d = await r.json()
      setTimelineData(d.halves?.length ? d : null)
    } catch {
      setTimelineData(null)
    } finally {
      setTimelineLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">読み込み中...</div>
  if (matches.length === 0) return <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">試合データがありません</div>

  const months = [...new Set(matches.map(m => getMonth(m.date)))]

  if (selected !== null) {
    const m = matches[selected]

    // スコアタブ対応
    const scoreTabs = m.halves?.map(h => h.half) ?? []
    const activeHalf = m.halves?.find(h => h.half === scoreTab) ?? m.halves?.[0] ?? m
    const result = activeHalf.goalsFor > activeHalf.goalsAgainst ? "win"
      : activeHalf.goalsFor < activeHalf.goalsAgainst ? "lose" : "draw"

    const halvesVonds = m.halves.map(h => ({
      half: h.half, apt: h.apt,
      packingRate: h.packingRate, impact: h.impact,
      boxEntries: h.boxEntries, goalAreaEntries: h.goalAreaEntries,
      lineBreak: h.lineBreak, lineBreakAC: h.lineBreakAC,
      crosses: h.crosses, shots: h.shots, corners: h.corners, freeKicks: h.freeKicks,
    }))
    const halvesOpp = m.halves.map(h => ({
      half: h.half,
      packingRate: h.opp_packingRate, impact: h.opp_impact,
      boxEntries: h.opp_boxEntries, goalAreaEntries: h.opp_goalAreaEntries,
      lineBreak: h.opp_lineBreak, lineBreakAC: h.opp_lineBreakAC,
      crosses: h.opp_crosses, shots: h.opp_shots, corners: h.opp_corners, freeKicks: h.opp_freeKicks,
    }))

    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />一覧に戻る
        </button>

        {/* スコアカード */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs text-muted-foreground text-center mb-3 flex items-center justify-center gap-2">
            <span>{m.tournament || "TRM"} · {m.date}</span>
            {m.venue && <span className={`font-semibold px-1.5 py-0.5 rounded text-xs ${m.venue.toUpperCase()==='HOME'?'bg-primary/15 text-primary':'bg-orange-500/15 text-orange-500'}`}>{m.venue.toUpperCase()}</span>}
          </div>

          {/* スコアタブ（複数ハーフがある場合のみ） */}
          {scoreTabs.length > 1 && (
            <div className="flex justify-center gap-1.5 mb-4 flex-wrap">
              {scoreTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setScoreTab(tab)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    scoreTab === tab
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-6">
            <div className="text-center flex-1">
              <div className="text-xs font-semibold text-primary mb-2">VONDS市原</div>
              <div className="text-5xl font-bold text-primary">{activeHalf.goalsFor}</div>
            </div>
            <div className="text-center">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${result==='win'?'bg-primary/15 text-primary':result==='lose'?'bg-destructive/15 text-destructive':'bg-secondary text-muted-foreground'}`}>
                {result==='win'?'勝利':result==='lose'?'敗北':'引き分け'}
              </span>
              <div className="text-2xl font-bold text-muted-foreground mt-2">-</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-xs font-semibold text-muted-foreground mb-2">{m.opponent}</div>
              <div className="text-5xl font-bold text-muted-foreground">{activeHalf.goalsAgainst}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-5">スタッツ比較</h3>
          <StatsComparisonChart
            vonds={{ packingRate:m.packingRate, impact:m.impact, boxEntries:m.boxEntries, goalAreaEntries:m.goalAreaEntries, lineBreak:m.lineBreak, lineBreakAC:m.lineBreakAC, crosses:m.crosses, shots:m.shots, corners:m.corners, freeKicks:m.freeKicks, apt: m.halves?.[0]?.apt }}
            opp={{ packingRate:m.opp_packingRate, impact:m.opp_impact, boxEntries:m.opp_boxEntries, goalAreaEntries:m.opp_goalAreaEntries, lineBreak:m.opp_lineBreak, lineBreakAC:m.opp_lineBreakAC, crosses:m.opp_crosses, shots:m.opp_shots, corners:m.opp_corners, freeKicks:m.opp_freeKicks }}
            opponent={m.opponent}
            halvesVonds={halvesVonds}
            halvesOpp={halvesOpp}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">パッキング・インペクト 時系列</h3>
          {timelineLoading
            ? <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">読み込み中...</div>
            : timelineData
              ? <PackingTimelineChart data={timelineData} opponent={m.opponent} />
              : <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">この試合のタイムラインデータはありません</div>
          }
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">選手別スタッツ</h3>
          <PlayerStatsTable opponent={m.opponent} date={m.date} />
        </div>
      </div>
    )
  }

  const filtered = matches.filter(m => getMonth(m.date) === activeMonth)

  return (
    <div className="space-y-3">
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
      <div className="space-y-2">
        {filtered.map((m, i) => {
          const globalIdx = matches.indexOf(m)
          const result = m.goalsFor > m.goalsAgainst ? "win" : m.goalsFor < m.goalsAgainst ? "lose" : "draw"
          return (
            <button key={i} onClick={() => handleSelect(m, globalIdx)} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors text-left group">
              <div className="flex-shrink-0 w-20">
                <div className="text-xs text-muted-foreground">{m.date}</div>
                <div className="text-xs font-medium text-muted-foreground mt-0.5">{m.tournament || "TRM"}</div>
                {m.venue && <div className={`text-xs font-semibold mt-0.5 ${m.venue.toUpperCase()==='HOME'?'text-primary':'text-orange-500'}`}>{m.venue.toUpperCase()}</div>}
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
