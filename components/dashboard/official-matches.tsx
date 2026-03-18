"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

export const officialMatches = [
  {
    id: "om-1",
    date: "2026/01/15",
    opponent: "横浜FC",
    score: "3-1",
    result: "win" as const,
    competition: "J1リーグ",
    venue: "ホーム",
    attendance: 32500,
  },
  {
    id: "om-2",
    date: "2026/01/11",
    opponent: "神戸ヴィッセル",
    score: "2-2",
    result: "draw" as const,
    competition: "J1リーグ",
    venue: "アウェイ",
    attendance: 28000,
  },
  {
    id: "om-3",
    date: "2026/01/05",
    opponent: "川崎フロンターレ",
    score: "1-0",
    result: "win" as const,
    competition: "天皇杯",
    venue: "中立",
    attendance: 45000,
  },
  {
    id: "om-4",
    date: "2025/12/28",
    opponent: "浦和レッズ",
    score: "0-2",
    result: "loss" as const,
    competition: "J1リーグ",
    venue: "アウェイ",
    attendance: 55000,
  },
  {
    id: "om-5",
    date: "2025/12/22",
    opponent: "鹿島アントラーズ",
    score: "2-1",
    result: "win" as const,
    competition: "J1リーグ",
    venue: "ホーム",
    attendance: 35000,
  },
  {
    id: "om-6",
    date: "2025/12/18",
    opponent: "名古屋グランパス",
    score: "1-1",
    result: "draw" as const,
    competition: "J1リーグ",
    venue: "アウェイ",
    attendance: 22000,
  },
  {
    id: "om-7",
    date: "2025/12/14",
    opponent: "サンフレッチェ広島",
    score: "3-0",
    result: "win" as const,
    competition: "J1リーグ",
    venue: "ホーム",
    attendance: 31000,
  },
  {
    id: "om-8",
    date: "2025/12/10",
    opponent: "FC東京",
    score: "2-1",
    result: "win" as const,
    competition: "J1リーグ",
    venue: "アウェイ",
    attendance: 38000,
  },
  {
    id: "om-9",
    date: "2025/12/06",
    opponent: "セレッソ大阪",
    score: "0-0",
    result: "draw" as const,
    competition: "J1リーグ",
    venue: "ホーム",
    attendance: 29000,
  },
  {
    id: "om-10",
    date: "2025/12/01",
    opponent: "ガンバ大阪",
    score: "4-2",
    result: "win" as const,
    competition: "J1リーグ",
    venue: "アウェイ",
    attendance: 34000,
  },
]

const resultColors: Record<string, string> = {
  win: "bg-primary text-primary-foreground",
  draw: "bg-chart-3 text-foreground",
  loss: "bg-destructive text-destructive-foreground",
}

const resultLabels = {
  win: "勝",
  draw: "分",
  loss: "敗",
}

const venueColors = {
  ホーム: "bg-primary/20 text-primary border-primary/30",
  アウェイ: "bg-chart-2/20 text-chart-2 border-chart-2/30",
  中立: "bg-muted text-muted-foreground border-muted-foreground/30",
}

export function OfficialMatches() {
  const router = useRouter()

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-card-foreground">公式戦</CardTitle>
        <CardDescription>J1リーグ / カップ戦 / 天皇杯</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {officialMatches.map((match) => (
            <div
              key={match.id}
              className="flex items-center justify-between rounded-lg bg-secondary/30 p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/matches/${match.id}`)}
            >
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-24">
                  {match.date}
                </span>
                <Badge variant="outline" className="text-xs min-w-20 justify-center">
                  {match.competition}
                </Badge>
                <Badge variant="outline" className={`text-xs min-w-16 justify-center ${venueColors[match.venue as keyof typeof venueColors]}`}>
                  {match.venue}
                </Badge>
              </div>
              <div className="flex-1 text-center">
                <span className="text-sm font-medium text-card-foreground">
                  vs {match.opponent}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono font-bold text-card-foreground text-lg">
                  {match.score}
                </span>
                <Badge className={`${resultColors[match.result]} min-w-10 justify-center`}>
                  {resultLabels[match.result]}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
