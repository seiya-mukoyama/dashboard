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
  Settings, ChevronLeft, ChevronRight,
} from "lucide-react"
import Image from "next/image"

const mainMenuItems = [
  { id: "overview", label: "チーム", icon: LayoutDashboard },
  { id: "players", label: "選手", icon: Users },
  { id: "official-matches", label: "公式戦", icon: Medal },
  { id: "training-matches", label: "トレーニングマッチ", icon: Dumbbell },
  { id: "training", label: "トレーニング", icon: Target },
  { id: "events", label: "イベント", icon: Calendar },
]

const viewTitles: Record<string, string> = {
  overview: "チーム",
  players: "選手",
  "official-matches": "公式戦",
  "training-matches": "トレーニングマッチ",
  training: "トレーニング",
  events: "イベント",
}

export default function DashboardPage() {
  const [activeView, setActiveView] = useState("overview")
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* サイドバー */}
      <div
        className={`flex flex-col h-full border-r border-border bg-[hsl(var(--sidebar-background))] transition-all duration-200 ${collapsed ? "w-[56px]" : "w-[200px]"}`}
      >
        {/* ロゴ */}
        <div className={`flex items-center border-b border-border ${collapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-white border border-border">
            <Image
              src="/vonds-logo.png"
              alt="VONDS市原"
              width={36}
              height={36}
              className="object-contain"
              onError={() => {}}
            />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-bold text-foreground leading-tight">VONDS市原</p>
              <p className="text-xs text-muted-foreground">2025-26 シーズン</p>
            </div>
          )}
        </div>

        {/* メインメニュー */}
        <div className="flex-1 overflow-y-auto py-3">
          {!collapsed && (
            <p className="px-4 py-1 text-xs font-medium text-muted-foreground">メインメニュー</p>
          )}
          <nav className="mt-1">
            {mainMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                title={collapsed ? item.label : undefined}
                className={`flex w-full items-center gap-3 py-2 text-sm transition-colors
                  ${collapsed ? "justify-center px-0" : "px-4"}
                  ${activeView === item.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-accent"
                  }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* フッター */}
        <div className="border-t border-border py-2">
          <button
            title={collapsed ? "設定" : undefined}
            className={`flex w-full items-center gap-3 py-2 text-sm text-foreground hover:bg-accent
              ${collapsed ? "justify-center px-0" : "px-4"}`}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!collapsed && "設定"}
          </button>
          {/* 折りたたみボタン */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`flex w-full items-center gap-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground
              ${collapsed ? "justify-center px-0" : "px-4"}`}
          >
            {collapsed
              ? <ChevronRight className="h-4 w-4 shrink-0" />
              : <><ChevronLeft className="h-4 w-4 shrink-0" /><span>たたむ</span></>
            }
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
        </main>
      </div>
    </div>
  )
}
