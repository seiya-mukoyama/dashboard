"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock, Trophy } from "lucide-react"

type PrevMatch = {
  date: string; tournament: string; opponent: string
  goalsFor: number; goalsAgainst: number; matchVenue: string
}

type NextMatch = {
  date: string; time: string; opponent: string
  isHome: boolean; venue: string; round: string; competition: string
}

type StandingRow = {
  rank: number; team: string; points: number; played: number
  won: number; lost: number; gd: number; isOurTeam: boolean
}

export function MatchInfoCard() {
  const [prev, setPrev] = useState<PrevMatch | null>(null)
  const [next, setNext] = useState<NextMatch | null>(null)
  const [opponentStanding, setOpponentStanding] = useState<StandingRow | null>(null)
  const [recentForm, setRecentForm] = useState<string[]>([])
  const [opponentForm, setOpponentForm] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/stats?type=official").then(r => r.json()).catch(() => ({ matches: [] })),
      fetch("/api/schedule").then(r => r.json()).catch(() => ({ past: [], upcoming: [] })),
      fetch("/api/league-standings").then(r => r.json()).catch(() => ({ standings: [] })),
      fetch("/api/schedule").then(r => r.json()).catch(() => ({ upcoming: [] })).then(d => {
        const opp = d.upcoming?.[0]?.opponent
        if (opp) return fetch(`/api/opponent-stats?team=${encodeURIComponent(opp)}&limit=5`).then(r => r.json()).catch(() => ({ form: [] }))
        return { form: [] }
      }),
    ]).then(([statsData, scheduleData, standingsData, oppStatsData]) => {
      // 前節（公式戦最新）
      const officialMatches = statsData.matches ?? []
      if (officialMatches.length > 0) {
        const latest = officialMatches[officialMatches.length - 1]
        setPrev({
          date: latest.date,
          tournament: latest.tournament ?? '',
          opponent: latest.opponent,
          goalsFor: latest.goalsFor,
          goalsAgainst: latest.goalsAgainst,
          matchVenue: latest.venue ?? '',
        })
      }

      // 次節
      const upcoming = scheduleData.upcoming ?? []
      if (upcoming.length > 0) {
        const n = upcoming[0]
        setNext({
          date: n.date,
          time: n.time,
          opponent: n.opponent,
          isHome: n.isHome,
          venue: n.venue ?? '',
          round: n.round ?? '',
          competition: n.competition || 'JFL',
        })

        // 相手の順位を検索
        const standings: StandingRow[] = standingsData.standings ?? []
        const opp = upcoming[0].opponent?.replace(/\s/g, '')
        const found = standings.find(s => {
          const sName = s.team?.replace(/\s/g, '') ?? ''
          return sName.includes(opp?.slice(0, 4) ?? '') || opp?.includes(sName.slice(0, 4) ?? '')
        })
        if (found) setOpponentStanding(found)
        // 相手の直近フォーム
        if (oppStatsData?.form) setOpponentForm(oppStatsData.form)
      }

      // 直近5試合（JFL schedule の past から）
      const past = scheduleData.past ?? []
      // 全試合（stats）から最新5試合のW/D/L
      const allMatches = statsData.matches ?? []
      const last5 = allMatches.slice().reverse().slice(0, 5)
      const form = last5.map((m: any) => {
        if (m.goalsFor > m.goalsAgainst) return 'W'
        if (m.goalsFor < m.goalsAgainst) return 'L'
        return 'D'
      })
      setRecentForm(form)
    }).finally(() => setLoading(false))
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
                      prev.matchVenue.toUpperCase() === 'HOME'
                        ? 'bg-primary/15 text-primary'
                        : 'bg-orange-500/15 text-orange-500'
                    }`}>{prev.matchVenue.toUpperCase()}</span>
                  )}
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{prev.matchVenue.toUpperCase() === 'HOME' ? 'HOME' : 'AWAY'}</p>
                    <p className="font-semibold text-card-foreground">VONDS市原</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-3xl font-bold ${result === 'win' ? 'text-primary' : 'text-card-foreground'}`}>{prev.goalsFor}</span>
                    <span className="text-xl text-muted-foreground">-</span>
                    <span className={`text-3xl font-bold ${result === 'lose' ? 'text-destructive' : 'text-card-foreground'}`}>{prev.goalsAgainst}</span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{prev.matchVenue.toUpperCase() === 'HOME' ? 'AWAY' : 'HOME'}</p>
                    <p className="font-semibold text-card-foreground">{prev.opponent}</p>
                  </div>
                </div>
              </div>
              {/* 直近5試合 */}
              {recentForm.length > 0 && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-muted-foreground">直近5試合:</span>
                  <div className="flex gap-1">
                    {recentForm.map((r, i) => (
                      <span key={i} className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center text-white ${
                        r === 'W' ? 'bg-primary' : r === 'D' ? 'bg-muted-foreground' : 'bg-destructive'
                      }`}>{r}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 次節の対戦相手 */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>次節の対戦相手</span>
            {next && <Badge variant="outline">{next.competition} {next.round}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">読み込み中...</div>
          ) : !next ? (
            <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">次節データがありません</div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-2xl font-bold text-card-foreground">vs {next.opponent}</p>
                <Badge variant={next.isHome ? 'default' : 'outline'} className="mt-1">
                  {next.isHome ? 'HOME' : 'AWAY'}
                </Badge>
              </div>
              {/* 相手の順位・勝ち点 */}
              {opponentStanding && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-secondary p-2">
                    <p className="text-xs text-muted-foreground">現在順位</p>
                    <p className="text-lg font-bold text-card-foreground">{opponentStanding.rank}位</p>
                  </div>
                  <div className="rounded-md bg-secondary p-2">
                    <p className="text-xs text-muted-foreground">勝ち点</p>
                    <p className="text-lg font-bold text-card-foreground">{opponentStanding.points}</p>
                  </div>
                  <div className="rounded-md bg-secondary p-2">
                    <p className="text-xs text-muted-foreground">試合数</p>
                    <p className="text-lg font-bold text-card-foreground">{opponentStanding.played}</p>
                  </div>
                </div>
              )}
              {opponentForm.length > 0 && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-muted-foreground">直近5試合:</span>
                  <div className="flex gap-1">
                    {opponentForm.map((r, i) => (
                      <span key={i} className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center text-white ${
                        r === 'W' ? 'bg-primary' : r === 'D' ? 'bg-muted-foreground' : 'bg-destructive'
                      }`}>{r}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{next.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{next.time}</span>
                </div>
                {next.venue && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{next.venue}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
