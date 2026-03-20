"use client"

import { useState } from "react"

type StatsHalf = {
  half: string
  packingRate: number; impact: number; boxEntries: number; goalAreaEntries: number
  lineBreak: number; lineBreakAC: number; crosses: number; shots: number
  corners: number; freeKicks: number
}

type StatsData = {
  packingRate: number; impact: number; boxEntries: number; goalAreaEntries: number
  lineBreak: number; lineBreakAC: number; crosses: number; shots: number
  corners: number; freeKicks: number
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
  const [activeTab, setActiveTab] = useState('合計')

  // タブ構築: halvesVonds/halvesOppがあればタブを表示
  const hasHalves = halvesVonds && halvesVonds.length > 1
  const tabs = hasHalves ? halvesVonds!.map(h => h.half) : []

  const getStatsForHalf = (half: string): { v: StatsData; o: StatsData } => {
    if (!hasHalves || half === '合計') return { v: vonds, o: opp }
    const vi = halvesVonds!.findIndex(h => h.half === half)
    const oi = halvesOpp!.findIndex(h => h.half === half)
    if (vi < 0) return { v: vonds, o: opp }
    return { v: halvesVonds![vi], o: halvesOpp![oi] ?? opp }
  }

  const { v: curVonds, o: curOpp } = getStatsForHalf(activeTab)

  return (
    <div>
      {/* 対戦チームラベル */}
      <div className="flex justify-between text-xs font-semibold mb-4">
        <span className="text-primary">VONDS市原</span>
        <span className="text-muted-foreground">{opponent}</span>
      </div>

      {/* タブ（前半/後半/3本目がある場合のみ表示） */}
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