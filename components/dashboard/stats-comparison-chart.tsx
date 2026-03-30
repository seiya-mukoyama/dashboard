"use client"
import { useState } from "react"

type StatsHalf = {
  half: string
  packingRate: number; impact: number; boxEntries: number; goalAreaEntries: number
  lineBreak: number; lineBreakAC: number; crosses: number; shots: number
  corners: number; freeKicks: number; apt?: string
}
type StatsData = {
  packingRate: number; impact: number; boxEntries: number; goalAreaEntries: number
  lineBreak: number; lineBreakAC: number; crosses: number; shots: number
  corners: number; freeKicks: number; apt?: string
}
type Props = {
  vonds: StatsData
  opp: StatsData
  opponent: string
  halvesVonds?: StatsHalf[]
  halvesOpp?: StatsHalf[]
}

const ITEMS = [
  { key: 'packingRate', label: 'パッキングレート' },
  { key: 'impact',      label: 'インペクト' },
  { key: 'boxEntries',       label: 'ボックス侵入' },
  { key: 'goalAreaEntries',  label: 'ゴールエリア侵入' },
  { key: 'lineBreak',    label: 'ラインブレイク' },
  { key: 'lineBreakAC',  label: 'ラインブレイクAC' },
  { key: 'crosses',  label: 'クロス' },
  { key: 'shots',    label: 'シュート' },
  { key: 'corners',    label: 'CK' },
  { key: 'freeKicks',  label: 'FK' },
] as const

const fmt = (n: number) => {
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

function SingleChart({ vonds, opp, opponent }: { vonds: StatsData; opp: StatsData; opponent: string }) {
  return (
    <div className="w-full">
      {vonds.apt && (
        <div className="text-center py-2 mb-3 border-b border-border">
          <span className="text-xs text-muted-foreground">APT（実際プレーイングタイム）</span>
          <div className="text-sm font-semibold text-foreground mt-0.5">{vonds.apt}</div>
        </div>
      )}

      {/* ヘッダー行 */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-2 mb-2 pb-1.5 border-b border-border">
        <div className="text-xs font-bold text-primary text-right">VONDS市原</div>
        <div className="text-xs text-muted-foreground text-center w-32" />
        <div className="text-xs font-bold text-muted-foreground text-left">{opponent}</div>
      </div>

      {/* 各スタッツ行 */}
      <div className="space-y-1.5">
        {ITEMS.map(({ key, label }) => {
          const v = vonds[key] ?? 0
          const o = opp[key] ?? 0
          const total = v + o
          const vPct = total > 0 ? (v / total) * 100 : 50

          return (
            <div key={key} className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2">
              {/* VONDS 数値（右寄せ） */}
              <div className="text-right">
                <span className={`text-sm font-bold tabular-nums ${v > o ? 'text-primary' : 'text-foreground'}`}>
                  {fmt(v)}
                </span>
              </div>

              {/* 項目名 + 棒グラフ（中央） */}
              <div className="w-32 flex flex-col items-center gap-0.5">
                <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
                <div className="relative flex h-1.5 w-full rounded-full overflow-hidden bg-secondary">
                  <div
                    className="bg-primary transition-all rounded-full"
                    style={{ width: `${vPct}%` }}
                  />
                </div>
              </div>

              {/* 相手 数値（左寄せ） */}
              <div className="text-left">
                <span className={`text-sm font-bold tabular-nums ${o > v ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {fmt(o)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
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
    return { v: halvesVonds![vi], o: oi >= 0 && halvesOpp ? halvesOpp[oi] : opp }
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
