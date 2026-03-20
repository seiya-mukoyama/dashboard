"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export type HalfData = {
  label: string
  labels: string[]
  vonds: { packing: number[]; impact: number[] }
  opp:   { packing: number[]; impact: number[] }
}

// 後方互換のため旧型も残す
export type TimelineData = {
  labels?: string[]
  halves?: HalfData[]
  vonds?: { packing: number[]; impact: number[] }
  opp?:   { packing: number[]; impact: number[] }
}

type Props = {
  data: TimelineData | null
  opponent: string
}

function HalfChart({ half, opponent }: { half: HalfData; opponent: string }) {
  const chartData = half.labels.map((label, i) => ({
    time: label,
    "VONDS パッキング": half.vonds.packing[i] ?? 0,
    "VONDS インペクト": half.vonds.impact[i] ?? 0,
    [`${opponent} パッキング`]: half.opp.packing[i] ?? 0,
    [`${opponent} インペクト`]: half.opp.impact[i] ?? 0,
  }))

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-2">{half.label}</p>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="time"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            label={{ value: "経過時間", position: "insideBottomRight", offset: -5, fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            interval={0}
          />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
            labelFormatter={(v) => `${v}分`}
          />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
          <Line type="stepAfter" dataKey="VONDS パッキング" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          <Line type="stepAfter" dataKey="VONDS インペクト" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="5 3" dot={false} />
          <Line type="stepAfter" dataKey={`${opponent} パッキング`} stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
          <Line type="stepAfter" dataKey={`${opponent} インペクト`} stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 3" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PackingTimelineChart({ data, opponent }: Props) {
  if (!data) return <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">タイムラインデータがありません</div>

  // 新しい halves 形式
  if (data.halves && data.halves.length > 0) {
    return (
      <div className="space-y-6">
        {data.halves.map((half, i) => (
          <HalfChart key={i} half={half} opponent={opponent} />
        ))}
      </div>
    )
  }

  // 旧形式（labels直接）のフォールバック
  if (!data.labels || data.labels.length === 0) {
    return <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">タイムラインデータがありません</div>
  }

  const legacyHalf: HalfData = {
    label: "",
    labels: data.labels,
    vonds: data.vonds!,
    opp:   data.opp!,
  }
  return <HalfChart half={legacyHalf} opponent={opponent} />
}