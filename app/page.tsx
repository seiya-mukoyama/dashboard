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
  Settings, Menu,
  ArrowLeft, ExternalLink, Cake, Ruler, Weight,
} from "lucide-react"
import Image from "next/image"

const mainMenuItems = [
  { id: "overview", label: "チーム", icon: LayoutDashboard },
  { id: "players", label: "選手", icon: Users },
  { id: "official-matches", label: "公式戦", icon: Medal },
  { id: "training-matches", label: "トレーニングマッチ", icon: Dumbbell },
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


// スタッツ（5項目）
const STATS_CONFIG = [
  { key: "maxSpeed",    label: "最大速度",     unit: "km/h", color: "text-orange-500" },
  { key: "playTime",    label: "出場時間",     unit: "分",   color: "text-gray-600" },
  { key: "goals",       label: "ゴール",       unit: "",     color: "text-green-600" },
  { key: "assists",     label: "アシスト",     unit: "",     color: "text-green-500" },
  { key: "preAssists",  label: "プレアシスト", unit: "",     color: "text-teal-500" },
]

type PlayerStats = {
  maxSpeed:    number | null
  playTime:    number | null
  goals:       number | null
  assists:     number | null
  preAssists:  number | null
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
  const [displayStats, setDisplayStats] = useState<PlayerStats>({
    maxSpeed: null,
    playTime: null,
    goals: null,
    assists: null,
    preAssists: null,
  })

  useEffect(() => {
    // 最大速度
    fetch(`/api/speed?name=${encodeURIComponent(player.name)}`)
      .then(r => r.json())
      .then(d => { if (d.maxSpeed) setDisplayStats(prev => ({ ...prev, maxSpeed: d.maxSpeed })) })
      .catch(() => {})

    // 公式戦（TM以外）を集計して出場時間・G・A・PAをセット
    fetch(`/api/match-performance?playerName=${encodeURIComponent(player.name)}`)
      .then(r => r.json())
      .then((data: Array<{ match: string; minutes: number; goals: number; assists: number; preAssists: number }>) => {
        const official = data.filter((m: { match: string }) => !m.match.includes('(TM)') && !m.match.includes('トレーニング'))
        const playTime   = official.reduce((s, m) => s + (m.minutes ?? 0), 0)
        const goals      = official.reduce((s, m) => s + (m.goals ?? 0), 0)
        const assists    = official.reduce((s, m) => s + (m.assists ?? 0), 0)
        const preAssists = official.reduce((s, m) => s + (m.preAssists ?? 0), 0)
        setDisplayStats(prev => ({ ...prev, playTime, goals, assists, preAssists }))
      })
      .catch(() => {})
  }, [player.name])

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
            <div className="grid grid-cols-5 gap-2">
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

// URLパラメータを読んでビューを切り替える
export default function DashboardPage() {
  const [activeView, setActiveView] = useState("overview")
  // 最近の試合カードからのナビゲーションイベントを受け取る
  useEffect(() => {
    const handler = (e: Event) => {
      const { section, date } = (e as CustomEvent).detail
      setActiveView(section)
      // date パラメータを URL に反映（training/official コンポーネントが読む）
      const url = new URL(window.location.href)
      url.searchParams.set('date', date)
      window.history.pushState({}, '', url.toString())
    }
    window.addEventListener('navigate-section', handler)
    return () => window.removeEventListener('navigate-section', handler)
  }, [])

  const [isMobile, setIsMobile] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  const handleViewChange = (view: string) => {
    setActiveView(view)
    setSelectedPlayer(null)
    // モバイルの場合はメニュー選択後にサイドバーを閉じる
    setMobileOpen(false)
  }

  const headerTitle = selectedPlayer
    ? selectedPlayer.name
    : viewTitles[activeView] || "ダッシュボード"

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}
      <div className={`flex flex-col h-full border-r border-border bg-[hsl(var(--sidebar-background))] transition-all duration-300
        ${isMobile
          ? `fixed inset-y-0 left-0 z-50 w-[220px] shadow-xl ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`
          : collapsed ? 'w-[56px]' : 'w-[200px]'
        }`}>
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
          <button onClick={() => isMobile ? setMobileOpen(!mobileOpen) : setCollapsed(!collapsed)}
            className="flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <Menu className="h-5 w-5" />
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
              <div className="grid gap-6 lg:grid-cols-2 items-stretch">
                <RecentMatches />
                <UpcomingMatches />
              </div>
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
