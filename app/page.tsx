"use client"

import { useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { Header } from "@/components/dashboard/header"
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

  return (
    <SidebarProvider defaultOpen={true}>
      <SidebarNav activeView={activeView} onViewChange={setActiveView} />
      <SidebarInset>
        <Header title={viewTitles[activeView] || "ダッシュボード"} />
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

          {activeView === "team" && (
            <div className="space-y-6">
              <StatsCards />
              <div className="grid gap-6 lg:grid-cols-2">
                <TeamRadarChart />
                <PerformanceChart />
              </div>
              <LeagueStandings />
            </div>
          )}

          {activeView === "official-matches" && (
            <div className="space-y-6">
              <OfficialMatches />
            </div>
          )}

          {activeView === "training-matches" && (
            <div className="space-y-6">
              <TrainingMatches />
            </div>
          )}

          {activeView === "training" && (
            <div className="space-y-6">
              <StatsCards />
            </div>
          )}

          {activeView === "events" && (
            <div className="space-y-6">
              <UpcomingMatches />
            </div>
          )}

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
      </SidebarInset>
    </SidebarProvider>
  )
}
