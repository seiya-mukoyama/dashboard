// @ts-nocheck
"use client"
import { useState, useEffect } from "react"

type Match = {
  date: string; venue: string; type: string; matchType: string; opponent: string
  totalTime: number|null; apt: string|null
  score: number|null; conceded: number|null
  packing: number|null; impact: number|null; boxEntries: number|null; goalAreaEntries: number|null
  lineBreak: number|null; lineBreakAC: number|null; cross: number|null; shots: number|null
  corners: number|null; freeKicks: number|null; xg: number|null
  oppPacking: number|null; oppImpact: number|null; oppBoxEntries: number|null; oppGoalAreaEntries: number|null
  oppLineBreak: number|null; oppLineBreakAC: number|null; oppCross: number|null; oppShots: number|null
  oppCorners: number|null; oppFreeKicks: number|null; oppXg: number|null
}

// 自チームの列定義
const OWN_COLS = [
  { key: "score",           label: "得点",    group: "試合" },
  { key: "conceded",        label: "失点",    group: "試合" },
  { key: "totalTime",       label: "時間(min)", group: "試合" },
  { key: "apt",             label: "APT",      group: "試合" },
  { key: "packing",         label: "PR",       group: "自チーム" },
  { key: "impact",          label: "Impact",   group: "自チーム" },
  { key: "boxEntries",      label: "ボックス",  group: "自チーム" },
  { key: "goalAreaEntries", label: "GA",       group: "自チーム" },
  { key: "lineBreak",       label: "LB",       group: "自チーム" },
  { key: "lineBreakAC",     label: "LBAC",     group: "自チーム" },
  { key: "cross",           label: "クロス",   group: "自チーム" },
  { key: "shots",           label: "シュート", group: "自チーム" },
  { key: "corners",         label: "CK",       group: "自チーム" },
  { key: "freeKicks",       label: "FK",       group: "自チーム" },
  { key: "xg",              label: "xG",       group: "自チーム" },
]

// 相手チームの列定義
const OPP_COLS = [
  { key: "oppPacking",         label: "PR",       group: "相手" },
  { key: "oppImpact",          label: "Impact",   group: "相手" },
  { key: "oppBoxEntries",      label: "ボックス",  group: "相手" },
  { key: "oppGoalAreaEntries", label: "GA",       group: "相手" },
  { key: "oppLineBreak",       label: "LB",       group: "相手" },
  { key: "oppLineBreakAC",     label: "LBAC",     group: "相手" },
  { key: "oppCross",           label: "クロス",   group: "相手" },
  { key: "oppShots",           label: "シュート", group: "相手" },
  { key: "oppCorners",         label: "CK",       group: "相手" },
  { key: "oppFreeKicks",       label: "FK",       group: "相手" },
  { key: "oppXg",              label: "xG",       group: "相手" },
]

const ALL_COLS = [...OWN_COLS, ...OPP_COLS]

const TABS = [
  { key: "all",      label: "全て" },
  { key: "official", label: "公式戦" },
  { key: "tm",       label: "TRマッチ" },
]

export default function MatchComparison() {
  const [tab, setTab] = useState<"all"|"official"|"tm">("all")
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/match-comparison?type=${tab}`)
      .then(r => r.json())
      .then(d => { setMatches(d.matches ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tab])

  // グループ名を順番通りに取得
  const groups = [...new Set(ALL_COLS.map(c => c.group))]

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">試合比較</h2>

      <div className="flex gap-2 mb-4">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${tab === t.key ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm py-8 text-center">読み込み中...</div>
      ) : matches.length === 0 ? (
        <div className="text-muted-foreground text-sm py-8 text-center">データなし</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse min-w-max">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-background border border-border px-2 py-1.5 text-left whitespace-nowrap" rowSpan={2}>日付</th>
                <th className="sticky left-[80px] z-20 bg-background border border-border px-2 py-1.5 text-left whitespace-nowrap" rowSpan={2}>対戦相手</th>
                {groups.map(g => {
                  const count = ALL_COLS.filter(c => c.group === g).length
                  const isOpp = g === "相手"
                  return <th key={g} colSpan={count}
                    className={`border border-border px-2 py-1 text-center whitespace-nowrap ${isOpp ? "bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400" : "bg-muted text-muted-foreground"}`}>
                    {g}
                  </th>
                })}
              </tr>
              <tr>
                {ALL_COLS.map(c => {
                  const isOpp = c.group === "相手"
                  return <th key={c.key}
                    className={`border border-border px-2 py-1 text-center whitespace-nowrap font-medium ${isOpp ? "bg-red-50/30 dark:bg-red-950/10" : "bg-muted"}`}>
                    {c.label}
                  </th>
                })}
              </tr>
            </thead>
            <tbody>
              {matches.map((m, i) => (
                <tr key={i} className={`hover:bg-muted/40 ${m.type === "official" ? "bg-green-50/30 dark:bg-green-950/20" : ""}`}>
                  <td className="sticky left-0 z-10 bg-background border border-border px-2 py-1.5 whitespace-nowrap font-medium">
                    {m.date}
                    <span className={`ml-1 text-[10px] px-1 rounded ${m.type === "official" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                      {m.type === "official" ? "公" : "TM"}
                    </span>
                  </td>
                  <td className="sticky left-[80px] z-10 bg-background border border-border px-2 py-1.5 whitespace-nowrap">
                    {m.venue && <span className="text-[10px] text-muted-foreground mr-1">{m.venue}</span>}
                    {m.opponent}
                  </td>
                  {ALL_COLS.map(c => {
                    const v = (m as any)[c.key]
                    const isOpp = c.group === "相手"
                    return (
                      <td key={c.key} className={`border border-border px-2 py-1.5 text-center tabular-nums ${isOpp ? "bg-red-50/20 dark:bg-red-950/10" : ""}`}>
                        {v !== null && v !== undefined ? v : <span className="text-muted-foreground/30">-</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
