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
  Settings, PanelLeftClose, PanelLeftOpen,
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

function SnsFooter() {
  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="grid grid-cols-2 gap-6">
        {/* Instagram */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-foreground">Instagram</span>
            <a href="https://www.instagram.com/vonds.ichihara/" target="_blank" rel="noopener noreferrer"
              className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors">
              @vonds.ichihara →
            </a>
          </div>
          <div className="rounded-lg border border-border overflow-hidden" style={{height: '450px'}}>
            <iframe
              src="https://www.instagram.com/vonds.ichihara/embed/"
              width="100%"
              height="450"
              frameBorder="0"
              scrolling="no"
              allowTransparency={true}
              className="block"
            />
          </div>
        </div>

        {/* X (Twitter) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="white">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.632 5.905-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-foreground">X (Twitter)</span>
            <a href="https://x.com/VondsTeam" target="_blank" rel="noopener noreferrer"
              className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors">
              @VondsTeam →
            </a>
          </div>
          <div className="rounded-lg border border-border overflow-hidden bg-white" style={{height: '450px'}}>
            <iframe
              src="https://syndication.twitter.com/srv/timeline-profile/screen-name/VondsTeam?dnt=false&embedId=twitter-widget-0&lang=ja&showHeader=true&showReplies=false&transparent=false&widgetsVersion=2615f7e52b7e0%3A1702314776716"
              width="100%"
              height="450"
              frameBorder="0"
              scrolling="yes"
              className="block"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [activeView, setActiveView] = useState("overview")
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className={`flex flex-col h-full border-r border-border bg-[hsl(var(--sidebar-background))] transition-all duration-200 ${collapsed ? "w-[56px]" : "w-[200px]"}`}>
        <div className={`flex items-center border-b border-border ${collapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"}`}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-white border border-border">
            <Image src="/vonds-logo.png" alt="VONDS市原" width={44} height={44} className="object-contain" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-bold text-foreground leading-tight">VONDS市原</p>
              <p className="text-xs text-muted-foreground">2025-26 シーズン</p>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          {!collapsed && <p className="px-4 py-1 text-xs font-medium text-muted-foreground">メインメニュー</p>}
          <nav className="mt-1">
            {mainMenuItems.map((item) => (
              <button key={item.id} onClick={() => setActiveView(item.id)} title={collapsed ? item.label : undefined}
                className={`flex w-full items-center gap-3 py-2 text-sm transition-colors
                  ${collapsed ? "justify-center px-0" : "px-4"}
                  ${activeView === item.id ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-accent"}`}>
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="border-t border-border py-2">
          <button title={collapsed ? "設定" : undefined}
            className={`flex w-full items-center gap-3 py-2 text-sm text-foreground hover:bg-accent ${collapsed ? "justify-center px-0" : "px-4"}`}>
            <Settings className="h-4 w-4 shrink-0" />
            {!collapsed && "設定"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
          <button onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
          <h1 className="text-lg font-semibold">{viewTitles[activeView] || "ダッシュボード"}</h1>
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground"><span>2025-26</span></div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {activeView === "overview" && (
            <div className="space-y-6">
              <MatchInfoCard />
              <div className="grid gap-6 lg:grid-cols-2"><LeagueStandings /><TargetProgress /></div>
              <div className="grid gap-6 lg:grid-cols-2"><PlayerRatings /><RecentMatches /></div>
              <SnsFooter />
            </div>
          )}
          {activeView === "players" && (
            <div className="space-y-6"><UpcomingMatches /><PlayerCardsGrid /><SnsFooter /></div>
          )}
          {activeView === "official-matches" && (
            <div className="space-y-6"><OfficialMatches /><SnsFooter /></div>
          )}
          {activeView === "training-matches" && (
            <div className="space-y-6"><TrainingMatches /><SnsFooter /></div>
          )}
          {activeView === "training" && (
            <div className="space-y-6"><StatsCards /><SnsFooter /></div>
          )}
          {activeView === "events" && (
            <div className="space-y-6"><UpcomingMatches /><SnsFooter /></div>
          )}
        </main>
      </div>
    </div>
  )
}
