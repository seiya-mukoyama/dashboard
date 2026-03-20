"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export type TimelineData = {
  labels: number[]
  vonds: { packing: number[]; impact: number[] }
  opp: { packing: number[]; impact: number[] }
}

type Props = {
  data: TimelineData | null
  opponent: string
}

export function PackingTimelineChart({ data, opponent }: Props) {
  if (!data || data.labels.length === 0) {
    return <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">タイムラインデータがありません</div>
  }

  // 全データを1つの配列に結合
  const chartData = data.labels.map((label, i) => ({
    time: label,
    "VONDS パッキング": data.vonds.packing[i] ?? 0,
    "VONDS インペクト": data.vonds.impact[i] ?? 0,
    [`${opponent} パッキング`]: data.opp.packing[i] ?? 0,
    [`${opponent} インペクト`]: data.opp.impact[i] ?? 0,
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="time"
            type="number"
            domain={[0, data.labels[data.labels.length - 1]]}
            ticks={data.labels}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            label={{ value: "経過時間（分）", position: "insideBottomRight", offset: -5, fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
            labelFormatter={(v) => `${v}分`}
          />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
          {/* VONDS パッキング: 緑・実線 */}
          <Line type="stepAfter" dataKey="VONDS パッキング" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          {/* VONDS インペクト: 緑・点線 */}
          <Line type="stepAfter" dataKey="VONDS インペクト" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="5 3" dot={false} />
          {/* 相手 パッキング: グレー・実線 */}
          <Line type="stepAfter" dataKey={`${opponent} パッキング`} stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
          {/* 相手 インペクト: グレー・点線 */}
          <Line type="stepAfter" dataKey={`${opponent} インペクト`} stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 3" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}