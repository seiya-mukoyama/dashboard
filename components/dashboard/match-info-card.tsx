"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock } from "lucide-react"

const nextMatch = {
  opponent: "川崎フロンターレ",
  date: "2025/03/22",
  time: "15:00",
  venue: "等々力陸上競技場",
  competition: "J1リーグ 第6節",
  isHome: false,
  opponentRank: 2,
  opponentPoints: 12,
  opponentRecentForm: ["W", "W", "D", "W", "L"],
}

type PrevMatch = {
  date: string
  tournament: string
  opponent: string
  venue: string
  goalsFor: number
  goalsAgainst: number
  matchVenue: string // HOME/AWAY
}

export function MatchInfoCard() {
  const [prev, setPrev] = useState<PrevMatch | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/stats?type=official")
      .then(r => r.json())
      .then(d => {
        const matches = d.matches ?? []
        if (matches.length > 0) {
          const latest = matches[matches.length - 1]
          setPrev({
            date: latest.date,
            tournament: latest.tournament ?? '',
            opponent: latest.opponent,
            venue: '',
            goalsFor: latest.goalsFor,
            goalsAgainst: latest.goalsAgainst,
            matchVenue: latest.venue ?? '',
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const result = prev
    ? prev.goalsFor > prev.goalsAgainst ? 'win'
    : prev.goalsFor < prev.goalsAgainst ? 'lose' : 'draw'
    : 'draw'

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 前節の結果 */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>前節の結果</span>
            {!loading && prev && (
              <Badge variant={result === 'win' ? 'default' : result === 'draw' ? 'secondary' : 'destructive'}>
                {result === 'win' ? '勝利' : result === 'draw' ? '引き分け' : '敗北'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">読み込み中...</div>
          ) : !prev ? (
            <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">データがありません</div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  {prev.tournament} · {prev.date}
                  {prev.matchVenue && (
                    <span className={`ml-2 text-xs font-semibold px-1.5 py-0.5 rounded ${
                      prev.matchVenue.toUpperCase() === 'HOME' ? 'bg-primary/15 text-primary' : 'bg-orange-500/15 text-orange-500'
                    }`}>{prev.matchVenue.toUpperCase()}</span>
                  )}
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{prev.matchVenue.toUpperCase() === 'HOME' ? 'HOME' : 'AWAY'}</p>
                    <p className="font-semibold text-card-foreground">VONDS市原</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-3xl font-bold ${result === 'win' ? 'text-primary' : 'text-card-foreground'}`}>
                      {prev.goalsFor}
                    </span>
                    <span className="text-xl text-muted-foreground">-</span>
                    <span className={`text-3xl font-bold ${result === 'lose' ? 'text-destructive' : 'text-card-foreground'}`}>
                      {prev.goalsAgainst}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{prev.matchVenue.toUpperCase() === 'HOME' ? 'AWAY' : 'HOME'}</p>
                    <p className="font-semibold text-card-foreground">{prev.opponent}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{prev.date}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 次節の対戦相手 */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>次節の対戦相手</span>
            <Badge variant="outline">{nextMatch.competition}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-card-foreground">vs {nextMatch.opponent}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {nextMatch.isHome ? 'ホーム' : 'アウェイ'}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-secondary p-2">
              <p className="text-xs text-muted-foreground">現在順位</p>
              <p className="text-lg font-bold text-card-foreground">{nextMatch.opponentRank}位</p>
            </div>
            <div className="rounded-md bg-secondary p-2">
              <p className="text-xs text-muted-foreground">勝ち点</p>
              <p className="text-lg font-bold text-card-foreground">{nextMatch.opponentPoints}</p>
            </div>
            <div className="rounded-md bg-secondary p-2">
              <p className="text-xs text-muted-foreground">直近5試合</p>
              <div className="flex justify-center gap-0.5 mt-1">
                {nextMatch.opponentRecentForm.map((r, i) => (
                  <span key={i} className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center text-background ${
                    r === 'W' ? 'bg-primary' : r === 'D' ? 'bg-muted-foreground' : 'bg-destructive'
                  }`}>{r}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{nextMatch.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{nextMatch.time}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{nextMatch.venue}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
