"use client"

import { useState } from "react"

type StatsHalf = {
  half: string
  packingRate: number; impact: number; boxEntries: number; goalAreaEntries: number
  lineBreak: number; lineBreakAC: number; crosses: number; shots: number
  corners: number; freeKicks: number
  apt?: string
}

type StatsData = {
  packingRate: number; impact: number; boxEntries: number; goalAreaEntries: number
  lineBreak: number; lineBreakAC: number; crosses: number; shots: number
  corners: number; freeKicks: number
  apt?: string
}

type Props = {
  vonds: StatsData
  opp: StatsData
  opponent: string
  halvesVonds?: StatsHalf[]
  halvesOpp?: StatsHalf[]
}

const ITEMS = [
  { key: 'packingRate',      label: 'パッキングレート' },
  { key: 'impact',           label: 'インパクト' },
  { key: 'boxEntries',       label: 'ボックス侵入回数' },
  { key: 'goalAreaEntries',  label: 'ゴールエリア侵入回数' },
  { key: 'lineBreak',        label: 'ラインブレイク' },
  { key: 'lineBreakAC',      label: 'ラインブレイクAC' },
  { key: 'crosses',          label: 'クロス' },
  { key: 'shots',            label: 'シュート' },
  { key: 'corners',          label: 'CK回数' },
  { key: 'freeKicks',        label: 'FK回数' },
] as const

function SingleChart({ vonds, opp, opponent }: { vonds: StatsData; opp: StatsData; opponent: string }) {
  return (
    <div className="space-y-4">
      {vonds.apt && (
        <div className="text-center py-2 mb-1 border-b border-border">
          <span className="text-xs text-muted-foreground">APT（実際プレーイングタイム）</span>
          <div className="text-sm font-semibold text-foreground mt-0.5">{vonds.apt}</div>
        </div>
      )}
      <div className="flex justify-between text-xs font-semibold mb-1">
        <span className="text-primary">VONDS市原</span>
        <span className="text-muted-foreground">{opponent}</span>
      </div>
      {ITEMS.map(({ key, label }) => {
        const v = vonds[key] ?? 0
        const o = opp[key] ?? 0
        const total = v + o
        const vPct = total > 0 ? (v / total) * 100 : 50
        const oPct = 100 - vPct
        return (
          <div key={key}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <div className="relative flex h-6 rounded-full overflow-hidden bg-secondary">
              <div
                className="bg-primary transition-all flex items-center justify-start pl-2"
                style={{ width: `${vPct}%` }}
              >
                {vPct >= 15 && (
                  <span className="text-xs font-bold text-white leading-none tabular-nums">{v}</span>
                )}
              </div>
              <div className="flex-1 flex items-center justify-end pr-2">
                {oPct >= 15 && (
                  <span className="text-xs font-bold text-foreground/80 leading-none tabular-nums">{o}</span>
                )}
              </div>
              {vPct < 15 && (
                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs font-bold text-primary leading-none tabular-nums">{v}</span>
              )}
              {oPct < 15 && (
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground/80 leading-none tabular-nums">{o}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function StatsComparisonChart({ vonds, opp, opponent, halvesVonds, halvesOpp }: Props) {
  const hasHalves = halvesVonds && halvesVonds.length > 1
  const tabs = hasHalves ? halvesVonds!.map(h => h.half) : []
  const [activeTab, setActiveTab] = useState<string>(tabs[0] ?? '合計')

  const getStatsForHalf = (half: string): { v: StatsData; o: StatsData } => {
    if (!hasHalves) return { v: vonds, o: opp }
    const vi = halvesVonds!.findIndex(h => h.half === half)
    const oi = halvesOpp ? halvesOpp.findIndex(h => h.half === half) : -1
    if (vi < 0) return { v: vonds, o: opp }
    return {
      v: halvesVonds![vi],
      o: oi >= 0 && halvesOpp ? halvesOpp[oi] : opp
    }
  }

  const { v: curVonds, o: curOpp } = getStatsForHalf(activeTab)

  return (
    <div>
      {hasHalves && (
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}
      <SingleChart vonds={curVonds} opp={curOpp} opponent={opponent} />
    </div>
  )
}
