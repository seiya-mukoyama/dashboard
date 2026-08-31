"use client"
import { useEffect, useState } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, BarChart, Bar
} from "recharts"

type Player = {
  number: number; name: string
  distance: number; spdMx: number; seasonSpdMx: number; spdMxRatio: number
  siD: number; hiD: number; sprint: number
  hrMax: number; hrMid: number; accelZ3: number; decelZ3: number
  acute: number; chronic: number; acwr: number | null
  zone: "sweet" | "caution" | "danger" | "low" | "none"
}
type AcwrSeries = Record<string, { date: string; distance: number; acwr: number | null; zone: string }[]>

const ZONE_COLORS = {
  sweet:   { bg: "bg-green-100",  border: "border-green-400",  text: "text-green-800",  label: "スウィート", color: "#16a34a" },
  caution: { bg: "bg-yellow-100", border: "border-yellow-400", text: "text-yellow-800", label: "注意",    color: "#ca8a04" },
  danger:  { bg: "bg-red-100",    border: "border-red-400",    text: "text-red-800",    label: "過剰",    color: "#dc2626" },
  low:     { bg: "bg-blue-100",   border: "border-blue-400",   text: "text-blue-800",   label: "不足",    color: "#2563eb" },
  none:    { bg: "bg-gray-100",   border: "border-gray-300",   text: "text-gray-600",   label: "-",       color: "#9ca3af" },
}
const TARGETS = { distance: 7000, siD: 500, hiD: 300, sprint: 2, accelZ3: 5, decelZ3: 5 }

function Bar2({ label, value, target, unit = "", dec = 0 }: { label: string; value: number; target: number; unit?: string; dec?: number }) {
  const pct = Math.min(100, (value / target) * 100)
  const ok = value >= target
  return (
    <div className="mb-1.5">
      <div className="flex justify-between text-[11px] mb-0.5">
        <span className="text-muted-foreground">{label}</span>
        <span className={ok ? "text-green-700 font-semibold" : "text-foreground"}>
          {value.toFixed(dec)}{unit} <span className="text-muted-foreground text-[10px]">/{target}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={ok ? "h-full rounded-full bg-green-500" : "h-full rounded-full bg-yellow-400"} style={{ width: pct + "%" }} />
      </div>
    </div>
  )
}

function PlayerCard({ p, sel, onClick }: { p: Player; sel: boolean; onClick: () => void }) {
  const z = ZONE_COLORS[p.zone]
  return (
    <div onClick={onClick} className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${z.bg} ${z.border} ${sel ? "ring-2 ring-primary ring-offset-1" : ""}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-sm">{p.name}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${z.bg} ${z.border} ${z.text}`}>
          {z.label} {p.acwr !== null ? p.acwr.toFixed(2) : "-"}
        </span>
      </div>
      <Bar2 label="総走行距離" value={p.distance} target={TARGETS.distance} unit="m" />
      <Bar2 label="中強度 SI" value={p.siD} target={TARGETS.siD} unit="m" />
      <Bar2 label="高強度 HI" value={p.hiD} target={TARGETS.hiD} unit="m" />
      <Bar2 label="スプリント" value={p.sprint} target={TARGETS.sprint} unit="回" />
      <div className="grid grid-cols-2 gap-2 mt-1">
        <Bar2 label="高加速 Z3" value={p.accelZ3} target={TARGETS.accelZ3} unit="回" />
        <Bar2 label="高減速 Z3" value={p.decelZ3} target={TARGETS.decelZ3} unit="回" />
      </div>
      <div className="grid grid-cols-3 gap-1 mt-2 text-center text-[11px]">
        <div><div className="text-muted-foreground">最高速度比</div>
          <div className={`font-bold ${p.spdMxRatio >= 95 ? "text-green-700" : ""}`}>{p.spdMxRatio.toFixed(1)}%</div></div>
        <div><div className="text-muted-foreground">HR最大</div><div className="font-bold">{p.hrMax || "-"}</div></div>
        <div><div className="text-muted-foreground">HR中央</div><div className="font-bold">{p.hrMid || "-"}</div></div>
      </div>
    </div>
  )
}

export default function ConditionPage() {
  const [latest, setLatest] = useState<{ date: string; players: Player[] } | null>(null)
  const [series, setSeries] = useState<AcwrSeries>({})
  const [sel, setSel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"list" | "acwr" | "compare">("list")

  useEffect(() => {
    Promise.all([
      fetch("/api/condition?action=latest").then(r => r.json()),
      fetch("/api/condition?action=acwr").then(r => r.json()),
    ]).then(([lat, acwr]) => {
      setLatest(lat)
      setSeries(acwr.series ?? {})
      if (lat.players?.[0]) setSel(lat.players[0].name)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">読み込み中...</div>
  if (!latest || !latest.players?.length) return <div className="p-8 text-muted-foreground">データがありません</div>

  const selP = latest.players.find(p => p.name === sel)
  const acwrData = sel ? (series[sel] ?? []).map(s => ({ date: s.date, ACWR: s.acwr })) : []
  const zones: Record<string, number> = { sweet: 0, caution: 0, danger: 0, low: 0 }
  latest.players.forEach(p => { if (p.zone in zones) zones[p.zone]++ })

  return (
    <div className="p-4 space-y-4 max-w-6xl">
      {/* ヘッダー */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">コンディション管理</h1>
          <p className="text-sm text-muted-foreground">
            {latest.date.replace(/(d{4})(d{2})(d{2})/, "$1年$2月$3日")} 練習データ
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["sweet","caution","danger","low"] as const).map(k => (
            <div key={k} className={`px-2 py-1 rounded-full text-xs border ${ZONE_COLORS[k].bg} ${ZONE_COLORS[k].border} ${ZONE_COLORS[k].text}`}>
              {ZONE_COLORS[k].label} {zones[k] ?? 0}名
            </div>
          ))}
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-2">
        {[{k:"list",l:"選手一覧"},{k:"acwr",l:"ACWR推移"},{k:"compare",l:"目標vs実績"}].map(({k,l}) => (
          <button key={k} onClick={() => setTab(k as "list"|"acwr"|"compare")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab===k ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* 選手一覧 */}
      {tab === "list" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {latest.players.map(p => (
            <PlayerCard key={p.name} p={p} sel={sel===p.name} onClick={() => setSel(p.name)} />
          ))}
        </div>
      )}

      {/* ACWR推移 */}
      {tab === "acwr" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {latest.players.map(p => {
              const z = ZONE_COLORS[p.zone]
              return (
                <button key={p.name} onClick={() => setSel(p.name)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${sel===p.name ? "bg-primary text-white border-primary" : `${z.bg} ${z.border} ${z.text}`}`}>
                  {p.name}
                </button>
              )
            })}
          </div>
          {selP && (
            <div className="bg-card rounded-xl border p-4">
              <h3 className="font-semibold mb-1">{selP.name} — ACWR推移</h3>
              <p className="text-xs text-muted-foreground mb-3">スウィート: 0.8〜1.3 / 注意: 1.3〜1.5 / 過剰: 1.5以上 / 不足: 0.8未満</p>
              {acwrData.length > 1 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={acwrData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 2]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <ReferenceLine y={0.8} stroke="#3b82f6" strokeDasharray="4 4" />
                    <ReferenceLine y={1.3} stroke="#eab308" strokeDasharray="4 4" />
                    <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="ACWR" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  現在1日分のデータです。シートを追加すると推移が表示されます。
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 目標vs実績 */}
      {tab === "compare" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {latest.players.map(p => (
              <button key={p.name} onClick={() => setSel(p.name)}
                className={`px-3 py-1 rounded-full text-xs border ${sel===p.name ? "bg-primary text-white border-primary" : "bg-muted text-muted-foreground"}`}>
                {p.name}
              </button>
            ))}
          </div>
          {selP && (
            <div className="bg-card rounded-xl border p-4">
              <h3 className="font-semibold mb-3">{selP.name} — 目標 vs 実績</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart margin={{ top: 10, right: 20, bottom: 30, left: 0 }}
                  data={[
                    { name: "総走行(m)", 実績: selP.distance, 目標: TARGETS.distance },
                    { name: "SI(m)", 実績: selP.siD, 目標: TARGETS.siD },
                    { name: "HI(m)", 実績: selP.hiD, 目標: TARGETS.hiD },
                    { name: "スプリント", 実績: selP.sprint, 目標: TARGETS.sprint },
                    { name: "高加速", 実績: selP.accelZ3, 目標: TARGETS.accelZ3 },
                    { name: "高減速", 実績: selP.decelZ3, 目標: TARGETS.decelZ3 },
                  ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="実績" fill="#22c55e" radius={[4,4,0,0]} />
                  <Bar dataKey="目標" fill="rgba(148,163,184,0.4)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
