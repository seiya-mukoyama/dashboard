"use client"
import { useEffect, useState } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, BarChart, Bar
} from "recharts"

type Player = {
  number: string; name: string; date: string
  distance: number; si: number; hi: number; sprint: number
  accel: number; decel: number; spdRatio: number
  hrMax: number; hrMid: number; acwr: number | null; acwrZone: string
}
type ACWRPoint = { date: string; acwr: number | null; zone: string }
type ConditionData = {
  latestDate: string; sessions: string[]
  players: Player[]
  acwrTimeline: Record<string, ACWRPoint[]>
  spdTarget: number
}

const ZONE_COLORS = {
  sweet:   { bg: "bg-green-100",  border: "border-green-400",  text: "text-green-700",  label: "スウィート✅", line: "#22c55e" },
  caution: { bg: "bg-yellow-100", border: "border-yellow-400", text: "text-yellow-700", label: "注意🟡",     line: "#eab308" },
  over:    { bg: "bg-red-100",    border: "border-red-400",    text: "text-red-700",    label: "過割🔴",     line: "#ef4444" },
  under:   { bg: "bg-blue-100",   border: "border-blue-400",   text: "text-blue-700",   label: "不足🔵",     line: "#3b82f6" },
  unknown: { bg: "bg-gray-100",   border: "border-gray-300",   text: "text-gray-500",   label: "データなし", line: "#9ca3af" },
}

const TARGETS = {
  distance: 7000, si: 500, hi: 300, sprint: 2,
  accel: 5, decel: 5, spdRatio: 85, hrMax: 185, hrMid: 130
}

const METRICS = [
  { key: "distance", label: "総走行距離",         unit: "m",   target: TARGETS.distance },
  { key: "si",       label: "中強度ラン (SI)",    unit: "m",   target: TARGETS.si },
  { key: "hi",       label: "高強度ラン (HI)",    unit: "m",   target: TARGETS.hi },
  { key: "sprint",   label: "スプリント回数",       unit: "回",  target: TARGETS.sprint },
  { key: "accel",    label: "高加速 (Z3)",          unit: "回",  target: TARGETS.accel },
  { key: "decel",    label: "高減速 (Z3)",          unit: "回",  target: TARGETS.decel },
  { key: "spdRatio", label: "最高速度比",           unit: "%",   target: TARGETS.spdRatio },
  { key: "hrMax",    label: "心拍最大",            unit: "bpm", target: null },
  { key: "hrMid",    label: "心拍中央",            unit: "bpm", target: null },
]

function fmt(val: number, unit: string) {
  if (unit === "m") return val.toFixed(0) + " m"
  if (unit === "%") return val.toFixed(1) + " %"
  return val.toFixed(0) + " " + unit
}

function formatDate(d: string) {
  if (d.length === 8) return d.slice(0, 4) + "/" + d.slice(4, 6) + "/" + d.slice(6, 8)
  return d
}

export default function ConditionPage() {
  const [data, setData] = useState<ConditionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [tab, setTab] = useState<"list" | "player">("list")

  useEffect(() => {
    fetch("/api/condition").then(r => r.json()).then(d => {
      setData(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-96 text-muted-foreground">
      データ読み込み中...
    </div>
  )
  if (!data || data.players.length === 0) return (
    <div className="flex items-center justify-center h-96 text-muted-foreground">
      コンディションデータがありません。スプレッドシートにCSVを追加してください。
    </div>
  )

  const selectedPlayer = selected ? data.players.find(p => p.name === selected) : null
  const selectedTimeline = selected ? (data.acwrTimeline[selected] ?? []) : []

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">コンディション管理</h1>
          <p className="text-sm text-muted-foreground">最新データ: {formatDate(data.latestDate)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab("list")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "list" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            選手一覧
          </button>
          <button onClick={() => { setTab("player"); if (!selected) setSelected(data.players[0]?.name ?? null) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "player" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            選手詳細
          </button>
        </div>
      </div>

      {/* 選手一覧タブ */}
      {tab === "list" && (
        <div className="space-y-3">
          {data.players.map(p => {
            const z = ZONE_COLORS[p.acwrZone as keyof typeof ZONE_COLORS] ?? ZONE_COLORS.unknown
            return (
              <div key={p.name}
                className={`rounded-xl border-2 ${z.border} ${z.bg} p-4 cursor-pointer hover:opacity-90 transition-opacity`}
                onClick={() => { setSelected(p.name); setTab("player") }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-6">{p.number}</span>
                    <span className="font-semibold text-foreground">{p.name}</span>
                    <span className={`text-sm font-bold ${z.text}`}>{z.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">ACWR </span>
                    <span className={`text-lg font-bold ${z.text}`}>
                      {p.acwr != null ? p.acwr.toFixed(2) : "-"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-9 gap-2 text-xs">
                  {METRICS.map(m => {
                    const val = p[m.key as keyof Player] as number
                    const ok = m.target == null || val >= m.target
                    return (
                      <div key={m.key} className="text-center">
                        <div className="text-muted-foreground truncate">{m.label}</div>
                        <div className={`font-bold ${m.target != null ? (ok ? "text-green-600" : "text-red-500") : "text-foreground"}`}>
                          {fmt(val, m.unit)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 選手詳細タブ */}
      {tab === "player" && (
        <div className="space-y-6">
          {/* 選手選択 */}
          <div className="flex gap-2 flex-wrap">
            {data.players.map(p => (
              <button key={p.name}
                onClick={() => setSelected(p.name)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${selected === p.name ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {p.name}
              </button>
            ))}
          </div>

          {selectedPlayer && (
            <>
              {/* ヘッダー */}
              {(() => {
                const z = ZONE_COLORS[selectedPlayer.acwrZone as keyof typeof ZONE_COLORS] ?? ZONE_COLORS.unknown
                return (
                  <div className={`rounded-xl border-2 ${z.border} ${z.bg} p-4 flex items-center justify-between`}>
                    <div>
                      <span className="text-lg font-bold text-foreground">{selectedPlayer.name}</span>
                      <span className={`ml-3 text-base font-bold ${z.text}`}>{z.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">ACWR</div>
                      <div className={`text-3xl font-bold ${z.text}`}>
                        {selectedPlayer.acwr != null ? selectedPlayer.acwr.toFixed(2) : "-"}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* 目標vs実績棒グラフ */}
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">目標値 vs 実績値</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={METRICS.filter(m => m.target != null).map(m => ({
                    name: m.label,
                    実績: selectedPlayer[m.key as keyof Player] as number,
                    目標: m.target!,
                    unit: m.unit,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip formatter={(v: number, n: string, item: any) => [fmt(v, item.payload.unit), n]} />
                    <Legend />
                    <Bar dataKey="実績" fill="#22c55e" radius={[4,4,0,0]} />
                    <Bar dataKey="目標" fill="#e5e7eb" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* ACWR時系列グラフ */}
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-1">ACWR時系列</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  スウィート: 0.8−1.3 │ 注意: 1.3−1.5 │ 過割: 1.5以上 │ 不足: 0.8未満
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={selectedTimeline.map(t => ({
                    date: formatDate(t.date),
                    ACWR: t.acwr,
                    zone: t.zone,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis domain={[0, 2]} tick={{ fontSize: 9 }} />
                    <Tooltip formatter={(v: number) => [v?.toFixed(2), "ACWR"]} />
                    <ReferenceLine y={0.8} stroke="#3b82f6" strokeDasharray="4 2" label={{ value: "0.8", fontSize: 9 }} />
                    <ReferenceLine y={1.3} stroke="#22c55e" strokeDasharray="4 2" label={{ value: "1.3", fontSize: 9 }} />
                    <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="4 2" label={{ value: "1.5", fontSize: 9 }} />
                    <Line type="monotone" dataKey="ACWR" stroke="#1E5C3A" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 各指標カード */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {METRICS.map(m => {
                  const val = selectedPlayer[m.key as keyof Player] as number
                  const ok = m.target == null || val >= m.target
                  const pct = m.target ? Math.min((val / m.target) * 100, 150) : null
                  return (
                    <div key={m.key} className="rounded-xl border border-border bg-card p-3">
                      <div className="text-xs text-muted-foreground mb-1">{m.label}</div>
                      <div className={`text-xl font-bold ${m.target != null ? (ok ? "text-green-600" : "text-red-500") : "text-foreground"}`}>
                        {fmt(val, m.unit)}
                      </div>
                      {m.target && (
                        <>
                          <div className="text-xs text-muted-foreground mt-1">目標: {fmt(m.target, m.unit)}</div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                            <div className={`h-1.5 rounded-full ${ok ? "bg-green-500" : "bg-red-400"}`}
                              style={{ width: `${Math.min(pct ?? 0, 100)}%` }} />
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
