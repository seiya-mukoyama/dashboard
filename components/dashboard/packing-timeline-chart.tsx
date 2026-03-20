"use client"

import { useEffect, useRef } from "react"
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip,
} from "chart.js"

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip)

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

function HalfChart({ half, opponent }: { half: HalfData; opponent: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef  = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    chartRef.current?.destroy()

    const GREEN     = 'rgb(34,197,94)'
    const GREEN_DIM = 'rgba(34,197,94,0.45)'
    const GRAY      = 'rgb(148,163,184)'
    const GRAY_DIM  = 'rgba(148,163,184,0.4)'

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: half.labels,
        datasets: [
          { label: 'VONDS パッキング',        data: half.vonds.packing, borderColor: GREEN,     backgroundColor: 'transparent', borderWidth: 2,   pointRadius: 0, tension: 0 },
          { label: 'VONDS インペクト',        data: half.vonds.impact,  borderColor: GREEN_DIM, backgroundColor: 'transparent', borderWidth: 1.5, pointRadius: 0, tension: 0, borderDash: [4, 3] },
          { label: `${opponent} パッキング`, data: half.opp.packing,   borderColor: GRAY,      backgroundColor: 'transparent', borderWidth: 2,   pointRadius: 0, tension: 0 },
          { label: `${opponent} インペクト`, data: half.opp.impact,    borderColor: GRAY_DIM,  backgroundColor: 'transparent', borderWidth: 1.5, pointRadius: 0, tension: 0, borderDash: [4, 3] },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { boxWidth: 20, padding: 10, font: { size: 10 }, color: 'rgb(148,163,184)' }
          },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: {
            ticks: { font: { size: 10 }, color: 'rgb(148,163,184)', maxRotation: 0 },
            grid:  { color: 'rgba(148,163,184,0.1)' },
            title: { display: true, text: '経過時間', font: { size: 10 }, color: 'rgb(148,163,184)' }
          },
          y: {
            beginAtZero: true,
            ticks: { font: { size: 10 }, color: 'rgb(148,163,184)' },
            grid:  { color: 'rgba(148,163,184,0.1)' }
          }
        }
      }
    })
    return () => { chartRef.current?.destroy() }
  }, [half, opponent])

  return (
    <div>
      {half.label && (
        <p className="text-xs font-semibold text-muted-foreground mb-2">{half.label}</p>
      )}
      <div style={{ height: 320 }}>
        <canvas ref={canvasRef} />
      </div>
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