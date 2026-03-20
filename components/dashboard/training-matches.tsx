"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp } from "lucide-react"
import { StatsCompareChart } from "@/components/dashboard/stats-compare-chart"

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

export function TrainingMatches() {
  const [matches, setMatches] = useState<MatchStats[]>([])
  const [loading, setLoading] = useState(true)
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(data => setMatches(data.matches ?? []))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        読み込み中...
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        試合データがありません
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {matches.map((match, i) => {
        const isOpen = openIdx === i
        const result = match.goalsFor > match.goalsAgainst ? "win"
          : match.goalsFor < match.goalsAgainst ? "lose" : "draw"

        return (
          <Card key={i} className="border-border/50 overflow-hidden">
            {/* ヘッダー行（クリックで展開） */}
            <button
              className="w-full text-left"
              onClick={() => setOpenIdx(isOpen ? null : i)}
            >
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                      {match.date}
                    </Badge>
                    <span className="text-sm font-semibold text-card-foreground">
                      vs {match.opponent}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-bold ${
                      result === "win" ? "text-primary"
                      : result === "lose" ? "text-destructive"
                      : "text-muted-foreground"
                    }`}>
                      {match.goalsFor} - {match.goalsAgainst}
                    </span>
                    <Badge className={`text-xs ${
                      result === "win" ? "bg-primary/15 text-primary border-0"
                      : result === "lose" ? "bg-destructive/15 text-destructive border-0"
                      : "bg-secondary text-muted-foreground border-0"
                    }`}>
                      {result === "win" ? "勝" : result === "lose" ? "負" : "分"}
                    </Badge>
                    {isOpen
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    }
                  </div>
                </div>
              </CardHeader>
            </button>

            {/* スタッツ比較グラフ（展開時） */}
            {isOpen && (
              <CardContent className="pt-0 pb-4 px-4 border-t border-border/50">
                <StatsCompareChart match={match} opponentName={match.opponent} />
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}