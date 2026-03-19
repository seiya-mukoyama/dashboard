"use client"

import { useEffect, useState } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts"

type BodyRecord = {
  date: string
  weight: number | null
  fat: number | null
  muscle: number | null
}

type Props = {
  playerName: string
}

function thinDates(data: BodyRecord[], maxTicks = 8): Set<string> {
  if (data.length <= maxTicks) return new Set(data.map(d => d.date))
  const step = Math.ceil(data.length / maxTicks)
  const visible = new Set<string>()
  data.forEach((d, i) => {
    if (i === 0 || i === data.length - 1 || i % step === 0) visible.add(d.date)
  })
  return visible
}

export function BodyCompositionChart({ playerName }: Props) {
  const [data, setData] = useState<BodyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [active, setActive] = useState({ weight: true, fat: true, muscle: true })

  useEffect(() => {
    if (!playerName) return
    setLoading(true)
    setError("")
    fetch(`/api/body-composition?name=${encodeURIComponent(playerName)}`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d) && d.length > 0) setData(d)
        else setError("データがありません")
      })
      .catch(() => setError("データの取得に失敗しました"))
      .finally(() => setLoading(false))
  }, [playerName])

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
      体組成データを読み込み中...
    </div>
  )
  if (error) return (
    <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">{error}</div>
  )

  const tickDates = thinDates(data)
  const toggle = (key: keyof typeof active) => setActive(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="space-y-3">
      {/* 凡例・切り替えボタン */}
      <div className="flex gap-2 flex-wrap items-center">
        {([
          { key: "weight", label: "体重 (kg)", color: "#3b82f6" },
          { key: "fat",    label: "体脂肪率 (%)", color: "#f97316" },
          { key: "muscle", label: "骨格筋量 (kg)", color: "#22c55e" },
        ] as const).map(({ key, label, color }) => (
          <button key={key} onClick={() => toggle(key)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all
              ${active[key]
                ? "text-white border-transparent"
                : "bg-background text-muted-foreground border-border opacity-50"}`}
            style={active[key] ? { background: color, borderColor: color } : {}}
          >
            <span className="w-3 h-0.5 rounded inline-block" style={{ background: active[key] ? "white" : color }} />
            {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{data.length}日分</span>
      </div>

      {/* グラフ */}
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => tickDates.has(v) ? v : ""}
          />
          {/* 左軸: kg */}
          <YAxis yAxisId="kg" orientation="left"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false} axisLine={false} domain={["auto", "auto"]} width={36}
          />
          {/* 右軸: % */}
          <YAxis yAxisId="pct" orientation="right"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false} axisLine={false} domain={["auto", "auto"]} width={32}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => {
              const map: { [k: string]: [string, string] } = {
                weight: ["体重", "kg"],
                fat:    ["体脂肪率", "%"],
                muscle: ["骨格筋量", "kg"],
              }
              const [label, unit] = map[name] ?? [name, ""]
              return [`${value} ${unit}`, label]
            }}
          />
          {active.weight && (
            <Line yAxisId="kg" type="monotone" dataKey="weight"
              stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
          )}
          {active.fat && (
            <Line yAxisId="pct" type="monotone" dataKey="fat"
              stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
          )}
          {active.muscle && (
            <Line yAxisId="kg" type="monotone" dataKey="muscle"
              stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
