"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Standing = {
  rank: number; team: string; points: number; played: number
  won: number; pkWon: number; pkLost: number; lost: number
  gd: string; gf: number; ga: number; isOurTeam: boolean
}

export function LeagueStandings() {
  const [standings, setStandings] = useState<Standing[]>([])
  const [loading, setLoading] = useState(true)
  const [updated, setUpdated] = useState('')

  useEffect(() => {
    fetch("/api/league-standings")
      .then(r => r.json())
      .then(d => {
        setStandings(d.standings ?? [])
        setUpdated(d.updated ?? '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-card-foreground">リーグ順位表</CardTitle>
        <CardDescription>2026 JFL CUP{updated ? ` · ${updated}` : ''}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">読み込み中...</div>
        ) : standings.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">データがありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="py-2 px-2 text-left text-muted-foreground font-medium w-10">順位</th>
                  <th className="py-2 px-2 text-left text-muted-foreground font-medium">チーム</th>
                  <th className="py-2 px-1 text-center text-muted-foreground font-medium w-9">試</th>
                  <th className="py-2 px-1 text-center text-muted-foreground font-medium w-9">勝</th>
                  <th className="py-2 px-1 text-center text-muted-foreground font-medium w-9">PK勝</th>
                  <th className="py-2 px-1 text-center text-muted-foreground font-medium w-9">PK負</th>
                  <th className="py-2 px-1 text-center text-muted-foreground font-medium w-9">敗</th>
                  <th className="py-2 px-1 text-center text-muted-foreground font-medium w-12">得失</th>
                  <th className="py-2 px-1 text-center text-muted-foreground font-medium w-9">得</th>
                  <th className="py-2 px-1 text-center text-muted-foreground font-medium w-9">失</th>
                  <th className="py-2 px-1 text-center text-muted-foreground font-medium w-12">勝点</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team) => (
                  <tr key={team.rank} className={`border-b border-border/30 ${
                    team.isOurTeam ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-secondary/30'
                  }`}>
                    <td className="py-1.5 px-2 font-medium">
                      {team.rank <= 3 ? (
                        <Badge variant={team.rank === 1 ? "default" : "outline"}
                          className={team.rank === 1 ? "bg-chart-3 text-background" : team.rank === 2 ? "border-chart-2 text-chart-2" : "border-chart-4 text-chart-4"}>
                          {team.rank}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">{team.rank}</span>
                      )}
                    </td>
                    <td className={`py-1.5 px-2 font-medium ${team.isOurTeam ? 'text-primary' : 'text-card-foreground'}`}>
                      {team.team}
                      {team.isOurTeam && (
                        <Badge variant="outline" className="ml-2 text-xs border-primary text-primary">自チーム</Badge>
                      )}
                    </td>
                    <td className="py-1.5 px-1 text-center text-muted-foreground">{team.played}</td>
                    <td className="py-1.5 px-1 text-center text-card-foreground">{team.won}</td>
                    <td className="py-1.5 px-1 text-center text-muted-foreground">{team.pkWon}</td>
                    <td className="py-1.5 px-1 text-center text-muted-foreground">{team.pkLost}</td>
                    <td className="py-1.5 px-1 text-center text-muted-foreground">{team.lost}</td>
                    <td className={`py-1.5 px-1 text-center font-medium ${
                      team.gd.startsWith('+') ? 'text-primary' : team.gd.startsWith('-') ? 'text-destructive' : 'text-muted-foreground'
                    }`}>{team.gd}</td>
                    <td className="py-1.5 px-1 text-center text-card-foreground">{team.gf}</td>
                    <td className="py-1.5 px-1 text-center text-muted-foreground">{team.ga}</td>
                    <td className="py-1.5 px-1 text-center font-bold text-card-foreground">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
