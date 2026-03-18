"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

const players = [
  {
    id: 1,
    name: "田中 翔太",
    position: "FW",
    number: 9,
    rating: 8.4,
    goals: 12,
    assists: 5,
    matches: 18,
    form: "excellent",
    initials: "田",
    speed: 85,
    shooting: 88,
  },
  {
    id: 2,
    name: "山本 健",
    position: "MF",
    number: 10,
    rating: 7.9,
    goals: 4,
    assists: 11,
    matches: 20,
    form: "good",
    initials: "山",
    speed: 78,
    shooting: 70,
  },
  {
    id: 3,
    name: "佐藤 大輝",
    position: "DF",
    number: 4,
    rating: 7.6,
    goals: 2,
    assists: 3,
    matches: 19,
    form: "good",
    initials: "佐",
    speed: 72,
    shooting: 45,
  },
  {
    id: 4,
    name: "鈴木 拓也",
    position: "GK",
    number: 1,
    rating: 7.8,
    goals: 0,
    assists: 0,
    matches: 20,
    form: "excellent",
    initials: "鈴",
    speed: 55,
    shooting: 25,
  },
  {
    id: 5,
    name: "伊藤 颯",
    position: "MF",
    number: 8,
    rating: 7.2,
    goals: 3,
    assists: 6,
    matches: 17,
    form: "average",
    initials: "伊",
    speed: 82,
    shooting: 68,
  },
  {
    id: 6,
    name: "渡辺 龍",
    position: "FW",
    number: 11,
    rating: 7.5,
    goals: 8,
    assists: 3,
    matches: 16,
    form: "good",
    initials: "渡",
    speed: 90,
    shooting: 82,
  },
  {
    id: 7,
    name: "高橋 誠",
    position: "DF",
    number: 5,
    rating: 7.3,
    goals: 1,
    assists: 2,
    matches: 18,
    form: "average",
    initials: "高",
    speed: 68,
    shooting: 40,
  },
  {
    id: 8,
    name: "小林 優",
    position: "MF",
    number: 7,
    rating: 7.0,
    goals: 2,
    assists: 4,
    matches: 15,
    form: "average",
    initials: "小",
    speed: 80,
    shooting: 65,
  },
  {
    id: 9,
    name: "加藤 光",
    position: "DF",
    number: 3,
    rating: 6.8,
    goals: 0,
    assists: 1,
    matches: 14,
    form: "poor",
    initials: "加",
    speed: 70,
    shooting: 35,
  },
  {
    id: 10,
    name: "吉田 蓮",
    position: "MF",
    number: 6,
    rating: 7.4,
    goals: 3,
    assists: 7,
    matches: 19,
    form: "good",
    initials: "吉",
    speed: 76,
    shooting: 62,
  },
  {
    id: 11,
    name: "松本 悠斗",
    position: "FW",
    number: 18,
    rating: 7.1,
    goals: 6,
    assists: 2,
    matches: 14,
    form: "average",
    initials: "松",
    speed: 88,
    shooting: 75,
  },
  {
    id: 12,
    name: "井上 陽",
    position: "DF",
    number: 2,
    rating: 7.0,
    goals: 0,
    assists: 2,
    matches: 17,
    form: "average",
    initials: "井",
    speed: 74,
    shooting: 32,
  },
  {
    id: 13,
    name: "木村 海",
    position: "MF",
    number: 14,
    rating: 6.9,
    goals: 1,
    assists: 3,
    matches: 12,
    form: "average",
    initials: "木",
    speed: 79,
    shooting: 58,
  },
  {
    id: 14,
    name: "林 大地",
    position: "DF",
    number: 15,
    rating: 7.2,
    goals: 1,
    assists: 1,
    matches: 16,
    form: "good",
    initials: "林",
    speed: 65,
    shooting: 38,
  },
  {
    id: 15,
    name: "清水 翼",
    position: "GK",
    number: 21,
    rating: 6.5,
    goals: 0,
    assists: 0,
    matches: 5,
    form: "average",
    initials: "清",
    speed: 52,
    shooting: 20,
  },
  {
    id: 16,
    name: "森 隼人",
    position: "FW",
    number: 19,
    rating: 6.8,
    goals: 4,
    assists: 1,
    matches: 11,
    form: "poor",
    initials: "森",
    speed: 86,
    shooting: 72,
  },
  {
    id: 17,
    name: "池田 創",
    position: "MF",
    number: 16,
    rating: 7.3,
    goals: 2,
    assists: 5,
    matches: 15,
    form: "good",
    initials: "池",
    speed: 77,
    shooting: 64,
  },
  {
    id: 18,
    name: "橋本 凛",
    position: "DF",
    number: 22,
    rating: 6.6,
    goals: 0,
    assists: 0,
    matches: 8,
    form: "average",
    initials: "橋",
    speed: 71,
    shooting: 30,
  },
  {
    id: 19,
    name: "山口 航",
    position: "MF",
    number: 17,
    rating: 7.0,
    goals: 1,
    assists: 4,
    matches: 13,
    form: "average",
    initials: "山",
    speed: 81,
    shooting: 60,
  },
  {
    id: 20,
    name: "石川 晴",
    position: "FW",
    number: 20,
    rating: 6.7,
    goals: 3,
    assists: 1,
    matches: 10,
    form: "poor",
    initials: "石",
    speed: 84,
    shooting: 70,
  },
  {
    id: 21,
    name: "前田 樹",
    position: "DF",
    number: 23,
    rating: 6.9,
    goals: 0,
    assists: 1,
    matches: 9,
    form: "average",
    initials: "前",
    speed: 69,
    shooting: 28,
  },
  {
    id: 22,
    name: "藤田 湊",
    position: "MF",
    number: 24,
    rating: 6.4,
    goals: 0,
    assists: 2,
    matches: 7,
    form: "poor",
    initials: "藤",
    speed: 75,
    shooting: 55,
  },
  {
    id: 23,
    name: "岡田 陸",
    position: "GK",
    number: 31,
    rating: 6.2,
    goals: 0,
    assists: 0,
    matches: 2,
    form: "average",
    initials: "岡",
    speed: 48,
    shooting: 18,
  },
  {
    id: 24,
    name: "中村 蒼",
    position: "FW",
    number: 25,
    rating: 6.5,
    goals: 2,
    assists: 0,
    matches: 6,
    form: "average",
    initials: "中",
    speed: 87,
    shooting: 68,
  },
  {
    id: 25,
    name: "小川 律",
    position: "DF",
    number: 26,
    rating: 6.8,
    goals: 0,
    assists: 0,
    matches: 10,
    form: "average",
    initials: "小",
    speed: 66,
    shooting: 25,
  },
  {
    id: 26,
    name: "三浦 悠",
    position: "MF",
    number: 27,
    rating: 7.1,
    goals: 2,
    assists: 3,
    matches: 12,
    form: "good",
    initials: "三",
    speed: 78,
    shooting: 66,
  },
  {
    id: 27,
    name: "青木 駿",
    position: "DF",
    number: 28,
    rating: 6.3,
    goals: 0,
    assists: 0,
    matches: 4,
    form: "poor",
    initials: "青",
    speed: 67,
    shooting: 22,
  },
  {
    id: 28,
    name: "坂本 春",
    position: "FW",
    number: 29,
    rating: 6.6,
    goals: 1,
    assists: 1,
    matches: 5,
    form: "average",
    initials: "坂",
    speed: 83,
    shooting: 71,
  },
  {
    id: 29,
    name: "近藤 風",
    position: "MF",
    number: 30,
    rating: 6.7,
    goals: 1,
    assists: 2,
    matches: 8,
    form: "average",
    initials: "近",
    speed: 80,
    shooting: 59,
  },
  {
    id: 30,
    name: "遠藤 空",
    position: "DF",
    number: 32,
    rating: 6.4,
    goals: 0,
    assists: 0,
    matches: 3,
    form: "poor",
    initials: "遠",
    speed: 64,
    shooting: 20,
  },
  {
    id: 31,
    name: "斉藤 暖",
    position: "MF",
    number: 33,
    rating: 6.1,
    goals: 0,
    assists: 1,
    matches: 2,
    form: "average",
    initials: "斉",
    speed: 73,
    shooting: 52,
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

const positionColors: Record<string, string> = {
  FW: "border-chart-5 text-chart-5",
  MF: "border-chart-2 text-chart-2",
  DF: "border-chart-4 text-chart-4",
  GK: "border-chart-3 text-chart-3",
}

export function PlayerCardsGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {players.map((player) => (
        <Link key={player.id} href={`/players/${player.id}`}>
          <Card className="border-border/50 hover:border-primary/50 hover:bg-secondary/20 transition-all cursor-pointer group">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                      {player.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-card-foreground">
                        {player.name}
                      </span>
                      <Badge variant="outline" className={`text-xs ${positionColors[player.position]}`}>
                        {player.position}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      背番号 {player.number}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-bold text-primary">
                    {player.rating.toFixed(1)}
                  </span>
                  <Badge className={`${formColors[player.form]} text-xs mt-1`}>
                    {formLabels[player.form]}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                <div className="rounded-md bg-secondary/50 p-2">
                  <p className="text-lg font-bold text-card-foreground">{player.goals}</p>
                  <p className="text-xs text-muted-foreground">得点</p>
                </div>
                <div className="rounded-md bg-secondary/50 p-2">
                  <p className="text-lg font-bold text-card-foreground">{player.assists}</p>
                  <p className="text-xs text-muted-foreground">アシスト</p>
                </div>
                <div className="rounded-md bg-secondary/50 p-2">
                  <p className="text-lg font-bold text-card-foreground">{player.matches}</p>
                  <p className="text-xs text-muted-foreground">出場</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">スピード</span>
                  <span className="text-card-foreground">{player.speed}</span>
                </div>
                <Progress value={player.speed} className="h-1" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">シュート</span>
                  <span className="text-card-foreground">{player.shooting}</span>
                </div>
                <Progress value={player.shooting} className="h-1" />
              </div>

              <div className="flex items-center justify-end mt-3 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                <span>詳細を見る</span>
                <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
