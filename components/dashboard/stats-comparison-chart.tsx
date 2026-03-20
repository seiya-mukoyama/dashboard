"use client"

type Props = {
  vonds: Record<string, number>
  opp: Record<string, number>
  opponent: string
}

const ITEMS = [
  { key: "packingRate",    label: "パッキングレート" },
  { key: "impact",         label: "インペクト" },
  { key: "boxEntries",     label: "ボックス侵入" },
  { key: "goalAreaEntries",label: "エリア侵入" },
  { key: "lineBreak",      label: "ラインブレイク" },
  { key: "lineBreakAC",    label: "ラインブレイクAC" },
  { key: "crosses",        label: "クロス" },
  { key: "shots",          label: "シュート" },
  { key: "corners",        label: "CK" },
  { key: "freeKicks",      label: "FK" },
]

const fmt = (v: number) => v === 0 ? '-' : (v % 1 === 0 ? String(v) : v.toFixed(1))

export function StatsComparisonChart({ vonds, opp, opponent }: Props) {
  return (
    <div className="w-full select-none">
      {/* ヘッダー */}
      <div className="flex items-center mb-3">
        <div className="w-16 text-right text-xs font-bold text-primary pr-2">VONDS市原</div>
        <div className="flex-1" />
        <div className="w-16 text-left text-xs font-bold text-muted-foreground pl-2">{opponent}</div>
      </div>

      <div className="space-y-2.5">
        {ITEMS.map(({ key, label }) => {
          const v = vonds[key] ?? 0
          const o = opp[key] ?? 0
          const total = v + o
          const vPct = total > 0 ? (v / total) * 100 : 50

          return (
            <div key={key}>
              {/* 項目ラベル */}
              <div className="text-center text-xs text-muted-foreground mb-0.5">{label}</div>
              {/* バー行 */}
              <div className="flex items-center">
                {/* VONDS数値 */}
                <span className="w-16 text-right text-sm font-bold text-primary tabular-nums pr-2 flex-shrink-0">
                  {fmt(v)}
                </span>
                {/* バー左半分（VONDS） */}
                <div className="flex-1 flex justify-end h-4 bg-secondary/30 rounded-l-sm overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${vPct}%` }} />
                </div>
                {/* センターライン */}
                <div className="w-0.5 h-5 bg-border flex-shrink-0" />
                {/* バー右半分（相手） */}
                <div className="flex-1 flex justify-start h-4 bg-secondary/30 rounded-r-sm overflow-hidden">
                  <div className="h-full bg-muted-foreground/60" style={{ width: `${100 - vPct}%` }} />
                </div>
                {/* 相手数値 */}
                <span className="w-16 text-left text-sm font-bold text-muted-foreground tabular-nums pl-2 flex-shrink-0">
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