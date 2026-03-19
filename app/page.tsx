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



