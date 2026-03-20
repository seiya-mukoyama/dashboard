"use client"

import { useState } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"

type HalfData = {
  label: string
  labels: string[]
  vonds: { packing: number[]; impact: number[] }
  opp:   { packing: number[]; impact: number[] }
}

export type TimelineData = {
  total?: HalfData | null
  halves?: HalfData[]
  noData?: boolean
  // 旧形式後方互換
  labels?: string[]
  vonds?: { packing: number[]; impact: number[] }
  opp?:   { packing: number[]; impact: number[] }
}

function buildChartData(half: HalfData) {
  return half.labels.map((label, i) => ({
    t: label,
    vPack: half.vonds.packing[i] ?? null,
    vImp:  half.vonds.impact[i]  ?? null,
    oPack: half.opp.packing[i]   ?? null,
    oImp:  half.opp.impact[i]    ?? null,
  }))
}

function HalfChart({ half, opponent }: { half: HalfData; opponent: string }) {
  const data = buildChartData(half)
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
        <XAxis
          dataKey="t"
          tick={{ fontSize: 10, fill: 'rgb(148,163,184)' }}
          label={{ value: '経過時間', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: 'rgb(148,163,184)' }}
        />
        <YAxis tick={{ fontSize: 10, fill: 'rgb(148,163,184)' }} />
        <Tooltip
          contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
          labelStyle={{ color: 'var(--foreground)' }}
        />
        <Legend wrapperStyle={{ fontSize: 10, color: 'rgb(148,163,184)', paddingTop: 8 }} iconSize={16} />
        <Line type="linear" dataKey="vPack" name="VONDS パッキング"          stroke="rgb(34,197,94)"         strokeWidth={2}   dot={false} />
        <Line type="linear" dataKey="vImp"  name="VONDS インペクト"          stroke="rgba(34,197,94,0.5)"   strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
        <Line type="linear" dataKey="oPack" name={`${opponent} パッキング`}  stroke="rgb(148,163,184)"      strokeWidth={2}   dot={false} />
        <Line type="linear" dataKey="oImp"  name={`${opponent} インペクト`}  stroke="rgba(148,163,184,0.5)" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function PackingTimelineChart({ data, opponent }: { data: TimelineData; opponent: string }) {
  const [activeTab, setActiveTab] = useState<string>('合計')

  // タブ一覧を作成: 合計, 前半, 後半, 3本目(あれば)...
  const tabs: HalfData[] = []
  if (data.total) tabs.push(data.total)
  if (data.halves) tabs.push(...data.halves)

  // 旧形式フォールバック
  if (tabs.length === 0) {
    if (data.labels && data.labels.length > 0 && data.vonds && data.opp) {
      const legacy: HalfData = { label: '合計', labels: data.labels, vonds: data.vonds, opp: data.opp }
      return <HalfChart half={legacy} opponent={opponent} />
    }
    return <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">データがありません</div>
  }

  const currentHalf = tabs.find(t => t.label === activeTab) ?? tabs[0]

  return (
    <div>
      {/* タブ */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              activeTab === tab.label
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* グラフ */}
      {currentHalf && <HalfChart half={currentHalf} opponent={opponent} />}
    </div>
  )
}