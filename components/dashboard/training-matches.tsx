"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

export const trainingMatches = [
  {
    id: "tm-1",
    date: "2026/01/18",
    opponent: "U-23チーム",
    score: "4-1",
    result: "win" as const,
    type: "紅白戦",
    duration: 90,
  },
  {
    id: "tm-2",
    date: "2026/01/14",
    opponent: "地域選抜",
    score: "2-0",
    result: "win" as const,
    type: "練習試合",
    duration: 90,
  },
  {
    id: "tm-3",
    date: "2026/01/10",
    opponent: "大学選抜",
    score: "3-3",
    result: "draw" as const,
    type: "練習試合",
    duration: 90,
  },
  {
    id: "tm-4",
    date: "2026/01/07",
    opponent: "U-23チーム",
    score: "2-1",
    result: "win" as const,
    type: "紅白戦",
    duration: 60,
  },
  {
    id: "tm-5",
    date: "2026/01/03",
    opponent: "海外クラブA",
    score: "1-2",
    result: "loss" as const,
    type: "キャンプ試合",
    duration: 90,
  },
  {
    id: "tm-6",
    date: "2025/12/30",
    opponent: "海外クラブB",
    score: "0-0",
    result: "draw" as const,
    type: "キャンプ試合",
    duration: 90,
  },
  {
    id: "tm-7",
    date: "2025/12/26",
    opponent: "U-23チーム",
    score: "5-2",
    result: "win" as const,
    type: "紅白戦",
    duration: 90,
  },
  {
    id: "tm-8",
    date: "2025/12/20",
    opponent: "高校選抜",
    score: "6-0",
    result: "win" as const,
    type: "練習試合",
    duration: 70,
  },
]

const resultColors = {
  win: "bg-primary text-primary-foreground",
  draw: "bg-chart-3 text-foreground",
  loss: "bg-destructive text-destructive-foreground",
}

const resultLabels = {
  win: "勝",
  draw: "分",
  loss: "敗",
}

const typeColors = {
  紅白戦: "bg-chart-5/20 text-chart-5 border-chart-5/30",
  練習試合: "bg-chart-2/20 text-chart-2 border-chart-2/30",
  キャンプ試合: "bg-chart-4/20 text-chart-4 border-chart-4/30",
}

export function TrainingMatches() {
  const router = useRouter()

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-card-foreground">トレーニングマッチ</CardTitle>
        <CardDescription>紅白戦 / 練習試合 / キャンプ試合</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trainingMatches.map((match) => (
            <div
              key={match.id}
              className="flex items-center justify-between rounded-lg bg-secondary/30 p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/matches/${match.id}`)}
            >
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-24">
                  {match.date}
                </span>
                <Badge variant="outline" className={`text-xs min-w-20 justify-center ${typeColors[match.type as keyof typeof typeColors]}`}>
                  {match.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {match.duration}分
                </span>
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
