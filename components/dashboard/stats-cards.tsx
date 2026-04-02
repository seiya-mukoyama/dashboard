"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Trophy, Target, Shield, Activity, Zap, Timer, ArrowUp, ArrowDown, Gauge } from "lucide-react"

// Knowsチーム統計カード
const KNOWS_ITEMS = [
  { key: "dist",         label: "走行距離",   unit: "m",      icon: Activity, color: "text-blue-500" },
  { key: "sprt",         label: "スプリント",  unit: "回",     icon: Zap,      color: "text-pink-500" },
  { key: "hi_rate",      label: "HI Rate",    unit: "%",      icon: Timer,    color: "text-orange-500" },
  { key: "accel_all",    label: "総加速数",    unit: "回",     icon: ArrowUp,  color: "text-green-500" },
  { key: "si_rate",      label: "SI Rate",    unit: "%",      icon: ArrowDown, color: "text-purple-500" },
  { key: "dist_per_min", label: "DIST/min",   unit: "m/min",  icon: Gauge,    color: "text-yellow-500" },
]

function fmt(v: number | null | undefined, key: string): string {
  if (v == null) return "—"
  if (key === "dist") return Math.round(v).toLocaleString()
  if (key === "dist_per_min" || key === "hi_rate" || key === "si_rate") return v.toFixed(1)
  return Math.round(v).toString()
}

function KnowsStatsSection() {
  const [latest, setLatest] = useState<Record<string, number> | null>(null)
  const [range, setRange] = useState<{ stdate: string; eddate: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch('/api/knows-stats')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        setLatest(d.latest)
        setRange(d.range)
      })
      .catch(() => setError("取得エラー"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Knowsチーム統計</h3>
        {range && (
          <span className="text-xs text-muted-foreground">{range.stdate} 〜 {range.eddate}</span>
        )}
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">読み込み中...</div>
      ) : error ? (
        <div className="flex items-center justify-center h-16 text-destructive text-sm">{error}</div>
      ) : !latest ? (
        <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">データがありません</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {KNOWS_ITEMS.map(({ key, label, unit, icon: Icon, color }) => (
            <Card key={key} className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
                <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className={`h-3.5 w-3.5 ${color}`} />
              </CardHeader>
              <CardContent className="pb-3 px-3">
                <div className={`text-xl font-bold ${color}`}>
                  {fmt(latest[key], key)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{unit}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export function StatsCards() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setData).catch(() => {})
  }, [])

  const stats = data ? [
    { title: "総得点",       value: data.matches?.reduce((s: number, m: any) => s + m.goalsFor, 0) ?? "-",  sub: `平均 ${data.averages?.goalsFor?.toFixed(1) ?? "-"}点/試合`, icon: Target },
    { title: "勝利数",       value: data.wins ?? "-",   sub: `${data.draws ?? 0}分 ${data.losses ?? 0}敗`, icon: Trophy },
    { title: "クリーンシート", value: data.matches?.filter((m: any) => m.goalsAgainst === 0).length ?? "-", sub: "無失点試合", icon: Shield },
    { title: "平均パッキング", value: data.averages?.packingRate?.toFixed(1) ?? "-", sub: `${data.matches?.length ?? 0}試合`, icon: Activity },
  ] : [
    { title: "総得点",       value: "-", sub: "読み込み中...", icon: Target },
    { title: "勝利数",       value: "-", sub: "読み込み中...", icon: Trophy },
    { title: "クリーンシート", value: "-", sub: "読み込み中...", icon: Shield },
    { title: "平均パッキング", value: "-", sub: "読み込み中...", icon: Activity },
  ]

  return (
    <div className="space-y-6">
      {/* 試合成績 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span className="text-muted-foreground">{stat.sub}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Knowsチーム統計 */}
      <KnowsStatsSection />
    </div>
  )
}
