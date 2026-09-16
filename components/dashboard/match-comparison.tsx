// @ts-nocheck
"use client"
import { useState, useEffect } from "react"

type Match = {
  date: string; venue: string; type: string; opponent: string
  totalTime: number|null; apt: string|null
  distance: number|null; sprint: number|null; hi: number|null
  score: number|null; conceded: number|null
  packing: number|null; impact: number|null; boxEntries: number|null; goalAreaEntries: number|null
  lineBreak: number|null; lineBreakAC: number|null; cross: number|null; shots: number|null
  corners: number|null; freeKicks: number|null; xg: number|null
  oppPacking: number|null; oppImpact: number|null; oppBoxEntries: number|null; oppGoalAreaEntries: number|null
  oppLineBreak: number|null; oppLineBreakAC: number|null; oppCross: number|null; oppShots: number|null
  oppCorners: number|null; oppFreeKicks: number|null; oppXg: number|null
}

const STAT_COLS = [
  { key: "packing",         oppKey: "oppPacking",         label: "PR"     },
  { key: "impact",          oppKey: "oppImpact",          label: "Impact" },
  { key: "boxEntries",      oppKey: "oppBoxEntries",      label: "ボックス"  },
  { key: "goalAreaEntries", oppKey: "oppGoalAreaEntries", label: "GA"     },
  { key: "lineBreak",       oppKey: "oppLineBreak",       label: "LB"     },
  { key: "lineBreakAC",     oppKey: "oppLineBreakAC",     label: "LBAC"   },
  { key: "cross",           oppKey: "oppCross",           label: "クロス"   },
  { key: "shots",           oppKey: "oppShots",           label: "シュート" },
  { key: "corners",         oppKey: "oppCorners",         label: "CK"     },
  { key: "freeKicks",       oppKey: "oppFreeKicks",       label: "FK"     },
  { key: "xg",              oppKey: "oppXg",              label: "xG"     },
]

const TABS = [
  { key: "all",      label: "全て" },
  { key: "official", label: "公式戦" },
  { key: "tm",       label: "TRマッチ" },
]

const fmt = (v: any) =>
  v !== null && v !== undefined
    ? <span>{v}</span>
    : <span className="text-muted-foreground/30">-</span>

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
                <th colSpan={3} className="border border-border px-2 py-1 text-center bg-muted text-muted-foreground whitespace-nowrap">試合</th>
                <th colSpan={STAT_COLS.length} className="border border-border px-2 py-1 text-center bg-sky-50/50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 whitespace-nowrap">自チーム / 相手</th>
              </tr>
              <tr>
                <th className="border border-border px-2 py-1 text-center bg-muted whitespace-nowrap">得点</th>
                <th className="border border-border px-2 py-1 text-center bg-muted whitespace-nowrap">失点</th>
                <th className="border border-border px-2 py-1 text-center bg-muted whitespace-nowrap">時間</th>
                <th className="border border-border px-2 py-1 text-center bg-muted whitespace-nowrap">距離(km)</th>
                <th className="border border-border px-2 py-1 text-center bg-muted whitespace-nowrap">スプリント</th>
                <th className="border border-border px-2 py-1 text-center bg-muted whitespace-nowrap">HI%平均</th>
                {STAT_COLS.map(c => (
                  <th key={c.key} className="border border-border px-2 py-1 text-center bg-sky-50/30 dark:bg-sky-950/10 whitespace-nowrap font-medium">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matches.map((m, i) => (
                <>
                  {/* 1行目: 日付・対戦相手・試合情報・自チーム */}
                  <tr key={`${i}-own`} className={`${m.type === "official" ? "bg-green-50/30 dark:bg-green-950/20" : ""} hover:bg-muted/30`}>
                    <td className="sticky left-0 z-10 bg-background border-t border-l border-r border-border px-2 pt-1.5 pb-0 whitespace-nowrap font-medium" rowSpan={2}>
                      {m.date}
                      <span className={`ml-1 text-[10px] px-1 rounded ${m.type === "official" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                        {m.type === "official" ? "公" : "TM"}
                      </span>
                    </td>
                    <td className="sticky left-[80px] z-10 bg-background border-t border-l border-r border-border px-2 pt-1.5 pb-0 whitespace-nowrap" rowSpan={2}>
                      {m.venue && <span className="text-[10px] text-muted-foreground mr-1">{m.venue}</span>}
                      {m.opponent}
                    </td>
                    <td className="border border-border px-2 py-1 text-center font-bold">{fmt(m.score)}</td>
                    <td className="border border-border px-2 py-1 text-center">{fmt(m.conceded)}</td>
                    <td className="border border-border px-2 py-1 text-center text-muted-foreground">{fmt(m.totalTime)}</td>
                    <td className="border border-border px-2 py-1 text-center tabular-nums">{fmt(m.distance)}</td>
                    <td className="border border-border px-2 py-1 text-center tabular-nums">{fmt(m.sprint)}</td>
                    <td className="border border-border px-2 py-1 text-center tabular-nums">{fmt(m.hi)}</td>
                    {STAT_COLS.map(c => (
                      <td key={c.key} className="border border-border px-2 py-1 text-center tabular-nums">
                        {fmt((m as any)[c.key])}
                      </td>
                    ))}
                  </tr>
                  {/* 2行目: 相手チームのスタッツ */}
                  <tr key={`${i}-opp`} className={`${m.type === "official" ? "bg-green-50/30 dark:bg-green-950/20" : ""} hover:bg-muted/30`}>
                    <td colSpan={3} className="border border-border px-2 py-1 text-right text-[10px] text-muted-foreground whitespace-nowrap">相手</td>
                    {STAT_COLS.map(c => (
                      <td key={c.oppKey} className="border border-border px-2 py-1 text-center tabular-nums text-red-600 dark:text-red-400">
                        {fmt((m as any)[c.oppKey])}
                      </td>
                    ))}
                  </tr>
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
