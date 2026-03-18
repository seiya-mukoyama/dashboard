"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock } from "lucide-react"

const previousMatch = {
  opponent: "浦和レッズ",
  date: "2025/03/15",
  venue: "埼玉スタジアム2002",
  competition: "J1リーグ 第5節",
  result: "win",
  score: { home: 1, away: 2 },
  isHome: false,
}

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

export function MatchInfoCard() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Previous Match */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>前節の結果</span>
            <Badge variant={previousMatch.result === "win" ? "default" : previousMatch.result === "draw" ? "secondary" : "destructive"}>
              {previousMatch.result === "win" ? "勝利" : previousMatch.result === "draw" ? "引分" : "敗北"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">{previousMatch.competition}</p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{previousMatch.isHome ? "HOME" : "AWAY"}</p>
                <p className="font-semibold text-card-foreground">FC東京</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-3xl font-bold ${previousMatch.result === "win" ? "text-primary" : "text-card-foreground"}`}>
                  {previousMatch.isHome ? previousMatch.score.home : previousMatch.score.away}
                </span>
                <span className="text-xl text-muted-foreground">-</span>
                <span className={`text-3xl font-bold ${previousMatch.result === "lose" ? "text-destructive" : "text-card-foreground"}`}>
                  {previousMatch.isHome ? previousMatch.score.away : previousMatch.score.home}
                </span>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{previousMatch.isHome ? "AWAY" : "HOME"}</p>
                <p className="font-semibold text-card-foreground">{previousMatch.opponent}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{previousMatch.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{previousMatch.venue}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Match */}
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
              {nextMatch.isHome ? "ホーム" : "アウェイ"}
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
                {nextMatch.opponentRecentForm.map((result, i) => (
                  <span
                    key={i}
                    className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center text-background ${
                      result === "W" ? "bg-primary" : result === "D" ? "bg-muted-foreground" : "bg-destructive"
                    }`}
                  >
                    {result}
                  </span>
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
