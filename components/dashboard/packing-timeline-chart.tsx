"use client"

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
  halves?: HalfData[]
  noData?: boolean
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
    <div>
      {half.label && (
        <p className="text-xs font-semibold text-muted-foreground mb-3">{half.label}</p>
      )}
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
          <Legend
            wrapperStyle={{ fontSize: 10, color: 'rgb(148,163,184)', paddingTop: 8 }}
            iconSize={16}
          />
          <Line type="linear" dataKey="vPack" name="VONDS パッキング"       stroke="rgb(34,197,94)"        strokeWidth={2}   dot={false} />
          <Line type="linear" dataKey="vImp"  name="VONDS インペクト"       stroke="rgba(34,197,94,0.5)"  strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
          <Line type="linear" dataKey="oPack" name={`${opponent} パッキング`} stroke="rgb(148,163,184)"     strokeWidth={2}   dot={false} />
          <Line type="linear" dataKey="oImp"  name={`${opponent} インペクト`} stroke="rgba(148,163,184,0.5)" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PackingTimelineChart({ data, opponent }: { data: TimelineData; opponent: string }) {
  if (data.halves && data.halves.length > 0) {
    return (
      <div className="space-y-6">
        {data.halves.map((half, i) => (
          <HalfChart key={i} half={half} opponent={opponent} />
        ))}
      </div>
    )
  }

  // 旧形式フォールバック
  if (data.labels && data.labels.length > 0 && data.vonds && data.opp) {
    const legacy: HalfData = { label: '', labels: data.labels, vonds: data.vonds, opp: data.opp }
    return <HalfChart half={legacy} opponent={opponent} />
  }

  return <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">データがありません</div>
}