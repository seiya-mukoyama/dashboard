"use client"

import { useState } from "react"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { PlayerRatings } from "@/components/dashboard/player-ratings"
import { TeamRadarChart } from "@/components/dashboard/team-radar-chart"
import { RecentMatches } from "@/components/dashboard/recent-matches"
import { OfficialMatches } from "@/components/dashboard/official-matches"
import { TrainingMatches } from "@/components/dashboard/training-matches"
import { GoalsChart } from "@/components/dashboard/goals-chart"
import { LeagueStandings } from "@/components/dashboard/league-standings"
import { TargetProgress } from "@/components/dashboard/target-progress"
import { PlayerCardsGrid } from "@/components/dashboard/player-cards-grid"
import { MatchInfoCard } from "@/components/dashboard/match-info-card"
import { UpcomingMatches } from "@/components/dashboard/upcoming-matches"
import { StatsCards } from "@/components/dashboard/stats-cards"
import {
  LayoutDashboard, Users, Medal, Dumbbell, Target, Calendar,
  TrendingUp, Shield, Settings, ChevronDown, Trophy,
} from "lucide-react"

const mainMenuItems = [
  { id: "overview", label: "チーム", icon: LayoutDashboard },
  { id: "players", label: "選手", icon: Users },
  { id: "official-matches", label: "公式戦", icon: Medal },
  { id: "training-matches", label: "トレーニングマッチ", icon: Dumbbell },
  { id: "training", label: "トレーニング", icon: Target },
  { id: "events", label: "イベント", icon: Calendar },
]

const analysisItems = [
  { id: "performance", label: "パフォーマンス", icon: TrendingUp },
  { id: "goals", label: "ゴール分析", icon: Shield },
]

const viewTitles: Record<string, string> = {
  overview: "チーム",
  players: "選手",
  team: "チーム分析",
  "official-matches": "公式戦",
  "training-matches": "トレーニングマッチ",
  training: "トレーニング",
  events: "イベント",
  performance: "パフォーマンス分析",
  goals: "ゴール分析",
}

export default function DashboardPage() {
  const [activeView, setActiveView] = useState("overview")
  const [analysisOpen, setAnalysisOpen] = useState(true)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* サイドバー */}
      <div className="w-[200px] shrink-0 flex flex-col h-full border-r border-border bg-[hsl(var(--sidebar-background))]">
        {/* ロゴ */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Trophy className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">VONDS市原</p>
            <p className="text-xs text-muted-foreground">2025-26 シーズン</p>
          </div>
        </div>

        {/* メインメニュー */}
        <div className="flex-1 overflow-y-auto py-3">
          <p className="px-4 py-1 text-xs font-medium text-muted-foreground">メインメニュー</p>
          <nav className="mt-1">
            {mainMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors
                  ${activeView === item.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-accent"
                  }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* 詳細分析 */}
          <div className="mt-3">
            <button
              onClick={() => setAnalysisOpen(!analysisOpen)}
              className="flex w-full items-center justify-between px-4 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <span>詳細分析</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${analysisOpen ? "rotate-180" : ""}`} />
            </button>
            {analysisOpen && (
              <nav className="mt-1">
                {analysisItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors
                      ${activeView === item.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-accent"
                      }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                ))}
              </nav>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="border-t border-border py-3">
          <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent">
            <Settings className="h-4 w-4 shrink-0" />
            設定
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ヘッダー */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6">
          <h1 className="text-lg font-semibold">{viewTitles[activeView] || "ダッシュボード"}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>2025-26</span>
          </div>
        </header>

        {/* コンテンツ */}
        <main className="flex-1 overflow-auto p-6">
          {activeView === "overview" && (
            <div className="space-y-6">
              <MatchInfoCard />
              <div className="grid gap-6 lg:grid-cols-2">
                <LeagueStandings />
                <TargetProgress />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <PlayerRatings />
                <RecentMatches />
              </div>
            </div>
          )}
          {activeView === "players" && (
            <div className="space-y-6">
              <UpcomingMatches />
              <PlayerCardsGrid />
            </div>
          )}
          {activeView === "official-matches" && <OfficialMatches />}
          {activeView === "training-matches" && <TrainingMatches />}
          {activeView === "training" && <StatsCards />}
          {activeView === "events" && <UpcomingMatches />}
          {activeView === "performance" && (
            <div className="space-y-6">
              <StatsCards />
              <PerformanceChart />
              <div className="grid gap-6 lg:grid-cols-2">
                <TeamRadarChart />
                <GoalsChart />
              </div>
            </div>
          )}
          {activeView === "goals" && (
            <div className="space-y-6">
              <StatsCards />
              <div className="grid gap-6 lg:grid-cols-2">
                <GoalsChart />
                <PlayerRatings />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
