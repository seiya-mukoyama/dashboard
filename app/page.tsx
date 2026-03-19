"use client"

import { useState } from "react"
import { LeagueStandings } from "@/components/dashboard/league-standings"
import { TargetProgress } from "@/components/dashboard/target-progress"
import { PlayerRatings } from "@/components/dashboard/player-ratings"
import { RecentMatches } from "@/components/dashboard/recent-matches"
import { MatchInfoCard } from "@/components/dashboard/match-info-card"
import { OfficialMatches } from "@/components/dashboard/official-matches"
import { TrainingMatches } from "@/components/dashboard/training-matches"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { UpcomingMatches } from "@/components/dashboard/upcoming-matches"
import { PlayerCardsGrid } from "@/components/dashboard/player-cards-grid"
import {
  LayoutDashboard, Users, Medal, Dumbbell, Target, Calendar,
  Settings, PanelLeftClose, PanelLeftOpen, Heart, Repeat2,
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

const xPosts = [
  { id: 1, text: "【試合結果】JFLカップ 第1節\nVONDS市原FC 2-1 いわてグルージャ盛岡\n\n初戦勝利！次節も応援よろしくお願いします⚽️🟡", date: "3月22日", likes: 142, retweets: 38 },
  { id: 2, text: "【選手紹介】MF 山本 健選手\n今シーズンも精力的なプレーに期待！\n#VONDS市原 #JFL", date: "3月20日", likes: 89, retweets: 21 },
  { id: 3, text: "本日のトレーニングの様子をお届け📸\n開幕に向けて仕上がってきています！\n#VONDS市原 #JFL2026", date: "3月19日", likes: 67, retweets: 15 },
  { id: 4, text: "【お知らせ】ホームゲーム チケット発売開始！\n市原臨海競技場にぜひ来てください🏟️\nhttps://vonds.jp/ticket", date: "3月18日", likes: 203, retweets: 87 },
  { id: 5, text: "【選手紹介】FW 田中 翔太選手\n昨シーズン12ゴールの得点王！\n今季も期待してください🔥\n#VONDS市原", date: "3月17日", likes: 312, retweets: 95 },
  { id: 6, text: "本日は選手たちのオフ日🏖️\nリフレッシュして明日からまた練習頑張ります！\n#VONDS市原 #チームビルディング", date: "3月16日", likes: 54, retweets: 12 },
  { id: 7, text: "【試合プレビュー】明日のJFLカップに向けて準備完了✅\nスタジアムで一緒に戦いましょう！\n#VONDS市原 #JFL", date: "3月15日", likes: 178, retweets: 63 },
  { id: 8, text: "新体制発表！今シーズンも熱いサッカーをお届けします⚽\n監督・選手一同、全力で戦います！\n#VONDS市原 #2026シーズン", date: "3月10日", likes: 445, retweets: 132 },
]

function SnsFooter() {
  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="grid grid-cols-2 gap-6">
        {/* Instagram */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">Instagram</span>
              <span className="ml-2 text-xs text-muted-foreground">フォロワー 6,017人</span>
            </div>
            <a href="https://www.instagram.com/vonds.ichihara/" target="_blank" rel="noopener noreferrer"
              className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors">
              @vonds.ichihara →
            </a>
          </div>
          <div className="rounded-lg border border-border overflow-hidden flex-1">
            <iframe src="https://www.instagram.com/vonds.ichihara/embed/" width="100%" height="500"
              frameBorder="0" scrolling="yes" allowTransparency={true} className="block" />
          </div>
        </div>

        {/* X (Twitter) */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="white">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.632 5.905-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">X (Twitter)</span>
              <span className="ml-2 text-xs text-muted-foreground">フォロワー 2,341人</span>
            </div>
            <a href="https://x.com/VondsTeam" target="_blank" rel="noopener noreferrer"
              className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors">
              @VondsTeam →
            </a>
          </div>
          <div className="rounded-lg border border-border overflow-y-auto divide-y divide-border" style={{ height: 500 }}>
            {xPosts.map((post) => (
              <a key={post.id} href="https://x.com/VondsTeam" target="_blank" rel="noopener noreferrer"
                className="flex flex-col gap-2 p-4 bg-card hover:bg-accent transition-colors group block">
                <div className="flex items-start gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="white">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.632 5.905-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-xs font-semibold text-foreground">VONDS市原FC</span>
                      <span className="text-xs text-muted-foreground">@VondsTeam · {post.date}</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{post.text}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-pink-500 transition-colors">
                        <Heart className="h-3 w-3" />{post.likes}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-green-500 transition-colors">
                        <Repeat2 className="h-3 w-3" />{post.retweets}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
            <a href="https://x.com/VondsTeam" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 bg-card hover:bg-accent transition-colors text-xs text-muted-foreground hover:text-primary">
              X でもっと見る →
            </a>
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
          <div className="ml-auto text-sm text-muted-foreground">2025-26</div>
        </header>
        <main className="flex-1 overflow-auto p-6">

          {/* チームページ: 選手評価→今後5試合の予定 に変更 */}
          {activeView === "overview" && (
            <div className="space-y-6">
              <MatchInfoCard />
              <div className="grid gap-6 lg:grid-cols-2">
                <LeagueStandings />
                <TargetProgress />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <UpcomingMatches />
                <RecentMatches />
              </div>
              <SnsFooter />
            </div>
          )}

          {/* 選手ページ: 今後5試合の予定→選手評価 に変更 */}
          {activeView === "players" && (
            <div className="space-y-6">
              <PlayerRatings />
              <PlayerCardsGrid />
              <SnsFooter />
            </div>
          )}

          {activeView === "official-matches" && <div className="space-y-6"><OfficialMatches /><SnsFooter /></div>}
          {activeView === "training-matches" && <div className="space-y-6"><TrainingMatches /><SnsFooter /></div>}
          {activeView === "training" && <div className="space-y-6"><StatsCards /><SnsFooter /></div>}
          {activeView === "events" && <div className="space-y-6"><UpcomingMatches /><SnsFooter /></div>}
        </main>
      </div>
    </div>
  )
}
