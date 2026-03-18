"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Trophy, Goal, ShieldX, Users } from "lucide-react"

const targets = [
  {
    label: "勝ち点",
    current: 39,
    target: 60,
    season: 20,
    totalGames: 38,
    icon: Trophy,
    description: "シーズン目標",
  },
  {
    label: "得点",
    current: 32,
    target: 55,
    season: 20,
    totalGames: 38,
    icon: Goal,
    description: "シーズン目標",
  },
  {
    label: "失点",
    current: 20,
    target: 30,
    season: 20,
    totalGames: 38,
    icon: ShieldX,
    description: "シーズン目標（少ないほど良い）",
    inverse: true,
  },
  {
    label: "平均観客動員数",
    current: 28500,
    target: 35000,
    icon: Users,
    description: "シーズン目標",
    isAttendance: true,
  },
]

export function TargetProgress() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-card-foreground">目標達成状況</CardTitle>
        <CardDescription>シーズン目標との比較</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {targets.map((item) => {
            const Icon = item.icon
            let progress: number
            let expectedCurrent: number
            let diff: number
            let isOnTrack: boolean

            if (item.isAttendance) {
              progress = (item.current / item.target) * 100
              diff = item.current - item.target
              isOnTrack = item.current >= item.target * 0.9
            } else if (item.inverse) {
              const expectedRate = item.target / item.totalGames!
              expectedCurrent = Math.round(expectedRate * item.season!)
              diff = expectedCurrent - item.current
              isOnTrack = item.current <= expectedCurrent
              progress = Math.min(100, ((item.target - item.current) / item.target) * 100)
            } else {
              const expectedRate = item.target / item.totalGames!
              expectedCurrent = Math.round(expectedRate * item.season!)
              diff = item.current - expectedCurrent
              isOnTrack = item.current >= expectedCurrent
              progress = (item.current / item.target) * 100
            }

            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-card-foreground">
                        {item.isAttendance ? item.current.toLocaleString() : item.current}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {item.isAttendance ? item.target.toLocaleString() : item.target}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      {isOnTrack ? (
                        <TrendingUp className="h-3 w-3 text-primary" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          isOnTrack ? "text-primary" : "text-destructive"
                        }`}
                      >
                        {item.isAttendance
                          ? diff >= 0
                            ? `+${diff.toLocaleString()}人`
                            : `${diff.toLocaleString()}人`
                          : item.inverse
                          ? diff >= 0
                            ? `${Math.abs(diff)}点少ない`
                            : `${Math.abs(diff)}点多い`
                          : diff >= 0
                          ? `+${diff} (ペース以上)`
                          : `${diff} (ペース以下)`}
                      </span>
                    </div>
                  </div>
                </div>
                <Progress
                  value={Math.min(100, progress)}
                  className={`h-2 ${!isOnTrack && !item.inverse ? "[&>div]:bg-chart-5" : ""}`}
                />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
