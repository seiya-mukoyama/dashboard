"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const players = [
  {
    name: "田中 翔太",
    position: "FW",
    rating: 8.4,
    goals: 12,
    assists: 5,
    form: "excellent",
    initials: "田",
  },
  {
    name: "山本 健",
    position: "MF",
    rating: 7.9,
    goals: 4,
    assists: 11,
    form: "good",
    initials: "山",
  },
  {
    name: "佐藤 大輝",
    position: "DF",
    rating: 7.6,
    goals: 2,
    assists: 3,
    form: "good",
    initials: "佐",
  },
  {
    name: "鈴木 拓也",
    position: "GK",
    rating: 7.8,
    goals: 0,
    assists: 0,
    form: "excellent",
    initials: "鈴",
  },
  {
    name: "伊藤 颯",
    position: "MF",
    rating: 7.2,
    goals: 3,
    assists: 6,
    form: "average",
    initials: "伊",
  },
]

const formColors: Record<string, string> = {
  excellent: "bg-primary text-primary-foreground",
  good: "bg-chart-2 text-background",
  average: "bg-chart-3 text-background",
  poor: "bg-destructive text-destructive-foreground",
}

const formLabels: Record<string, string> = {
  excellent: "絶好調",
  good: "好調",
  average: "普通",
  poor: "不調",
}

export function PlayerRatings() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-card-foreground">選手評価</CardTitle>
        <CardDescription>トップパフォーマー</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {players.map((player, index) => (
            <div
              key={player.name}
              className="flex items-center gap-4 rounded-lg bg-secondary/30 p-3"
            >
              <span className="w-6 text-center text-sm font-medium text-muted-foreground">
                {index + 1}
              </span>
              <Avatar className="h-10 w-10 border border-border">
                <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
                  {player.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-card-foreground truncate">
                    {player.name}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {player.position}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {player.goals}G / {player.assists}A
                  </span>
                  <div className="flex-1 max-w-[100px]">
                    <Progress value={player.rating * 10} className="h-1.5" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  className={`${formColors[player.form]} text-xs`}
                >
                  {formLabels[player.form]}
                </Badge>
                <div className="flex flex-col items-end">
                  <span className="text-lg font-bold text-primary">
                    {player.rating.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    評価
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
