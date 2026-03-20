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
  { key: 'packingRate',     label: 'パッキングレート' },
  { key: 'impact',          label: 'インペクト' },
  { key: 'boxEntries',      label: 'ボックス侵入' },
  { key: 'goalAreaEntries', label: 'エリア侵入' },
  { key: 'lineBreak',       label: 'ラインブレイク' },
  { key: 'lineBreakAC',     label: 'ラインブレイクAC' },
  { key: 'crosses',         label: 'クロス' },
  { key: 'shots',           label: 'シュート' },
  { key: 'corners',         label: 'CK' },
  { key: 'freeKicks',       label: 'FK' },
] as const

function SingleChart({ vonds, opp, opponent }: { vonds: StatsData; opp: StatsData; opponent: string }) {
  return (
    <div className="space-y-3">
      {/* APT */}
      {vonds.apt && (
        <div className="text-center py-1.5 mb-2 border-b border-border">
          <span className="text-xs text-muted-foreground">APT（実質プレー時間）</span>
          <div className="text-sm font-semibold text-foreground mt-0.5">{vonds.apt}</div>
        </div>
      )}
      {ITEMS.map(({ key, label }) => {
        const v = vonds[key] ?? 0
        const o = opp[key] ?? 0
        const total = v + o
        const vPct = total > 0 ? (v / total) * 100 : 50
        return (
          <div key={key}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-semibold text-primary tabular-nums">{v}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-sm font-semibold text-muted-foreground tabular-nums">{o}</span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
              <div className="bg-primary transition-all" style={{ width: `${vPct}%` }} />
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
      <div className="flex justify-between text-xs font-semibold mb-4">
        <span className="text-primary">VONDS市原</span>
        <span className="text-muted-foreground">{opponent}</span>
      </div>

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