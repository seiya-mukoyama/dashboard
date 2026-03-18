"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const standings = [
  { rank: 1, team: "東京FC", points: 45, played: 20, won: 14, drawn: 3, lost: 3, gf: 38, ga: 15, gd: 23, isOurTeam: false },
  { rank: 2, team: "大阪ユナイテッド", points: 42, played: 20, won: 13, drawn: 3, lost: 4, gf: 35, ga: 18, gd: 17, isOurTeam: false },
  { rank: 3, team: "FC Analytics", points: 39, played: 20, won: 12, drawn: 3, lost: 5, gf: 32, ga: 20, gd: 12, isOurTeam: true },
  { rank: 4, team: "横浜レッズ", points: 36, played: 20, won: 11, drawn: 3, lost: 6, gf: 29, ga: 22, gd: 7, isOurTeam: false },
  { rank: 5, team: "名古屋FC", points: 33, played: 20, won: 10, drawn: 3, lost: 7, gf: 27, ga: 25, gd: 2, isOurTeam: false },
  { rank: 6, team: "福岡シティ", points: 30, played: 20, won: 9, drawn: 3, lost: 8, gf: 24, ga: 26, gd: -2, isOurTeam: false },
  { rank: 7, team: "札幌ウルフズ", points: 27, played: 20, won: 8, drawn: 3, lost: 9, gf: 22, ga: 28, gd: -6, isOurTeam: false },
  { rank: 8, team: "広島FC", points: 24, played: 20, won: 7, drawn: 3, lost: 10, gf: 20, ga: 30, gd: -10, isOurTeam: false },
]

export function LeagueStandings() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-card-foreground">リーグ順位表</CardTitle>
        <CardDescription>J1リーグ 2025-26シーズン</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-12 text-muted-foreground">順位</TableHead>
              <TableHead className="text-muted-foreground">チーム</TableHead>
              <TableHead className="text-center text-muted-foreground w-12">試</TableHead>
              <TableHead className="text-center text-muted-foreground w-12">勝</TableHead>
              <TableHead className="text-center text-muted-foreground w-12">分</TableHead>
              <TableHead className="text-center text-muted-foreground w-12">負</TableHead>
              <TableHead className="text-center text-muted-foreground w-12">得</TableHead>
              <TableHead className="text-center text-muted-foreground w-12">失</TableHead>
              <TableHead className="text-center text-muted-foreground w-14">得失</TableHead>
              <TableHead className="text-center text-muted-foreground w-14">勝点</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((team) => (
              <TableRow
                key={team.team}
                className={`border-border/50 ${
                  team.isOurTeam
                    ? "bg-primary/10 hover:bg-primary/20"
                    : "hover:bg-secondary/30"
                }`}
              >
                <TableCell className="font-medium">
                  {team.rank <= 3 ? (
                    <Badge
                      variant={team.rank === 1 ? "default" : "outline"}
                      className={
                        team.rank === 1
                          ? "bg-chart-3 text-background"
                          : team.rank === 2
                          ? "border-chart-2 text-chart-2"
                          : "border-chart-4 text-chart-4"
                      }
                    >
                      {team.rank}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">{team.rank}</span>
                  )}
                </TableCell>
                <TableCell className={`font-medium ${team.isOurTeam ? "text-primary" : "text-card-foreground"}`}>
                  {team.team}
                  {team.isOurTeam && (
                    <Badge variant="outline" className="ml-2 text-xs border-primary text-primary">
                      自チーム
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">{team.played}</TableCell>
                <TableCell className="text-center text-card-foreground">{team.won}</TableCell>
                <TableCell className="text-center text-muted-foreground">{team.drawn}</TableCell>
                <TableCell className="text-center text-muted-foreground">{team.lost}</TableCell>
                <TableCell className="text-center text-card-foreground">{team.gf}</TableCell>
                <TableCell className="text-center text-muted-foreground">{team.ga}</TableCell>
                <TableCell className={`text-center font-medium ${team.gd > 0 ? "text-primary" : team.gd < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {team.gd > 0 ? `+${team.gd}` : team.gd}
                </TableCell>
                <TableCell className="text-center font-bold text-card-foreground">{team.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
