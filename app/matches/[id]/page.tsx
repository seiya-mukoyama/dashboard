"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, Clock, Users, Target, TrendingUp } from "lucide-react"
import { officialMatches } from "@/components/dashboard/official-matches"
import { trainingMatches } from "@/components/dashboard/training-matches"

// 試合に出場した選手データ
const matchPlayerStats = [
  { id: "1", name: "田中 翔太", number: 10, position: "FW", playTime: 90, goals: 1, assists: 1, packingRate: 78.5, impact: 8.2, distance: 10.8, lineBreaks: 12 },
  { id: "2", name: "山田 健一", number: 7, position: "MF", playTime: 90, goals: 1, assists: 0, packingRate: 72.3, impact: 7.8, distance: 11.2, lineBreaks: 8 },
  { id: "3", name: "鈴木 大輔", number: 4, position: "DF", playTime: 90, goals: 0, assists: 0, packingRate: 65.2, impact: 7.1, distance: 9.5, lineBreaks: 3 },
  { id: "4", name: "佐藤 誠", number: 1, position: "GK", playTime: 90, goals: 0, assists: 0, packingRate: 45.0, impact: 6.5, distance: 5.2, lineBreaks: 0 },
  { id: "5", name: "高橋 翼", number: 11, position: "FW", playTime: 78, goals: 1, assists: 0, packingRate: 75.8, impact: 7.9, distance: 9.8, lineBreaks: 10 },
  { id: "6", name: "伊藤 航", number: 8, position: "MF", playTime: 90, goals: 0, assists: 1, packingRate: 70.1, impact: 7.5, distance: 11.5, lineBreaks: 7 },
  { id: "7", name: "渡辺 蓮", number: 6, position: "MF", playTime: 90, goals: 0, assists: 0, packingRate: 68.9, impact: 7.2, distance: 10.9, lineBreaks: 5 },
  { id: "8", name: "中村 優斗", number: 3, position: "DF", playTime: 90, goals: 0, assists: 0, packingRate: 62.4, impact: 6.8, distance: 9.2, lineBreaks: 2 },
  { id: "9", name: "小林 拓海", number: 5, position: "DF", playTime: 90, goals: 0, assists: 1, packingRate: 64.7, impact: 7.0, distance: 9.8, lineBreaks: 4 },
  { id: "10", name: "加藤 龍馬", number: 2, position: "DF", playTime: 90, goals: 0, assists: 0, packingRate: 61.3, impact: 6.6, distance: 10.1, lineBreaks: 3 },
  { id: "11", name: "松本 颯", number: 14, position: "MF", playTime: 65, goals: 0, assists: 0, packingRate: 69.5, impact: 7.3, distance: 7.8, lineBreaks: 6 },
  { id: "12", name: "森田 陸", number: 9, position: "FW", playTime: 25, goals: 0, assists: 0, packingRate: 71.2, impact: 6.9, distance: 3.2, lineBreaks: 2 },
  { id: "13", name: "岡田 海斗", number: 17, position: "MF", playTime: 12, goals: 0, assists: 0, packingRate: 66.8, impact: 6.4, distance: 1.5, lineBreaks: 1 },
]

const positionColors: Record<string, string> = {
  FW: "bg-chart-5/20 text-chart-5",
  MF: "bg-primary/20 text-primary",
  DF: "bg-chart-2/20 text-chart-2",
  GK: "bg-chart-3/20 text-chart-3",
}

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  // 公式戦とトレーニングマッチから試合を検索
  const match = [...officialMatches, ...trainingMatches].find(m => m.id === id)

  if (!match) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">試合が見つかりませんでした</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOfficial = match.id.startsWith("om")
  const resultColors = {
    win: "bg-primary text-primary-foreground",
    draw: "bg-chart-3 text-foreground",
    loss: "bg-destructive text-destructive-foreground",
  }
  const resultLabels = {
    win: "勝利",
    draw: "引分",
    loss: "敗北",
  }

  // チーム全体のサマリー
  const teamStats = {
    totalDistance: matchPlayerStats.reduce((sum, p) => sum + p.distance, 0).toFixed(1),
    avgPackingRate: (matchPlayerStats.reduce((sum, p) => sum + p.packingRate, 0) / matchPlayerStats.length).toFixed(1),
    avgImpact: (matchPlayerStats.reduce((sum, p) => sum + p.impact, 0) / matchPlayerStats.length).toFixed(1),
    totalLineBreaks: matchPlayerStats.reduce((sum, p) => sum + p.lineBreaks, 0),
    totalGoals: matchPlayerStats.reduce((sum, p) => sum + p.goals, 0),
    totalAssists: matchPlayerStats.reduce((sum, p) => sum + p.assists, 0),
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* ヘッダー */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        戻る
      </Button>

      {/* 試合情報 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                {isOfficial ? (match as typeof officialMatches[0]).competition : (match as typeof trainingMatches[0]).type}
              </Badge>
              {isOfficial && (
                <Badge variant="outline" className="text-sm">
                  {(match as typeof officialMatches[0]).venue}
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">{match.date}</span>
            </div>
            <Badge className={`${resultColors[match.result]} text-lg px-4 py-1`}>
              {resultLabels[match.result]}
            </Badge>
          </div>
          <div className="flex items-center justify-center gap-8 py-6">
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">FC Analytics</p>
              <p className="text-sm text-muted-foreground">ホーム</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold text-foreground">{match.score}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{match.opponent}</p>
              <p className="text-sm text-muted-foreground">アウェイ</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* チームサマリー */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総走行距離</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{teamStats.totalDistance} km</div>
            <p className="text-xs text-muted-foreground">全選手合計</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均パッキングレート</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{teamStats.avgPackingRate}%</div>
            <Progress value={parseFloat(teamStats.avgPackingRate)} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均インパクト</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{teamStats.avgImpact}</div>
            <Progress value={parseFloat(teamStats.avgImpact) * 10} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ラインブレイク</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{teamStats.totalLineBreaks}</div>
            <p className="text-xs text-muted-foreground">全選手合計</p>
          </CardContent>
        </Card>
      </div>

      {/* 選手別スタッツ */}
      <Card>
        <CardHeader>
          <CardTitle>選手別スタッツ</CardTitle>
          <CardDescription>出場選手のパフォーマンス詳細</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>選手名</TableHead>
                  <TableHead className="text-center">Pos</TableHead>
                  <TableHead className="text-center">出場時間</TableHead>
                  <TableHead className="text-center">得点</TableHead>
                  <TableHead className="text-center">アシスト</TableHead>
                  <TableHead className="text-center">パッキング率</TableHead>
                  <TableHead className="text-center">インパクト</TableHead>
                  <TableHead className="text-center">走行距離</TableHead>
                  <TableHead className="text-center">ラインブレイク</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matchPlayerStats.map((player) => (
                  <TableRow
                    key={player.id}
                    className="cursor-pointer hover:bg-secondary/30"
                    onClick={() => router.push(`/players/${player.id}`)}
                  >
                    <TableCell className="font-mono font-bold text-muted-foreground">
                      {player.number}
                    </TableCell>
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={positionColors[player.position]}>
                        {player.position}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {player.playTime}&#39;
                    </TableCell>
                    <TableCell className="text-center">
                      {player.goals > 0 ? (
                        <span className="font-bold text-primary">{player.goals}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {player.assists > 0 ? (
                        <span className="font-bold text-chart-2">{player.assists}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-mono text-sm">{player.packingRate.toFixed(1)}%</span>
                        <Progress value={player.packingRate} className="w-16 h-2" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-mono text-sm">{player.impact.toFixed(1)}</span>
                        <Progress value={player.impact * 10} className="w-16 h-2" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {player.distance.toFixed(1)} km
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {player.lineBreaks}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
