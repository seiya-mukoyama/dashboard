"use client"

import { useEffect, useState } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts"

type Record = {
  date: string
  weight: number | null
  fat: number | null
  muscle: number | null
}

type Props = {
  playerName: string
}

// データが多い場合に日付を間引く（最大N点表示）
function thinDates(data: Record[], maxTicks = 8): string[] {
  if (data.length <= maxTicks) return data.map(d => d.date)
  const step = Math.ceil(data.length / maxTicks)
  return data
    .filter((_, i) => i === 0 || i === data.length - 1 || i % step === 0)
    .map(d => d.date)
}

export function BodyCompositionChart({ playerName }: Props) {
  const [data, setData] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeLines, setActiveLines] = useState({
    weight: true,
    fat: true,
    muscle: true,
  })

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
    <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
      {error}
    </div>
  )

  const tickDates = new Set(thinDates(data))

  const toggleLine = (key: keyof typeof activeLines) => {
    setActiveLines(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-3">
      {/* 表示切り替えボタン */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => toggleLine("weight")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors
            ${activeLines.weight ? "bg-blue-500 text-white border-blue-500" : "bg-background text-muted-foreground border-border"}`}
        >
          <span className="w-3 h-0.5 bg-current rounded inline-block" />
          体重 (kg)
        </button>
        <button
          onClick={() => toggleLine("fat")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors
            ${activeLines.fat ? "bg-orange-500 text-white border-orange-500" : "bg-background text-muted-foreground border-border"}`}
        >
          <span className="w-3 h-0.5 bg-current rounded inline-block" />
          体脂肪率 (%)
        </button>
        <button
          onClick={() => toggleLine("muscle")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors
            ${activeLines.muscle ? "bg-green-500 text-white border-green-500" : "bg-background text-muted-foreground border-border"}`}
        >
          <span className="w-3 h-0.5 bg-current rounded inline-block" />
          骨格筋量 (kg)
        </button>
        <span className="ml-auto text-xs text-muted-foreground self-center">{data.length}日分</span>
      </div>

      {/* グラフ */}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => tickDates.has(v) ? v : ""}
          />
          <YAxis
            yAxisId="weight"
            orientation="left"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
            width={36}
          />
          <YAxis
            yAxisId="percent"
            orientation="right"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
            width={32}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                weight: "体重",
                fat: "体脂肪率",
                muscle: "骨格筋量",
              }
              const units: Record<string, string> = {
                weight: " kg",
                fat: " %",
                muscle: " kg",
              }
              return [`${value}${units[name] || ""}`, labels[name] || name]
            }}
          />
          {activeLines.weight && (
            <Line
              yAxisId="weight"
              type="monotone"
              dataKey="weight"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          )}
          {activeLines.fat && (
            <Line
              yAxisId="percent"
              type="monotone"
              dataKey="fat"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          )}
          {activeLines.muscle && (
            <Line
              yAxisId="weight"
              type="monotone"
              dataKey="muscle"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
