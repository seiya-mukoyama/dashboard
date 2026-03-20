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
          const max = Math.max(v, o, 1)
          const vPct = (v / max) * 100
          const oPct = (o / max) * 100

          return (
            <div key={key}>
              {/* 項目ラベル */}
              <div className="text-center text-xs text-muted-foreground mb-1">{label}</div>
              <div className="flex items-center gap-2">
                {/* VONDS数値 */}
                <span className="w-14 text-right text-sm font-bold tabular-nums flex-shrink-0"
                  style={{ color: v >= o ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
                  {fmt(v)}
                </span>

                {/* VONDS バー（左から右へ） */}
                <div className="flex-1 flex items-center h-4 bg-secondary/30 rounded-l-sm overflow-hidden justify-start">
                  <div
                    className="h-full rounded-r-sm transition-all duration-500"
                    style={{
                      width: `${vPct}%`,
                      background: v >= o ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.3)',
                      marginLeft: 'auto',
                    }}
                  />
                </div>

                {/* 仕切り線 */}
                <div className="w-px h-5 bg-border flex-shrink-0" />

                {/* 相手バー（右から左へ） */}
                <div className="flex-1 flex items-center h-4 bg-secondary/30 rounded-r-sm overflow-hidden justify-end">
                  <div
                    className="h-full rounded-l-sm transition-all duration-500"
                    style={{
                      width: `${oPct}%`,
                      background: o > v ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground) / 0.3)',
                      marginRight: 'auto',
                    }}
                  />
                </div>

                {/* 相手数値 */}
                <span className="w-14 text-left text-sm font-bold tabular-nums flex-shrink-0"
                  style={{ color: o > v ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
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