"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin } from "lucide-react"

const upcomingMatches = [
  {
    id: 1,
    opponent: "川崎フロンターレ",
    date: "2025/03/22",
    time: "15:00",
    venue: "等々力陸上競技場",
    competition: "J1リーグ",
    matchday: "第6節",
    isHome: false,
  },
  {
    id: 2,
    opponent: "横浜F・マリノス",
    date: "2025/03/29",
    time: "14:00",
    venue: "味の素スタジアム",
    competition: "J1リーグ",
    matchday: "第7節",
    isHome: true,
  },
  {
    id: 3,
    opponent: "サンフレッチェ広島",
    date: "2025/04/05",
    time: "15:00",
    venue: "エディオンスタジアム広島",
    competition: "J1リーグ",
    matchday: "第8節",
    isHome: false,
  },
  {
    id: 4,
    opponent: "ヴィッセル神戸",
    date: "2025/04/12",
    time: "16:00",
    venue: "味の素スタジアム",
    competition: "J1リーグ",
    matchday: "第9節",
    isHome: true,
  },
  {
    id: 5,
    opponent: "鹿島アントラーズ",
    date: "2025/04/19",
    time: "14:00",
    venue: "県立カシマサッカースタジアム",
    competition: "J1リーグ",
    matchday: "第10節",
    isHome: false,
  },
]

export function UpcomingMatches() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-card-foreground">今後5試合の予定</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingMatches.map((match, index) => (
            <div
              key={match.id}
              className={`flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-3 ${
                index === 0 ? "ring-2 ring-primary/30" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                  <span className="text-sm font-bold text-muted-foreground">{match.matchday.replace("第", "").replace("節", "")}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-card-foreground">vs {match.opponent}</p>
                    <Badge variant={match.isHome ? "default" : "outline"} className="text-xs">
                      {match.isHome ? "H" : "A"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{match.date} {match.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[150px]">{match.venue}</span>
                    </div>
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {match.competition}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
