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
  vonds: StatsData; opp: StatsData; opponent: string
  halvesVonds?: StatsHalf[]; halvesOpp?: StatsHalf[]
}

const ITEMS = [
  { key: 'packingRate', label: 'パッキングレート' },
  { key: 'impact',      label: 'インペクト' },
  { key: 'boxEntries',      label: 'ボックス侵入' },
  { key: 'goalAreaEntries', label: 'ゴールエリア侵入' },
  { key: 'lineBreak',   label: 'ラインブレイク' },
  { key: 'lineBreakAC', label: 'ラインブレイクAC' },
  { key: 'crosses',   label: 'クロス' },
  { key: 'shots',     label: 'シュート' },
  { key: 'corners',   label: 'CK' },
  { key: 'freeKicks', label: 'FK' },
] as const

const fmt = (n: number) => {
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

function Bar({ vPct }: { vPct: number }) {
  return (
    <div className="relative flex h-5 rounded-full overflow-hidden bg-secondary w-full">
      <div className="absolute inset-0 pointer-events-none" style={{zIndex:10}}>
        <div className="absolute top-0 bottom-0 w-px" style={{left:"25%",background:"rgba(0,0,0,0.12)"}} />
        <div className="absolute top-0 bottom-0 w-px" style={{left:"50%",background:"rgba(0,0,0,0.2)"}} />
        <div className="absolute top-0 bottom-0 w-px" style={{left:"75%",background:"rgba(0,0,0,0.12)"}} />
      </div>
      <div className="bg-primary transition-all" style={{ width: `${vPct}%` }} />
      <div className="flex-1 bg-secondary" />
    </div>
  )
}

function SingleChart({ vonds, opp, opponent }: { vonds: StatsData; opp: StatsData; opponent: string }) {
  const rows = ITEMS.map(({ key, label }) => {
    const v = vonds[key] ?? 0
    const o = opp[key] ?? 0
    const vPct = (v + o) > 0 ? (v / (v + o)) * 100 : 50
    return { key, label, v, o, vPct }
  })

  return (
    <div className="w-full">
      {vonds.apt && (
        <div className="text-center py-2 mb-3 border-b border-border">
          <span className="text-xs text-muted-foreground">APT（実際プレーイングタイム）</span>
          <div className="text-sm font-semibold text-foreground mt-0.5">{vonds.apt}</div>
        </div>
      )}

      <div className="text-center mb-2 pb-1.5 border-b border-border">
        <span className="text-xs font-bold text-primary whitespace-nowrap">VONDS市原</span>
        <span className="text-xs text-muted-foreground mx-2">vs</span>
        <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">{opponent}</span>
      </div>

      {/* 各アイテム: 数値+ラベル行（中央寄せ flex）＋棒グラフ（w-full） */}
      {/* 数値の縦ライン: 全アイテムをgridで囲み display:contents でサブグリッド */}
      <div style={{display:'grid', gridTemplateColumns:'auto auto auto', rowGap:0}}>
        {rows.map(({ key, label, v, o, vPct }) => (
          <div key={key} style={{display:'contents'}}>
            {/* VONDS数値（右寄せ） */}
            <div className="pt-1.5 pb-0 text-sm font-bold tabular-nums text-right whitespace-nowrap self-end" style={{gridColumn:1}}>
              <span className={v > o ? 'text-primary' : 'text-foreground'}>{fmt(v)}</span>
            </div>
            {/* 項目名（中央） */}
            <div className="pt-1.5 pb-0 text-xs text-muted-foreground text-center whitespace-nowrap self-end" style={{gridColumn:2}}>
              {label}
            </div>
            {/* 相手数値（左寄せ） */}
            <div className="pt-1.5 pb-0 text-sm font-bold tabular-nums text-left whitespace-nowrap self-end" style={{gridColumn:3}}>
              <span className={o > v ? 'text-foreground' : 'text-muted-foreground'}>{fmt(o)}</span>
            </div>
            {/* 棒グラフ（3列全体） */}
            <div className="pt-0.5 pb-1.5" style={{gridColumn:'1 / 4'}}>
              <Bar vPct={vPct} />
            </div>
          </div>
        ))}
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
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}>
              {tab}
            </button>
          ))}
        </div>
      )}
      <SingleChart vonds={curVonds} opp={curOpp} opponent={opponent} />
    </div>
  )
}
