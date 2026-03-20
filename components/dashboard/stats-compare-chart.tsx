"use client"

type MatchStats = {
  date: string
  opponent: string
  goalsFor: number
  goalsAgainst: number
  packingRate: number
  opp_packingRate: number
  impact: number
  opp_impact: number
  boxEntries: number
  opp_boxEntries: number
  goalAreaEntries: number
  opp_goalAreaEntries: number
  lineBreak: number
  opp_lineBreak: number
  lineBreakAC: number
  opp_lineBreakAC: number
  crosses: number
  opp_crosses: number
  shots: number
  opp_shots: number
  corners: number
  opp_corners: number
  freeKicks: number
  opp_freeKicks: number
}

type Props = {
  match: MatchStats
  opponentName: string
}

const ITEMS = [
  { label: "パッキングレート", homeKey: "packingRate", awayKey: "opp_packingRate" },
  { label: "インパクト",       homeKey: "impact",       awayKey: "opp_impact" },
  { label: "ボックス侵入",     homeKey: "boxEntries",   awayKey: "opp_boxEntries" },
  { label: "エリア侵入",       homeKey: "goalAreaEntries", awayKey: "opp_goalAreaEntries" },
  { label: "ラインブレイク",   homeKey: "lineBreak",    awayKey: "opp_lineBreak" },
  { label: "ラインブレイクAC", homeKey: "lineBreakAC",  awayKey: "opp_lineBreakAC" },
  { label: "クロス",           homeKey: "crosses",      awayKey: "opp_crosses" },
  { label: "シュート",         homeKey: "shots",        awayKey: "opp_shots" },
  { label: "CK",               homeKey: "corners",      awayKey: "opp_corners" },
  { label: "FK",               homeKey: "freeKicks",    awayKey: "opp_freeKicks" },
] as const

export function StatsCompareChart({ match, opponentName }: Props) {
  return (
    <div className="space-y-2.5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between text-xs font-semibold mb-3">
        <span className="text-primary">VONDS市原</span>
        <span className="text-muted-foreground">{opponentName}</span>
      </div>

      {ITEMS.map(({ label, homeKey, awayKey }) => {
        const home = (match as any)[homeKey] as number
        const away = (match as any)[awayKey] as number
        const total = home + away
        const homePct = total > 0 ? (home / total) * 100 : 50
        const awayPct = 100 - homePct

        return (
          <div key={label} className="space-y-1">
            {/* 数値ラベル行 */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-primary w-12 text-left">{home % 1 === 0 ? home : home.toFixed(1)}</span>
              <span className="text-muted-foreground text-center flex-1 font-medium">{label}</span>
              <span className="font-semibold text-muted-foreground w-12 text-right">{away % 1 === 0 ? away : away.toFixed(1)}</span>
            </div>
            {/* バーグラフ行 */}
            <div className="flex h-5 rounded-full overflow-hidden bg-secondary/30">
              {/* VONDS側（左）*/}
              <div
                className="h-full rounded-l-full transition-all duration-500"
                style={{
                  width: `${homePct}%`,
                  background: "hsl(var(--primary))",
                  opacity: total === 0 ? 0.3 : 1,
                }}
              />
              {/* 相手側（右）*/}
              <div
                className="h-full rounded-r-full transition-all duration-500"
                style={{
                  width: `${awayPct}%`,
                  background: "hsl(var(--muted-foreground))",
                  opacity: total === 0 ? 0.3 : 0.5,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}