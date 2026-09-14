// @ts-nocheck
"use client"
import { useState, useEffect } from "react"

type Match = {
  date: string; venue: string; type: string; matchType: string
  period: string; opponent: string
  score: number|null; conceded: number|null; matchTime: number|null; apt: string|null
  packing: number|null; impact: number|null; boxEntries: number|null
  goalAreaEntries: number|null; lineBreak: number|null; lineBreakAC: number|null
  cross: number|null; shots: number|null; corners: number|null
  freeKicks: number|null; xg: number|null
}

const COLS = [
  { key: "score",           label: "得点",      group: "試合" },
  { key: "conceded",        label: "失点",      group: "試合" },
  { key: "matchTime",       label: "時間(min)", group: "試合" },
  { key: "apt",             label: "APT",        group: "試合" },
  { key: "packing",         label: "PR",         group: "スタッツ" },
  { key: "impact",          label: "Impact",     group: "スタッツ" },
  { key: "boxEntries",      label: "ボックス侵入",  group: "スタッツ" },
  { key: "goalAreaEntries", label: "GA侵入",   group: "スタッツ" },
  { key: "lineBreak",       label: "LB",         group: "スタッツ" },
  { key: "lineBreakAC",     label: "LBAC",       group: "スタッツ" },
  { key: "cross",           label: "クロス",     group: "スタッツ" },
  { key: "shots",           label: "シュート",   group: "スタッツ" },
  { key: "corners",         label: "CK",         group: "セットプレイ" },
  { key: "freeKicks",       label: "FK",         group: "セットプレイ" },
  { key: "xg",              label: "xG",         group: "スタッツ" },
]

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

  const groups = [...new Set(COLS.map(c => c.group))]

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">試合比較</h2>

      {/* タブ */}
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
              {/* グループ行 */}
              <tr>
                <th className="sticky left-0 z-20 bg-background border border-border px-2 py-1.5 text-left whitespace-nowrap" rowSpan={2}>日付</th>
                <th className="sticky left-[80px] z-20 bg-background border border-border px-2 py-1.5 text-left whitespace-nowrap" rowSpan={2}>対戦相手</th>
                <th className="sticky left-[180px] z-20 bg-background border border-border px-2 py-1.5 text-center whitespace-nowrap" rowSpan={2}>本数</th>
                {groups.map(g => {
                  const count = COLS.filter(c => c.group === g).length
                  return <th key={g} colSpan={count} className="border border-border px-2 py-1 text-center bg-muted text-muted-foreground whitespace-nowrap">{g}</th>
                })}
              </tr>
              {/* 項目行 */}
              <tr>
                {COLS.map(c => (
                  <th key={c.key} className="border border-border px-2 py-1 text-center bg-muted whitespace-nowrap font-medium">{c.label}</th>
                ))}
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
                  <td className="sticky left-[180px] z-10 bg-background border border-border px-2 py-1.5 text-center whitespace-nowrap text-muted-foreground">
                    {m.period}
                  </td>
                  {COLS.map(c => {
                    const v = m[c.key]
                    return (
                      <td key={c.key} className="border border-border px-2 py-1.5 text-center tabular-nums">
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
