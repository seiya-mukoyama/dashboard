"use client"

import { useEffect, useRef } from "react"

type TimelineData = {
  labels: string[]
  vonds: { packing: number[]; impact: number[] }
  opp: { packing: number[]; impact: number[] }
}

type Props = {
  data: TimelineData
  opponent: string
}

export function PackingTimelineChart({ data, opponent }: Props) {
  const packingRef = useRef<HTMLCanvasElement>(null)
  const impactRef  = useRef<HTMLCanvasElement>(null)
  const packingChart = useRef<any>(null)
  const impactChart  = useRef<any>(null)

  useEffect(() => {
    if (!data || data.labels.length === 0) return

    const loadChart = async () => {
      // @ts-ignore
      if (!window.Chart) {
        await new Promise<void>(resolve => {
          const s = document.createElement("script")
          s.src = "https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"
          s.onload = () => resolve()
          document.head.appendChild(s)
        })
      }
      // @ts-ignore
      const Chart = window.Chart

      const commonOpts = (title: string) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: "hsl(var(--foreground))", font: { size: 11 } } },
          title: { display: true, text: title, color: "hsl(var(--foreground))", font: { size: 12, weight: "600" } },
        },
        scales: {
          x: {
            ticks: { color: "hsl(var(--muted-foreground))", font: { size: 10 } },
            grid: { color: "hsl(var(--border))" },
            title: { display: true, text: "経過時間（分）", color: "hsl(var(--muted-foreground))", font: { size: 10 } },
          },
          y: {
            ticks: { color: "hsl(var(--muted-foreground))", font: { size: 10 } },
            grid: { color: "hsl(var(--border))" },
          },
        },
      })

      const makeDatasets = (v: number[], o: number[], oName: string) => [
        {
          label: "VONDS市原",
          data: v,
          borderColor: "hsl(var(--primary))",
          backgroundColor: "hsl(var(--primary) / 0.15)",
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          borderWidth: 2,
        },
        {
          label: oName,
          data: o,
          borderColor: "hsl(var(--muted-foreground))",
          backgroundColor: "hsl(var(--muted-foreground) / 0.1)",
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          borderWidth: 2,
        },
      ]

      if (packingRef.current) {
        if (packingChart.current) packingChart.current.destroy()
        packingChart.current = new Chart(packingRef.current, {
          type: "line",
          data: { labels: data.labels, datasets: makeDatasets(data.vonds.packing, data.opp.packing, opponent) },
          options: commonOpts("パッキングレート 累積推移"),
        })
      }

      if (impactRef.current) {
        if (impactChart.current) impactChart.current.destroy()
        impactChart.current = new Chart(impactRef.current, {
          type: "line",
          data: { labels: data.labels, datasets: makeDatasets(data.vonds.impact, data.opp.impact, opponent) },
          options: commonOpts("インペクト 累積推移"),
        })
      }
    }

    loadChart()

    return () => {
      packingChart.current?.destroy()
      impactChart.current?.destroy()
    }
  }, [data, opponent])

  if (!data || data.labels.length === 0) {
    return <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">タイムラインデータがありません</div>
  }

  return (
    <div className="space-y-4">
      <div className="relative h-48">
        <canvas ref={packingRef} />
      </div>
      <div className="relative h-48">
        <canvas ref={impactRef} />
      </div>
    </div>
  )
}