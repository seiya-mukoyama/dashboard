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
