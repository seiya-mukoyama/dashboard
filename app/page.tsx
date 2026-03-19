"use client"

import { useState, useEffect } from "react"
import { LeagueStandings } from "@/components/dashboard/league-standings"
import { TargetProgress } from "@/components/dashboard/target-progress"
import { RecentMatches } from "@/components/dashboard/recent-matches"
import { MatchInfoCard } from "@/components/dashboard/match-info-card"
import { OfficialMatches } from "@/components/dashboard/official-matches"
import { TrainingMatches } from "@/components/dashboard/training-matches"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { UpcomingMatches } from "@/components/dashboard/upcoming-matches"
import { PlayerCardsGrid, type Player } from "@/components/dashboard/player-cards-grid"
import { BodyCompositionChart } from "@/components/dashboard/body-composition-chart"
import { InjuryHistory } from "@/components/dashboard/injury-history"
import { FeedbackHistory } from "@/components/dashboard/feedback-history"
import { MatchPerformance } from "@/components/dashboard/match-performance"
import {
  LayoutDashboard, Users, Medal, Dumbbell, Target, Calendar,
  Settings, PanelLeftClose, PanelLeftOpen, Heart, Repeat2,
  ArrowLeft, ExternalLink, Cake, Ruler, Weight,
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

const positionColors: Record<string, string> = {
  GK: "bg-yellow-100 text-yellow-800 border-yellow-300",
  DF: "bg-blue-100 text-blue-800 border-blue-300",
  MF: "bg-green-100 text-green-800 border-green-300",
  FW: "bg-red-100 text-red-800 border-red-300",
}

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
  { id: 4, text: "【お知らせ】ホームゲーム チケット発売開始！\n市原臨海競技場にぜひ来てください🏟️", date: "3月18日", likes: 203, retweets: 87 },
  { id: 5, text: "【選手紹介】FW 田中 翔太選手\n昨シーズン12ゴールの得点王！\n今季も期待してください🔥\n#VONDS市原", date: "3月17日", likes: 312, retweets: 95 },
  { id: 6, text: "本日は選手たちのオフ日🏖️\nリフレッシュして明日からまた練習頑張ります！\n#VONDS市原", date: "3月16日", likes: 54, retweets: 12 },
  { id: 7, text: "【試合プレビュー】明日のJFLカップに向けて準備完了✅\nスタジアムで一緒に戦いましょう！\n#VONDS市原 #JFL", date: "3月15日", likes: 178, retweets: 63 },
  { id: 8, text: "新体制発表！今シーズンも熱いサッカーをお届けします⚽\n監督・選手一同、全力で戦います！\n#VONDS市原 #2026シーズン", date: "3月10日", likes: 445, retweets: 132 },
]

// 最大速度はスタッツに含む（全11項目）
const STATS_CONFIG = [
  { key: "packingRate", label: "パッキングレート", unit: "",     color: "text-blue-600" },
  { key: "pReceive",   label: "Pレシーブ",         unit: "",     color: "text-blue-400" },
  { key: "impect",     label: "インペクト",         unit: "",     color: "text-purple-600" },
  { key: "iReceive",   label: "Iレシーブ",          unit: "",     color: "text-purple-400" },
  { key: "maxSpeed",   label: "最大速度",           unit: "km/h", color: "text-orange-500" },
  { key: "hiDistance", label: "HI",                unit: "m",    color: "text-red-500" },
  { key: "playTime",   label: "出場時間",           unit: "分",   color: "text-gray-600" },
  { key: "goals",      label: "ゴール",             unit: "",     color: "text-green-600" },
  { key: "assists",    label: "アシスト",           unit: "",     color: "text-green-500" },
  { key: "preAssists", label: "プレアシスト",       unit: "",     color: "text-teal-500" },
  { key: "lineBreaks", label: "ラインブレイク",     unit: "",     color: "text-indigo-500" },
]

type PlayerStats = {
  maxSpeed: number | null
  packingRate: number | null
  pReceive: number | null
  impect: number | null
  iReceive: number | null
  hiDistance: number | null
  playTime: number | null
  goals: number | null
  assists: number | null
  preAssists: number | null
  lineBreaks: number | null
}

function StatCard({ label, value, unit, color }: { label: string; value: number | null; unit: string; color: string }) {
  return (
    <div className="rounded-xl bg-card border border-border p-3 space-y-0.5">
      <p className="text-xs text-muted-foreground leading-tight">{label}</p>
      <p className={`text-lg font-bold ${value !== null ? color : "text-muted-foreground"}`}>
        {value !== null ? `${value}${unit ? " " + unit : ""}` : "—"}
      </p>
    </div>
  )
}

function SnsFooter() {
  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="grid grid-cols-2 gap-6">
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
              className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors">@vonds.ichihara →</a>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <iframe src="https://www.instagram.com/vonds.ichihara/embed/" width="100%" height="500"
              frameBorder="0" scrolling="yes" allowTransparency={true} className="block" />
          </div>
        </div>
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
              className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors">@VondsTeam →</a>
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

function calcAge(birthdate: string): number | null {
  if (!birthdate) return null
  const parts = birthdate.split("/")
  if (parts.length !== 3) return null
  const birth = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function PlayerDetail({ player, onBack }: { player: Player; onBack: () => void }) {
  const age = calcAge(player.birthdate)
  const [maxSpeed, setMaxSpeed] = useState<number | null>(null)
  const [stats] = useState<PlayerStats>({
    maxSpeed: null, packingRate: null, pReceive: null, impect: null,
    iReceive: null, hiDistance: null, playTime: null,
    goals: null, assists: null, preAssists: null, lineBreaks: null,
  })

  useEffect(() => {
    fetch(`/api/speed?name=${encodeURIComponent(player.name)}`)
      .then(r => r.json())
      .then(d => { if (d.maxSpeed) setMaxSpeed(d.maxSpeed) })
      .catch(() => {})
  }, [player.name])

  const displayStats: PlayerStats = { ...stats, maxSpeed }

  return (
    <div className="space-y-6">
      <button onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        選手一覧に戻る
      </button>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* 写真 */}
        <div className="lg:col-span-1">
          <div className="relative bg-gradient-to-b from-[hsl(142,72%,85%)] to-[hsl(142,72%,94%)] rounded-2xl overflow-hidden aspect-square shadow-sm">
            <Image src={player.image} alt={player.name} fill
              className="object-contain object-bottom" unoptimized />
            <div className="absolute top-3 left-3">
              <span className={`text-xs font-bold px-2 py-1 rounded-md border ${positionColors[player.position] || "bg-gray-100 text-gray-700 border-gray-300"}`}>
                {player.position}
              </span>
            </div>
          </div>
        </div>

        {/* 右：名前 + 基本情報 + スタッツ */}
        <div className="lg:col-span-2 space-y-4">

          {/* 名前行：名前（小さめ）+ 公式サイトリンク（右寄せ） */}
          <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">{player.name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{player.nameEn}</p>
            </div>
            {player.profileUrl && (
              <a href={player.profileUrl} target="_blank" rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-xs text-foreground">
                <ExternalLink className="h-3.5 w-3.5" />
                公式サイトで詳細を見る
              </a>
            )}
          </div>

          {/* 生年月日・年齢・身長・体重 */}
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-xl bg-card border border-border p-3 space-y-0.5">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Cake className="h-3 w-3" /><span className="text-xs">生年月日</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{player.birthdate || "—"}</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-3 space-y-0.5">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" /><span className="text-xs">年齢</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{age !== null ? `${age}歳` : "—"}</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-3 space-y-0.5">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Ruler className="h-3 w-3" /><span className="text-xs">身長</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{player.height ? `${player.height} cm` : "—"}</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-3 space-y-0.5">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Weight className="h-3 w-3" /><span className="text-xs">体重</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{player.weight ? `${player.weight} kg` : "—"}</p>
            </div>
          </div>

          {/* スタッツ 4カラム（最大速度含む全11項目） */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">スタッツ</p>
            <div className="grid grid-cols-4 gap-2">
              {STATS_CONFIG.map(({ key, label, unit, color }) => (
                <StatCard
                  key={key}
                  label={label}
                  value={displayStats[key as keyof PlayerStats]}
                  unit={unit}
                  color={color}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 体組成推移グラフ */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">体組成推移</h3>
        <BodyCompositionChart playerName={player.name} />
      </div>

      {/* 怪我履歴 */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">🩹 怪我の履歴</h3>
        <InjuryHistory playerName={player.name} />
      </div>

      {/* フィードバック履歴 */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">💬 フィードバック履歴</h3>
        <FeedbackHistory playerName={player.name} />
      </div>

      {/* 出場試合と成績 */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">📋 出場試合と成績</h3>
        <MatchPerformance playerName={player.name} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [activeView, setActiveView] = useState("overview")
  const [collapsed, setCollapsed] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  const handleViewChange = (view: string) => {
    setActiveView(view)
    setSelectedPlayer(null)
  }

  const headerTitle = selectedPlayer
    ? selectedPlayer.name
    : viewTitles[activeView] || "ダッシュボード"

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
              <button key={item.id} onClick={() => handleViewChange(item.id)} title={collapsed ? item.label : undefined}
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
          <h1 className="text-lg font-semibold">{headerTitle}</h1>
          <div className="ml-auto text-sm text-muted-foreground">2025-26</div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {activeView === "overview" && (
            <div className="space-y-6">
              <MatchInfoCard />
              <div className="grid gap-6 lg:grid-cols-2">
                <LeagueStandings />
                <TargetProgress />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <RecentMatches />
                <UpcomingMatches />
              </div>
              <SnsFooter />
            </div>
          )}
          {activeView === "players" && (
            selectedPlayer
              ? <PlayerDetail player={selectedPlayer} onBack={() => setSelectedPlayer(null)} />
              : <PlayerCardsGrid onSelectPlayer={setSelectedPlayer} />
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
