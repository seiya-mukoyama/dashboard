"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export type TimelineData = {
  labels: string[]
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

  const packingData = data.labels.map((label, i) => ({
    time: label,
    VONDS市原: data.vonds.packing[i],
    [opponent]: data.opp.packing[i],
  }))

  const impactData = data.labels.map((label, i) => ({
    time: label,
    VONDS市原: data.vonds.impact[i],
    [opponent]: data.opp.impact[i],
  }))

  const chartStyle = {
    fontSize: 11,
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">パッキングレート 累積推移</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={packingData} style={chartStyle}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} label={{ value: "経過時間(分)", position: "insideBottomRight", offset: -5, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="VONDS市原" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey={opponent} stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">インペクト 累積推移</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={impactData} style={chartStyle}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} label={{ value: "経過時間(分)", position: "insideBottomRight", offset: -5, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="VONDS市原" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey={opponent} stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}