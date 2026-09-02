// @ts-nocheck
"use client"
import { useEffect, useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, ReferenceLine
} from "recharts"

type Player = {
  number: number; name: string; days: number
  distance: number; spdMx: number; seasonSpdMx: number; spdMxRatio: number
  siD: number; hiD: number; sprint: number
  hrMax: number; hrMid: number; accelZ3: number; decelZ3: number
  acwr: number | null; zone: "sweet"|"caution"|"danger"|"low"|"none"
  acwrSI?: number | null; zoneSI?: "sweet"|"caution"|"danger"|"low"|"none"
  playerPastAvg?: Record<string, number>
}
type WeekTarget = {
  week: number
  day1: string; day2: string; day3: string; day4: string; game: string; recovery: string
  distance: number; siD: number; hiD: number; sprint: number; accelZ3: number; decelZ3: number
}
type DayData = { date: string; dayNum: number; data: Record<string, number> | null }
type WeeklyData = { week: WeekTarget; days: DayData[] }
type PlayerDetail = {
  playerName: string; currentWeek: WeekTarget | null
  currentWeekDays: DayData[]; weeklyData: WeeklyData[]
  pastAvg: Record<string, number>
  allWeeks?: {week:number;day1:string;game:string}[]
}
type AcwrSeries = Record<string, { date: string; acwr: number | null; zone: string }[]>

const ZONE = {
  sweet:   { bg: "bg-green-100",  border: "border-green-400",  text: "text-green-800",  label: "スウィート" },
  caution: { bg: "bg-yellow-100", border: "border-yellow-400", text: "text-yellow-800", label: "注意" },
  danger:  { bg: "bg-red-100",    border: "border-red-400",    text: "text-red-800",    label: "過剰" },
  low:     { bg: "bg-blue-100",   border: "border-blue-400",   text: "text-blue-800",   label: "不足" },
  none:    { bg: "bg-gray-100",   border: "border-gray-300",   text: "text-gray-600",   label: "-" },
}
const METRICS = [
  { key: "distance", label: "総走行距離", unit: "m", tKey: "distance" },
  { key: "siD",      label: "中強度 SI",   unit: "m", tKey: "siD" },
  { key: "hiD",      label: "高強度 HI",   unit: "m", tKey: "hiD" },
  { key: "sprint",   label: "スプリント",   unit: "回", tKey: "sprint" },
  { key: "accelZ3",  label: "高加速 Z3",  unit: "回", tKey: "accelZ3" },
  { key: "decelZ3",  label: "高減速 Z3",  unit: "回", tKey: "decelZ3" },
]

function fmtDate(s: string) { return s.replace(/(\d{4})(\d{2})(\d{2})/, "$2/$3") }

function Bar2({ label, value, target, avg, unit="" }: { label: string; value: number; target: number; avg?: number; unit?: string }) {
  const pct = target > 0 ? Math.min(100, (value/target)*100) : 0
  const ok = value >= target
  return (
    <div className="mb-1.5">
      <div className="flex justify-between text-[11px] mb-0.5">
        <span className="text-muted-foreground">{label}</span>
        <span className={ok ? "text-green-700 font-semibold" : ""}>
          {Math.round(value)}{unit}{avg !== undefined && avg > 0 ? <span className="text-muted-foreground text-[10px] ml-1">(平{Math.round(avg)}{unit})</span> : null}<span className="text-muted-foreground text-[10px]"> /{target}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden relative">
        <div className={ok ? "h-full bg-green-500 rounded-full" : "h-full bg-yellow-400 rounded-full"} style={{ width: pct+"%" }} />
      </div>
    </div>
  )
}

// 選手カード（一覧表示用）
function PlayerCard({ p, sel, onClick, wt }: { p: Player; sel: boolean; onClick: () => void; wt: WeekTarget | null }) {
  const z = ZONE[p.zone]
  return (
    <div onClick={onClick} className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${z.bg} ${z.border} ${sel ? "ring-2 ring-primary ring-offset-1" : ""}`}>
      <div className="flex justify-between items-center mb-2">
        <div><span className="font-semibold text-sm">{p.name}</span>
          <span className="text-[10px] text-muted-foreground ml-1">{p.days}日間</span></div>
        <div className="flex gap-1">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${z.bg} ${z.border} ${z.text}`} title="総走行距離ACWR">
            距{z.label} {p.acwr?.toFixed(2) ?? "-"}
          </span>
          {p.acwrSI !== undefined && p.zoneSI && (() => {
            const zsi = ZONE[p.zoneSI]
            return <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${zsi.bg} ${zsi.border} ${zsi.text}`} title="SI ACWR">
              SI{zsi.label} {p.acwrSI?.toFixed(2) ?? "-"}
            </span>
          })()}
        </div>
      </div>
      {METRICS.map(m => (
        <Bar2 key={m.key} label={m.label} value={(p as Record<string,number>)[m.key]||0} target={wt ? ((wt as unknown as Record<string,number>)[m.tKey]||0) : 0} avg={p.playerPastAvg?.[m.key]} unit={m.unit} />
      ))}
      <div className="grid grid-cols-3 gap-1 mt-2 text-center text-[11px]">
        <div><div className="text-muted-foreground">最高速度比</div>
          <div className={`font-bold ${p.spdMxRatio>=95?"text-green-700":""}`}>{p.spdMxRatio.toFixed(1)}%</div></div>
        <div><div className="text-muted-foreground">HR最大</div><div className="font-bold">{p.hrMax||"-"}</div></div>
        <div><div className="text-muted-foreground">HR中央</div><div className="font-bold">{p.hrMid||"-"}</div></div>
      </div>
    </div>
  )
}

// 選手詳細ビュー
function PlayerDetailView({ playerName, wt, onBack }: { playerName: string; wt: WeekTarget | null; onBack: () => void }) {
  const [detail, setDetail] = useState<PlayerDetail | null>(null)
  const [acwrSer, setAcwrSer] = useState<{ date: string; ACWR: number|null }[]>([])
  const [loading, setLoading] = useState(true)
  const [detailTab, setDetailTab] = useState<"week"|"day"|"history">("week")
  const [selectedDetailWeek, setSelectedDetailWeek] = useState<number|null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/condition?action=player&name=${encodeURIComponent(playerName)}${selectedDetailWeek ? "&week="+selectedDetailWeek : ""}`).then(r => r.json()),
      fetch(`/api/condition?action=acwr`).then(r => r.json()),
    ]).then(([d, acwr]: [PlayerDetail, {series: AcwrSeries}]) => {
      setDetail(d)
      const ser = acwr.series?.[playerName] ?? []
      setAcwrSer(ser.map(s => ({ date: s.date, ACWR: s.acwr, ACWRSI: s.acwrSI ?? null })))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [playerName, selectedDetailWeek])

  if (loading) return <div className="p-8 text-muted-foreground">読み込み中...</div>
  if (!detail) return <div className="p-8 text-muted-foreground">データなし</div>

  const days = detail.currentWeekDays
  const past = detail.pastAvg

  // Day別チャート用データ
  const dayChartData = days.map(d => ({
    name: `Day${d.dayNum}\n${fmtDate(d.date)}`,
    ...Object.fromEntries(METRICS.map(m => [m.label, d.data ? Math.round((d.data as Record<string,number>)[m.key]||0) : 0]))
  }))

  // 週別履歴チャート: 各週の累計値
  const weekHistChart = detail.weeklyData.map(w => {
    const totals: Record<string, number> = {}
    for (const m of METRICS) {
      totals[m.label] = Math.round(w.days.reduce((s, d) => s + ((d.data as Record<string,number>|null)?.[m.key]||0), 0))
    }
    return { name: `W${w.week.week}`, ...totals }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          ← 一覧に戻る
        </button>
        <span className="font-bold text-lg">{playerName}</span>
        {wt && <span className="text-sm text-muted-foreground">Week{wt.week}</span>}
        {(detail?.allWeeks) && (detail?.allWeeks)!.length > 1 && (
          <select value={selectedDetailWeek ?? detail?.currentWeek?.week ?? ""}
            onChange={e => { setSelectedDetailWeek(Number(e.target.value)); setDetail(null); setLoading(true) }}
            className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground">
            {(detail?.allWeeks ?? []).map(w => <option key={w.week} value={w.week}>Week{w.week} ({w.day1.slice(4,6)}/{w.day1.slice(6,8)}〜)</option>)}
          </select>
        )}
      </div>

      {/* タブ */}
      <div className="flex gap-2">
        {[{k:"week",l:"週目標 vs 実績"},{k:"day",l:"Day別"},{k:"history",l:"週別履歴"}].map(({k,l}) => (
          <button key={k} onClick={() => setDetailTab(k as "week"|"day"|"history")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${detailTab===k ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* 週目標 vs 実績 + 過去平均 */}
      {detailTab === "week" && wt && (
        <div className="space-y-3">
          <div className="bg-card rounded-xl border p-4">
            <h3 className="font-semibold mb-3 text-sm">Week{wt.week}目標 vs 実績累計　過去平均(同時期)</h3>
            <div className="grid gap-1.5">
              {METRICS.map(m => {
                const val = days.reduce((s,d) => s + ((d.data as Record<string,number>|null)?.[m.key]||0), 0)
                const target = (wt as Record<string,number>)[m.tKey] || 0
                const avg = past[m.key] || 0
                return (
                  <div key={m.key} className="grid grid-cols-[120px_1fr_80px_80px] items-center gap-2 text-sm">
                    <span className="text-muted-foreground text-xs">{m.label}</span>
                    <div className="h-2 bg-muted rounded-full overflow-hidden relative">
                      <div className="h-full bg-primary/80 rounded-full transition-all"
                        style={{ width: target>0 ? Math.min(100,(Math.round(val)/target)*100)+"%" : "0%" }} />
                      {avg > 0 && target > 0 && (
                        <div className="absolute top-0 h-full w-0.5 bg-orange-400"
                          style={{ left: Math.min(100,(avg/target)*100)+"%" }} />
                      )}
                    </div>
                    <span className={`text-xs text-right font-medium ${Math.round(val)>=target?"text-green-700":""}`}>
                      {Math.round(val)}{m.unit}
                    </span>
                    <span className="text-xs text-muted-foreground text-right">
                      平均{Math.round(avg)}{m.unit}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">オレンジの縦線 = 過去平均値　バーの終点 = 目標値</p>
          </div>
        </div>
      )}

      {/* Day別 */}
      {detailTab === "day" && (
        <div className="space-y-3">
          {/* Day別カード */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {days.map(d => (
              <div key={d.date} className="bg-card rounded-xl border p-3">
                <div className="font-semibold text-sm mb-2">Day{d.dayNum} <span className="text-xs text-muted-foreground">{fmtDate(d.date)}</span></div>
                {d.data ? METRICS.map(m => (
                  <div key={m.key} className="flex justify-between text-xs mb-0.5">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-medium">{Math.round((d.data as Record<string,number>)[m.key]||0)}{m.unit}</span>
                  </div>
                )) : <p className="text-xs text-muted-foreground">データなし</p>}
              </div>
            ))}
            {days.length === 0 && <p className="text-sm text-muted-foreground col-span-4">今週のデータなし</p>}
          </div>
          {/* Day別棒グラフ */}
          {dayChartData.length > 0 && (
            <div className="bg-card rounded-xl border p-4">
              <h3 className="font-semibold mb-3 text-sm">Day別走行距離</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dayChartData} margin={{ top:5, right:10, bottom:5, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="総走行距離" fill="#22c55e" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* 週別履歴 */}
      {detailTab === "history" && (
        <div className="space-y-3">
          {/* 距離ACWR */}
          {acwrSer.length > 1 && (
            <div className="bg-card rounded-xl border p-4">
              <h3 className="font-semibold mb-2 text-sm">総走距離 ACWR推移</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={acwrSer} margin={{ top:5, right:10, bottom:5, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis domain={[0,2]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <ReferenceLine y={0.8} stroke="#3b82f6" strokeDasharray="4 4" />
                  <ReferenceLine y={1.3} stroke="#eab308" strokeDasharray="4 4" />
                  <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="ACWR" stroke="#22c55e" strokeWidth={2} dot={{ r:3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* SI ACWR */}
          {acwrSer.length > 1 && (
            <div className="bg-card rounded-xl border p-4">
              <h3 className="font-semibold mb-2 text-sm">中強度SI ACWR推移</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={acwrSer} margin={{ top:5, right:10, bottom:5, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis domain={[0,2]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <ReferenceLine y={0.8} stroke="#3b82f6" strokeDasharray="4 4" />
                  <ReferenceLine y={1.3} stroke="#eab308" strokeDasharray="4 4" />
                  <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="ACWRSI" stroke="#f59e0b" strokeWidth={2} dot={{ r:3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* 週別グラフ 6枚 */}
          {[
            { key: "distance", label: "週別総走行距離", color: "#22c55e", unit: "m" },
            { key: "siD", label: "週別中強度 SI", color: "#3b82f6", unit: "m" },
            { key: "hiD", label: "週別高強度 HI", color: "#8b5cf6", unit: "m" },
            { key: "sprint", label: "週別スプリント", color: "#f59e0b", unit: "回" },
            { key: "accelZ3", label: "週別高加速 Z3", color: "#ef4444", unit: "回" },
            { key: "decelZ3", label: "週別高減速 Z3", color: "#ec4899", unit: "回" },
          ].map(({ key, label, color, unit }) => (
            <div key={key} className="bg-card rounded-xl border p-4">
              <h3 className="font-semibold mb-2 text-sm">{label}</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weekHistChart} margin={{ top:5, right:10, bottom:5, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [`${v}${unit}`, label]} />
                  <Bar dataKey={key} fill={color} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// メインコンポーネント
export default function ConditionContent() {
  const [data, setData] = useState<{ date: string; weekDays: number; currentWeek: WeekTarget|null; players: Player[]; allWeeks?: {week:number;day1:string;game:string}[]; teamPastAvg?: Record<string,number> }|null>(null)
  const [series, setSeries] = useState<AcwrSeries>({})
  const [selPlayer, setSelPlayer] = useState<string|null>(null)
  const [selectedWeek, setSelectedWeek] = useState<number|null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"list"|"acwr">("list")

  useEffect(() => {
    Promise.all([
      fetch(`/api/condition?action=latest${selectedWeek ? "&week="+selectedWeek : ""}`).then(r => r.json()),
      fetch("/api/condition?action=acwr").then(r => r.json()),
    ]).then(([lat, acwr]) => {
      setData(lat); setSeries(acwr.series ?? {})
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [selectedWeek])

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">読み込み中...</div>
  if (!data || !data.players?.length) return <div className="p-8 text-muted-foreground">データなし</div>

  const wt = data.currentWeek
  const zones: Record<string, number> = { sweet:0, caution:0, danger:0, low:0 }
  data.players.forEach(p => { if (p.zone in zones) zones[p.zone]++ })

  // 選手詳細ビュー
  if (selPlayer) {
    return (
      <div className="p-4 max-w-4xl">
        <PlayerDetailView playerName={selPlayer} wt={wt} onBack={() => setSelPlayer(null)} />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 max-w-6xl">
      {/* ヘッダ */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {wt && <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-base">Week {wt.week}</span>
            {data?.allWeeks && data.allWeeks.length > 1 && (
              <select
                value={selectedWeek ?? data.currentWeek?.week ?? ""}
                onChange={e => { setSelectedWeek(Number(e.target.value)); setLoading(true) }}
                className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground ml-2">
                {data.allWeeks.map(w => (
                  <option key={w.week} value={w.week}>
                    Week{w.week} ({w.day1.slice(4,6)}/{w.day1.slice(6,8)}〜)
                  </option>
                ))}
              </select>
            )}
            <span className="text-sm text-muted-foreground">
              {wt.day1.replace(/(\d{4})(\d{2})(\d{2})/, "$2/$3")} → {wt.game.replace(/(\d{4})(\d{2})(\d{2})/, "$2/$3")}(試合)
            </span>
          </div>}
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              週累計 {data.weekDays}日/4日
            </span>
            <span className="text-xs text-muted-foreground">最終: {data.date.replace(/(\d{4})(\d{2})(\d{2})/, "$1/$2/$3")}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["sweet","caution","danger","low"] as const).map(k => (
            <div key={k} className={`px-2 py-1 rounded-full text-xs border ${ZONE[k].bg} ${ZONE[k].border} ${ZONE[k].text}`}>
              {ZONE[k].label} {zones[k]??0}名
            </div>
          ))}
        </div>
      </div>

      {wt && (
        <div className="bg-muted/50 rounded-lg px-4 py-2 text-xs flex flex-wrap gap-4">
          <span className="font-semibold text-foreground">Week{wt.week}目標:</span>
          <span>距離 {wt.distance.toLocaleString()}m <span className="opacity-60">(平{data?.teamPastAvg?.distance??0}m)</span></span>
          <span>SI {wt.siD.toLocaleString()}m <span className="opacity-60">(平{data?.teamPastAvg?.siD??0}m)</span></span>
          <span>HI {wt.hiD.toLocaleString()}m <span className="opacity-60">(平{data?.teamPastAvg?.hiD??0}m)</span></span>
          <span>Sprint {wt.sprint}回 <span className="opacity-60">(平{data?.teamPastAvg?.sprint??0}回)</span></span>
          <span>高加速 {wt.accelZ3}回 <span className="opacity-60">(平{data?.teamPastAvg?.accelZ3??0}回)</span></span>
          <span>高減速 {wt.decelZ3}回 <span className="opacity-60">(平{data?.teamPastAvg?.decelZ3??0}回)</span></span>
        </div>
      )}

      {/* タブ */}
      <div className="flex gap-2">
        {[{k:"list",l:"選手一覧"},{k:"acwr",l:"ACWR推移"}].map(({k,l}) => (
          <button key={k} onClick={() => setTab(k as "list"|"acwr")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${tab===k ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* 選手一覧 - カードをクリックすると詳細表示 */}
      {tab === "list" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.players.map(p => (
            <PlayerCard key={p.name} p={p} sel={selPlayer===p.name} onClick={() => setSelPlayer(p.name)} wt={wt} />
          ))}
        </div>
      )}

      {/* ACWR推移 */}
      {tab === "acwr" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {data.players.map(p => {
              const z = ZONE[p.zone]
              return (
                <button key={p.name} onClick={() => setSelPlayer(p.name)}
                  className={`px-3 py-1 rounded-full text-xs border ${z.bg} ${z.border} ${z.text}`}>
                  {p.name}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">選手名をクリックすると詳細ビューへ</p>
        </div>
      )}
    </div>
  )
}
