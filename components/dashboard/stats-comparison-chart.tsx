"use client"

type Props = {
  vonds: Record<string, number>
  opp: Record<string, number>
  opponent: string
}

const ITEMS = [
  { key: "packingRate",     label: "パッキングレート" },
  { key: "impact",          label: "インペクト" },
  { key: "boxEntries",      label: "ボックス侵入" },
  { key: "goalAreaEntries", label: "エリア侵入" },
  { key: "lineBreak",       label: "ラインブレイク" },
  { key: "lineBreakAC",     label: "ラインブレイクAC" },
  { key: "crosses",         label: "クロス" },
  { key: "shots",           label: "シュート" },
  { key: "corners",         label: "CK" },
  { key: "freeKicks",       label: "FK" },
]

const fmt = (v: number) => v === 0 ? '-' : (v % 1 === 0 ? String(v) : v.toFixed(1))

export function StatsComparisonChart({ vonds, opp, opponent }: Props) {
  return (
    <div className="w-full select-none">
      {/* ヘッダー */}
      <div className="flex items-center mb-4 text-xs font-bold">
        <span className="text-primary">VONDS市原</span>
        <div className="flex-1" />
        <span className="text-muted-foreground">{opponent}</span>
      </div>

      <div className="space-y-3">
        {ITEMS.map(({ key, label }) => {
          const v = vonds[key] ?? 0
          const o = opp[key] ?? 0
          const total = v + o
          // VONDSの割合（0〜100%）、データなしは50%
          const vPct = total > 0 ? (v / total) * 100 : 50

          return (
            <div key={key}>
              {/* 項目ラベル */}
              <div className="text-center text-xs text-muted-foreground mb-1">{label}</div>
              <div className="flex items-center gap-2">
                {/* VONDS数値 */}
                <span className="w-14 text-right text-sm font-bold tabular-nums flex-shrink-0 text-primary">
                  {fmt(v)}
                </span>

                {/* 1本のバー: 左=VONDS(緑) 右=相手(グレー) */}
                <div className="flex-1 flex h-5 rounded-full overflow-hidden bg-secondary/40">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${vPct}%` }}
                  />
                  <div
                    className="h-full bg-muted-foreground/50 transition-all duration-500"
                    style={{ width: `${100 - vPct}%` }}
                  />
                </div>

                {/* 相手数値 */}
                <span className="w-14 text-left text-sm font-bold tabular-nums flex-shrink-0 text-muted-foreground">
                  {fmt(o)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}