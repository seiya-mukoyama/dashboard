"use client"

import { use } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, TrendingUp, TrendingDown, Goal, Timer, Activity, Zap, Heart, AlertTriangle } from "lucide-react"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts"

const players: Record<string, {
  id: number
  name: string
  position: string
  number: number
  rating: number
  goals: number
  assists: number
  preAssists: number
  matches: number
  form: "excellent" | "good" | "average" | "poor"
  initials: string
  speed: number
  shooting: number
  passing: number
  defense: number
  physical: number
  age: number
  height: string
  weight: string
  nationality: string
  playingTime: number
  avgPackingRate: number
  avgImpact: number
  weightHistory: { month: string; weight: number }[]
  maxSpeedHistory: { month: string; speed: number }[]
  injuries: { date: string; type: string; duration: string; status: "recovered" | "recovering" }[]
  feedbacks: { date: string; from: string; comment: string; category: "technical" | "physical" | "mental" | "tactical" }[]
  matchHistory: { date: string; match: string; result: string; rating: number; goals: number; assists: number; minutes: number; packing: number; impact: number }[]
  seasonPerformance: { month: string; rating: number }[]
}> = {
  "1": {
    id: 1,
    name: "ç°ä¸­ ç¿å¤ª",
    position: "FW",
    number: 9,
    rating: 8.4,
    goals: 12,
    assists: 5,
    preAssists: 3,
    matches: 18,
    form: "excellent",
    initials: "ç°",
    speed: 85,
    shooting: 88,
    passing: 72,
    defense: 45,
    physical: 78,
    age: 26,
    height: "178cm",
    weight: "72kg",
    nationality: "æ¥æ¬",
    playingTime: 1520,
    avgPackingRate: 8.2,
    avgImpact: 12.5,
    weightHistory: [
      { month: "8æ", weight: 71.5 },
      { month: "9æ", weight: 72.0 },
      { month: "10æ", weight: 72.2 },
      { month: "11æ", weight: 71.8 },
      { month: "12æ", weight: 72.0 },
    ],
    maxSpeedHistory: [
      { month: "8æ", speed: 32.5 },
      { month: "9æ", speed: 33.1 },
      { month: "10æ", speed: 33.4 },
      { month: "11æ", speed: 33.2 },
      { month: "12æ", speed: 33.5 },
    ],
    injuries: [
      { date: "2024/05/15", type: "å³ãã ã¹ããªã³ã°èé¢ã", duration: "3é±é", status: "recovered" },
      { date: "2024/09/20", type: "å·¦è¶³é¦æ»æ«", duration: "1é±é", status: "recovered" },
    ],
    feedbacks: [
      { date: "2026/03/10", from: "監督", comment: "ポジショニングの改善が見られる。前線への飛び出しも効果的だった。", category: "tactical" },
      { date: "2026/02/20", from: "フィジカルコーチ", comment: "スプリントスピードが向上している。この調子で継続してほしい。", category: "physical" },
      { date: "2026/01/15", from: "監督", comment: "ボールロストが多い場面があった。慎重なプレー選択を心がけること。", category: "technical" }
    ],
    matchHistory: [
      { date: "12/15", match: "vs æ±äº¬FC", result: "3-1 å", rating: 8.5, goals: 2, assists: 0, minutes: 90, packing: 9.2, impact: 14.5 },
      { date: "12/08", match: "vs å¤§éªã¦ãã¤ããã", result: "2-2 å", rating: 7.8, goals: 1, assists: 1, minutes: 85, packing: 7.5, impact: 11.2 },
      { date: "12/01", match: "vs æ¨ªæµã¬ããº", result: "4-0 å", rating: 9.0, goals: 2, assists: 1, minutes: 78, packing: 10.1, impact: 15.8 },
      { date: "11/24", match: "vs åå¤å±FC", result: "2-1 å", rating: 8.2, goals: 1, assists: 0, minutes: 90, packing: 8.0, impact: 12.0 },
      { date: "11/17", match: "vs ç¦å²¡ã·ãã£", result: "3-2 å", rating: 8.8, goals: 2, assists: 0, minutes: 90, packing: 8.8, impact: 13.5 },
      { date: "11/10", match: "vs æ­å¹FC", result: "1-0 å", rating: 7.5, goals: 0, assists: 1, minutes: 72, packing: 6.5, impact: 9.8 },
      { date: "11/03", match: "vs ç¥æ¸ã´ã£ã¯ããªã¼", result: "2-2 å", rating: 7.8, goals: 1, assists: 0, minutes: 90, packing: 7.2, impact: 10.5 },
      { date: "10/27", match: "vs åºå³¶SC", result: "3-1 å", rating: 8.5, goals: 1, assists: 1, minutes: 85, packing: 8.5, impact: 12.8 },
    ],
    seasonPerformance: [
      { month: "8æ", rating: 7.5 },
      { month: "9æ", rating: 7.8 },
      { month: "10æ", rating: 8.2 },
      { month: "11æ", rating: 8.5 },
      { month: "12æ", rating: 8.4 },
    ],
  },
  "2": {
    id: 2,
    name: "å±±æ¬ å¥",
    position: "MF",
    number: 10,
    rating: 7.9,
    goals: 4,
    assists: 11,
    preAssists: 7,
    matches: 20,
    form: "good",
    initials: "å±±",
    speed: 78,
    shooting: 70,
    passing: 88,
    defense: 65,
    physical: 72,
    age: 28,
    height: "175cm",
    weight: "70kg",
    nationality: "æ¥æ¬",
    playingTime: 1750,
    avgPackingRate: 9.5,
    avgImpact: 10.8,
    weightHistory: [
      { month: "8æ", weight: 69.5 },
      { month: "9æ", weight: 70.0 },
      { month: "10æ", weight: 70.2 },
      { month: "11æ", weight: 70.0 },
      { month: "12æ", weight: 70.1 },
    ],
    maxSpeedHistory: [
      { month: "8æ", speed: 30.2 },
      { month: "9æ", speed: 30.5 },
      { month: "10æ", speed: 30.8 },
      { month: "11æ", speed: 30.6 },
      { month: "12æ", speed: 30.9 },
    ],
    injuries: [
      { date: "2024/03/10", type: "è»½åº¦ã®ç­ç²å´", duration: "5æ¥é", status: "recovered" },
    ],
    feedbacks: [
      { date: "2026/03/12", from: "監督", comment: "守備の貢献度が高い。攻撃参加のタイミングをさらに磨いてほしい。", category: "tactical" },
      { date: "2026/02/25", from: "コーチ", comment: "メンタル面での安定感が出てきた。プレッシャー下での判断が良くなっている。", category: "mental" },
      { date: "2026/01/20", from: "フィジカルコーチ", comment: "体力の持続性が改善された。後半の運動量を維持できている。", category: "physical" }
    ],
    matchHistory: [
      { date: "12/15", match: "vs æ±äº¬FC", result: "3-1 å", rating: 7.5, goals: 0, assists: 2, minutes: 90, packing: 10.2, impact: 11.5 },
      { date: "12/08", match: "vs å¤§éªã¦ãã¤ããã", result: "2-2 å", rating: 8.0, goals: 1, assists: 1, minutes: 90, packing: 9.8, impact: 12.0 },
      { date: "12/01", match: "vs æ¨ªæµã¬ããº", result: "4-0 å", rating: 8.2, goals: 0, assists: 2, minutes: 90, packing: 11.5, impact: 13.2 },
      { date: "11/24", match: "vs åå¤å±FC", result: "2-1 å", rating: 7.8, goals: 1, assists: 1, minutes: 88, packing: 8.5, impact: 10.0 },
      { date: "11/17", match: "vs ç¦å²¡ã·ãã£", result: "3-2 å", rating: 8.0, goals: 0, assists: 2, minutes: 90, packing: 9.0, impact: 11.0 },
      { date: "11/10", match: "vs æ­å¹FC", result: "1-0 å", rating: 7.2, goals: 0, assists: 0, minutes: 90, packing: 7.8, impact: 8.5 },
      { date: "11/03", match: "vs ç¥æ¸ã´ã£ã¯ããªã¼", result: "2-2 å", rating: 7.5, goals: 0, assists: 1, minutes: 85, packing: 8.2, impact: 9.2 },
      { date: "10/27", match: "vs åºå³¶SC", result: "3-1 å", rating: 8.0, goals: 1, assists: 1, minutes: 90, packing: 9.5, impact: 11.8 },
    ],
    seasonPerformance: [
      { month: "8æ", rating: 7.2 },
      { month: "9æ", rating: 7.5 },
      { month: "10æ", rating: 7.8 },
      { month: "11æ", rating: 8.0 },
      { month: "12æ", rating: 7.9 },
    ],
  },
  "3": {
    id: 3,
    name: "ä½è¤ å¤§è¼",
    position: "DF",
    number: 4,
    rating: 7.6,
    goals: 2,
    assists: 3,
    preAssists: 1,
    matches: 19,
    form: "good",
    initials: "ä½",
    speed: 72,
    shooting: 45,
    passing: 68,
    defense: 86,
    physical: 82,
    age: 30,
    height: "185cm",
    weight: "82kg",
    nationality: "æ¥æ¬",
    playingTime: 1680,
    avgPackingRate: 5.2,
    avgImpact: 6.5,
    weightHistory: [
      { month: "8æ", weight: 81.5 },
      { month: "9æ", weight: 82.0 },
      { month: "10æ", weight: 82.5 },
      { month: "11æ", weight: 82.2 },
      { month: "12æ", weight: 82.0 },
    ],
    maxSpeedHistory: [
      { month: "8æ", speed: 29.5 },
      { month: "9æ", speed: 29.8 },
      { month: "10æ", speed: 30.0 },
      { month: "11æ", speed: 29.9 },
      { month: "12æ", speed: 30.1 },
    ],
    injuries: [],
    feedbacks: [
      { date: "2026/03/08", from: "監督", comment: "技術的な精度が高い。チームのキープレーヤーとして期待している。", category: "technical" },
      { date: "2026/02/18", from: "コーチ", comment: "コミュニケーション能力が向上している。チームをうまく動かせている。", category: "mental" }
    ],
    matchHistory: [
      { date: "12/15", match: "vs æ±äº¬FC", result: "3-1 å", rating: 7.2, goals: 0, assists: 0, minutes: 90, packing: 5.5, impact: 6.8 },
      { date: "12/08", match: "vs å¤§éªã¦ãã¤ããã", result: "2-2 å", rating: 7.8, goals: 1, assists: 0, minutes: 90, packing: 6.2, impact: 7.5 },
      { date: "12/01", match: "vs æ¨ªæµã¬ããº", result: "4-0 å", rating: 7.5, goals: 0, assists: 1, minutes: 90, packing: 5.0, impact: 6.2 },
      { date: "11/24", match: "vs åå¤å±FC", result: "2-1 å", rating: 8.0, goals: 0, assists: 1, minutes: 90, packing: 5.8, impact: 7.0 },
      { date: "11/17", match: "vs ç¦å²¡ã·ãã£", result: "3-2 å", rating: 7.6, goals: 1, assists: 0, minutes: 90, packing: 5.2, impact: 6.5 },
      { date: "11/10", match: "vs æ­å¹FC", result: "1-0 å", rating: 7.8, goals: 0, assists: 0, minutes: 90, packing: 4.8, impact: 6.0 },
      { date: "11/03", match: "vs ç¥æ¸ã´ã£ã¯ããªã¼", result: "2-2 å", rating: 7.2, goals: 0, assists: 0, minutes: 90, packing: 5.0, impact: 6.2 },
      { date: "10/27", match: "vs åºå³¶SC", result: "3-1 å", rating: 7.5, goals: 0, assists: 1, minutes: 90, packing: 5.5, impact: 6.8 },
    ],
    seasonPerformance: [
      { month: "8æ", rating: 7.0 },
      { month: "9æ", rating: 7.2 },
      { month: "10æ", rating: 7.5 },
      { month: "11æ", rating: 7.8 },
      { month: "12æ", rating: 7.6 },
    ],
  },
  "4": {
    id: 4,
    name: "é´æ¨ æä¹",
    position: "GK",
    number: 1,
    rating: 7.8,
    goals: 0,
    assists: 0,
    preAssists: 0,
    matches: 20,
    form: "excellent",
    initials: "é´",
    speed: 55,
    shooting: 25,
    passing: 62,
    defense: 88,
    physical: 75,
    age: 32,
    height: "188cm",
    weight: "84kg",
    nationality: "æ¥æ¬",
    playingTime: 1800,
    avgPackingRate: 1.2,
    avgImpact: 2.5,
    weightHistory: [
      { month: "8æ", weight: 83.5 },
      { month: "9æ", weight: 84.0 },
      { month: "10æ", weight: 84.2 },
      { month: "11æ", weight: 84.0 },
      { month: "12æ", weight: 84.0 },
    ],
    maxSpeedHistory: [
      { month: "8æ", speed: 25.2 },
      { month: "9æ", speed: 25.5 },
      { month: "10æ", speed: 25.8 },
      { month: "11æ", speed: 25.6 },
      { month: "12æ", speed: 25.9 },
    ],
    injuries: [
      { date: "2024/02/20", type: "å³è©è±è¼", duration: "6é±é", status: "recovered" },
    ],
    feedbacks: [
      { date: "2026/03/05", from: "監督", comment: "スペースへの動き出しが素晴らしい。チャンスメイクに大きく貢献している。", category: "tactical" },
      { date: "2026/02/15", from: "フィジカルコーチ", comment: "体のキレが戻ってきた。怪我明けとは思えないパフォーマンス。", category: "physical" }
    ],
    matchHistory: [
      { date: "12/15", match: "vs æ±äº¬FC", result: "3-1 å", rating: 8.0, goals: 0, assists: 0, minutes: 90, packing: 1.5, impact: 3.0 },
      { date: "12/08", match: "vs å¤§éªã¦ãã¤ããã", result: "2-2 å", rating: 7.5, goals: 0, assists: 0, minutes: 90, packing: 1.2, impact: 2.5 },
      { date: "12/01", match: "vs æ¨ªæµã¬ããº", result: "4-0 å", rating: 8.2, goals: 0, assists: 0, minutes: 90, packing: 1.0, impact: 2.0 },
      { date: "11/24", match: "vs åå¤å±FC", result: "2-1 å", rating: 7.8, goals: 0, assists: 0, minutes: 90, packing: 1.2, impact: 2.5 },
      { date: "11/17", match: "vs ç¦å²¡ã·ãã£", result: "3-2 å", rating: 7.6, goals: 0, assists: 0, minutes: 90, packing: 1.0, impact: 2.2 },
      { date: "11/10", match: "vs æ­å¹FC", result: "1-0 å", rating: 8.5, goals: 0, assists: 0, minutes: 90, packing: 1.5, impact: 3.5 },
      { date: "11/03", match: "vs ç¥æ¸ã´ã£ã¯ããªã¼", result: "2-2 å", rating: 7.2, goals: 0, assists: 0, minutes: 90, packing: 1.0, impact: 2.0 },
      { date: "10/27", match: "vs åºå³¶SC", result: "3-1 å", rating: 7.8, goals: 0, assists: 0, minutes: 90, packing: 1.2, impact: 2.5 },
    ],
    seasonPerformance: [
      { month: "8æ", rating: 7.2 },
      { month: "9æ", rating: 7.5 },
      { month: "10æ", rating: 7.8 },
      { month: "11æ", rating: 8.0 },
      { month: "12æ", rating: 7.8 },
    ],
  },
  "5": {
    id: 5,
    name: "ä¼è¤ é¢¯",
    position: "MF",
    number: 8,
    rating: 7.2,
    goals: 3,
    assists: 6,
    preAssists: 4,
    matches: 17,
    form: "average",
    initials: "ä¼",
    speed: 82,
    shooting: 68,
    passing: 75,
    defense: 60,
    physical: 70,
    age: 24,
    height: "172cm",
    weight: "68kg",
    nationality: "æ¥æ¬",
    playingTime: 1380,
    avgPackingRate: 7.8,
    avgImpact: 9.2,
    weightHistory: [
      { month: "8æ", weight: 67.5 },
      { month: "9æ", weight: 68.0 },
      { month: "10æ", weight: 68.2 },
      { month: "11æ", weight: 68.0 },
      { month: "12æ", weight: 68.0 },
    ],
    maxSpeedHistory: [
      { month: "8æ", speed: 31.5 },
      { month: "9æ", speed: 31.8 },
      { month: "10æ", speed: 32.0 },
      { month: "11æ", speed: 31.9 },
      { month: "12æ", speed: 32.2 },
    ],
    injuries: [
      { date: "2024/10/05", type: "è»½åº¦ã®ç­èç", duration: "3æ¥é", status: "recovered" },
    ],
    feedbacks: [
      { date: "2026/03/15", from: "監督", comment: "セットプレーでの貢献が目立つ。キックの精度をさらに磨くこと。", category: "technical" },
      { date: "2026/02/10", from: "コーチ", comment: "チームの規律を守りながら積極的なプレーができている。", category: "mental" }
    ],
    matchHistory: [
      { date: "12/15", match: "vs æ±äº¬FC", result: "3-1 å", rating: 7.0, goals: 0, assists: 1, minutes: 75, packing: 7.5, impact: 9.0 },
      { date: "12/08", match: "vs å¤§éªã¦ãã¤ããã", result: "2-2 å", rating: 7.2, goals: 1, assists: 0, minutes: 82, packing: 8.0, impact: 9.5 },
      { date: "12/01", match: "vs æ¨ªæµã¬ããº", result: "4-0 å", rating: 7.5, goals: 0, assists: 2, minutes: 78, packing: 8.5, impact: 10.2 },
      { date: "11/24", match: "vs åå¤å±FC", result: "2-1 å", rating: 7.0, goals: 1, assists: 0, minutes: 85, packing: 7.2, impact: 8.8 },
      { date: "11/17", match: "vs ç¦å²¡ã·ãã£", result: "3-2 å", rating: 7.3, goals: 0, assists: 1, minutes: 80, packing: 7.8, impact: 9.2 },
      { date: "11/10", match: "vs æ­å¹FC", result: "1-0 å", rating: 7.0, goals: 0, assists: 0, minutes: 70, packing: 7.0, impact: 8.5 },
      { date: "11/03", match: "vs ç¥æ¸ã´ã£ã¯ããªã¼", result: "2-2 å", rating: 7.2, goals: 0, assists: 1, minutes: 78, packing: 7.5, impact: 9.0 },
      { date: "10/27", match: "vs åºå³¶SC", result: "3-1 å", rating: 7.5, goals: 1, assists: 1, minutes: 82, packing: 8.2, impact: 10.0 },
    ],
    seasonPerformance: [
      { month: "8æ", rating: 7.5 },
      { month: "9æ", rating: 7.3 },
      { month: "10æ", rating: 7.0 },
      { month: "11æ", rating: 7.2 },
      { month: "12æ", rating: 7.2 },
    ],
  },
  "6": {
    id: 6,
    name: "æ¸¡è¾º é¾",
    position: "FW",
    number: 11,
    rating: 7.5,
    goals: 8,
    assists: 3,
    preAssists: 2,
    matches: 16,
    form: "good",
    initials: "æ¸¡",
    speed: 90,
    shooting: 82,
    passing: 65,
    defense: 35,
    physical: 68,
    age: 22,
    height: "176cm",
    weight: "70kg",
    nationality: "æ¥æ¬",
    playingTime: 1120,
    avgPackingRate: 7.0,
    avgImpact: 11.0,
    weightHistory: [
      { month: "8æ", weight: 69.0 },
      { month: "9æ", weight: 69.5 },
      { month: "10æ", weight: 70.0 },
      { month: "11æ", weight: 70.2 },
      { month: "12æ", weight: 70.0 },
    ],
    maxSpeedHistory: [
      { month: "8æ", speed: 33.8 },
      { month: "9æ", speed: 34.0 },
      { month: "10æ", speed: 34.2 },
      { month: "11æ", speed: 34.5 },
      { month: "12æ", speed: 34.8 },
    ],
    injuries: [],
    feedbacks: [
      { date: "2026/03/11", from: "監督", comment: "守備ブロックの形成が良い。ラインコントロールをもっと意識してほしい。", category: "tactical" },
      { date: "2026/02/22", from: "フィジカルコーチ", comment: "フィジカルコンタクトの強さが増している。継続してほしい。", category: "physical" }
    ],
    matchHistory: [
      { date: "12/15", match: "vs æ±äº¬FC", result: "3-1 å", rating: 7.8, goals: 1, assists: 0, minutes: 70, packing: 7.5, impact: 11.5 },
      { date: "12/08", match: "vs å¤§éªã¦ãã¤ããã", result: "2-2 å", rating: 7.2, goals: 1, assists: 1, minutes: 75, packing: 6.8, impact: 10.5 },
      { date: "12/01", match: "vs æ¨ªæµã¬ããº", result: "4-0 å", rating: 7.5, goals: 2, assists: 0, minutes: 68, packing: 7.2, impact: 12.0 },
      { date: "11/24", match: "vs åå¤å±FC", result: "2-1 å", rating: 7.8, goals: 1, assists: 1, minutes: 72, packing: 7.0, impact: 11.2 },
      { date: "11/17", match: "vs ç¦å²¡ã·ãã£", result: "3-2 å", rating: 7.5, goals: 1, assists: 0, minutes: 65, packing: 6.5, impact: 10.8 },
      { date: "11/10", match: "vs æ­å¹FC", result: "1-0 å", rating: 7.0, goals: 0, assists: 0, minutes: 70, packing: 6.0, impact: 9.5 },
      { date: "11/03", match: "vs ç¥æ¸ã´ã£ã¯ããªã¼", result: "2-2 å", rating: 7.2, goals: 1, assists: 0, minutes: 68, packing: 6.8, impact: 10.2 },
      { date: "10/27", match: "vs åºå³¶SC", result: "3-1 å", rating: 7.8, goals: 1, assists: 1, minutes: 75, packing: 7.5, impact: 11.8 },
    ],
    seasonPerformance: [
      { month: "8æ", rating: 6.8 },
      { month: "9æ", rating: 7.0 },
      { month: "10æ", rating: 7.5 },
      { month: "11æ", rating: 7.8 },
      { month: "12æ", rating: 7.5 },
    ],
  },
  "7": {
    id: 7,
    name: "é«æ© èª ",
    position: "DF",
    number: 5,
    rating: 7.3,
    goals: 1,
    assists: 2,
    preAssists: 1,
    matches: 18,
    form: "average",
    initials: "é«",
    speed: 68,
    shooting: 40,
    passing: 65,
    defense: 84,
    physical: 85,
    age: 29,
    height: "183cm",
    weight: "80kg",
    nationality: "æ¥æ¬",
    playingTime: 1580,
    avgPackingRate: 4.8,
    avgImpact: 5.8,
    weightHistory: [
      { month: "8æ", weight: 79.5 },
      { month: "9æ", weight: 80.0 },
      { month: "10æ", weight: 80.5 },
      { month: "11æ", weight: 80.2 },
      { month: "12æ", weight: 80.0 },
    ],
    maxSpeedHistory: [
      { month: "8æ", speed: 28.5 },
      { month: "9æ", speed: 28.8 },
      { month: "10æ", speed: 29.0 },
      { month: "11æ", speed: 28.9 },
      { month: "12æ", speed: 29.1 },
    ],
    injuries: [
      { date: "2024/08/15", type: "å³èé­å¸¯æå·", duration: "4é±é", status: "recovered" },
    ],
    feedbacks: [
      { date: "2026/03/09", from: "監督", comment: "中盤での働きが安定している。次のステップとして得点に絡む場面を増やすこと。", category: "tactical" },
      { date: "2026/01/30", from: "コーチ", comment: "試合中の集中力が高い。精神的に成長を感じる。", category: "mental" }
    ],
    matchHistory: [
      { date: "12/15", match: "vs æ±äº¬FC", result: "3-1 å", rating: 7.0, goals: 0, assists: 0, minutes: 90, packing: 4.5, impact: 5.5 },
      { date: "12/08", match: "vs å¤§éªã¦ãã¤ããã", result: "2-2 å", rating: 7.5, goals: 0, assists: 1, minutes: 90, packing: 5.2, impact: 6.2 },
      { date: "12/01", match: "vs æ¨ªæµã¬ããº", result: "4-0 å", rating: 7.2, goals: 0, assists: 0, minutes: 90, packing: 4.8, impact: 5.8 },
      { date: "11/24", match: "vs åå¤å±FC", result: "2-1 å", rating: 7.5, goals: 1, assists: 0, minutes: 90, packing: 5.0, impact: 6.0 },
      { date: "11/17", match: "vs ç¦å²¡ã·ãã£", result: "3-2 å", rating: 7.3, goals: 0, assists: 1, minutes: 90, packing: 4.8, impact: 5.8 },
      { date: "11/10", match: "vs æ­å¹FC", result: "1-0 å", rating: 7.5, goals: 0, assists: 0, minutes: 90, packing: 4.5, impact: 5.5 },
      { date: "11/03", match: "vs ç¥æ¸ã´ã£ã¯ããªã¼", result: "2-2 å", rating: 7.0, goals: 0, assists: 0, minutes: 88, packing: 4.2, impact: 5.2 },
      { date: "10/27", match: "vs åºå³¶SC", result: "3-1 å", rating: 7.5, goals: 0, assists: 0, minutes: 90, packing: 5.0, impact: 6.0 },
    ],
    seasonPerformance: [
      { month: "8æ", rating: 7.0 },
      { month: "9æ", rating: 7.2 },
      { month: "10æ", rating: 7.3 },
      { month: "11æ", rating: 7.5 },
      { month: "12æ", rating: 7.3 },
    ],
  },
  "8": {
    id: 8,
    name: "å°æ åª",
    position: "MF",
    number: 7,
    rating: 7.0,
    goals: 2,
    assists: 4,
    preAssists: 3,
    matches: 15,
    form: "average",
    initials: "å°",
    speed: 80,
    shooting: 65,
    passing: 78,
    defense: 55,
    physical: 65,
    age: 25,
    height: "170cm",
    weight: "66kg",
    nationality: "æ¥æ¬",
    playingTime: 1150,
    avgPackingRate: 7.2,
    avgImpact: 8.5,
    weightHistory: [
      { month: "8æ", weight: 65.5 },
      { month: "9æ", weight: 66.0 },
      { month: "10æ", weight: 66.2 },
      { month: "11æ", weight: 66.0 },
      { month: "12æ", weight: 66.0 },
    ],
    maxSpeedHistory: [
      { month: "8æ", speed: 30.5 },
      { month: "9æ", speed: 30.8 },
      { month: "10æ", speed: 31.0 },
      { month: "11æ", speed: 30.9 },
      { month: "12æ", speed: 31.2 },
    ],
    injuries: [
      { date: "2024/11/20", type: "å³è¶³é¦æ»æ«", duration: "2é±é", status: "recovering" },
    ],
    feedbacks: [
      { date: "2026/03/14", from: "監督", comment: "ドリブル突破の成功率が高い。チームの攻撃の核として期待している。", category: "technical" },
      { date: "2026/02/28", from: "フィジカルコーチ", comment: "スプリント後の回復が早くなっている。コンディション管理が良い。", category: "physical" }
    ],
    matchHistory: [
      { date: "12/15", match: "vs æ±äº¬FC", result: "3-1 å", rating: 6.8, goals: 0, assists: 1, minutes: 65, packing: 7.0, impact: 8.2 },
      { date: "12/08", match: "vs å¤§éªã¦ãã¤ããã", result: "2-2 å", rating: 7.2, goals: 1, assists: 0, minutes: 72, packing: 7.5, impact: 8.8 },
      { date: "12/01", match: "vs æ¨ªæµã¬ããº", result: "4-0 å", rating: 7.0, goals: 0, assists: 1, minutes: 68, packing: 7.2, impact: 8.5 },
      { date: "11/24", match: "vs åå¤å±FC", result: "2-1 å", rating: 7.0, goals: 0, assists: 1, minutes: 75, packing: 7.0, impact: 8.2 },
      { date: "11/17", match: "vs ç¦å²¡ã·ãã£", result: "3-2 å", rating: 7.2, goals: 1, assists: 0, minutes: 70, packing: 7.5, impact: 9.0 },
      { date: "11/10", match: "vs æ­å¹FC", result: "1-0 å", rating: 6.8, goals: 0, assists: 0, minutes: 60, packing: 6.5, impact: 7.8 },
      { date: "11/03", match: "vs ç¥æ¸ã´ã£ã¯ããªã¼", result: "2-2 å", rating: 7.0, goals: 0, assists: 0, minutes: 72, packing: 7.0, impact: 8.2 },
      { date: "10/27", match: "vs åºå³¶SC", result: "3-1 å", rating: 7.2, goals: 0, assists: 1, minutes: 78, packing: 7.5, impact: 9.0 },
    ],
    seasonPerformance: [
      { month: "8æ", rating: 6.5 },
      { month: "9æ", rating: 6.8 },
      { month: "10æ", rating: 7.0 },
      { month: "11æ", rating: 7.2 },
      { month: "12æ", rating: 7.0 },
    ],
  },
  "9": {
    id: 9,
    name: "å è¤ å",
    position: "DF",
    number: 3,
    rating: 6.8,
    goals: 0,
    assists: 1,
    preAssists: 0,
    matches: 14,
    form: "poor",
    initials: "å ",
    speed: 70,
    shooting: 35,
    passing: 60,
    defense: 80,
    physical: 78,
    age: 27,
    height: "180cm",
    weight: "76kg",
    nationality: "æ¥æ¬",
    playingTime: 1100,
    avgPackingRate: 4.2,
    avgImpact: 5.0,
    weightHistory: [
      { month: "8æ", weight: 75.5 },
      { month: "9æ", weight: 76.0 },
      { month: "10æ", weight: 76.5 },
      { month: "11æ", weight: 76.2 },
      { month: "12æ", weight: 76.0 },
    ],
    maxSpeedHistory: [
      { month: "8æ", speed: 29.0 },
      { month: "9æ", speed: 29.2 },
      { month: "10æ", speed: 29.5 },
      { month: "11æ", speed: 29.3 },
      { month: "12æ", speed: 29.5 },
    ],
    injuries: [
      { date: "2024/06/10", type: "å·¦ãã ã¹ããªã³ã°èé¢ã", duration: "4é±é", status: "recovered" },
      { date: "2024/12/01", type: "å³èçç", duration: "2é±é", status: "recovering" },
    ],
    feedbacks: [
      { date: "2026/03/07", from: "監督", comment: "セービングの反応が素晴らしい。ビルドアップでの足元の技術も向上している。", category: "technical" },
      { date: "2026/02/14", from: "コーチ", comment: "コーチング能力が高い。守備陣への的確な指示が失点減少に繋がっている。", category: "mental" }
    ],
    matchHistory: [
      { date: "12/15", match: "vs æ±äº¬FC", result: "3-1 å", rating: 6.5, goals: 0, assists: 0, minutes: 78, packing: 4.0, impact: 4.8 },
      { date: "12/08", match: "vs å¤§éªã¦ãã¤ããã", result: "2-2 å", rating: 6.8, goals: 0, assists: 0, minutes: 82, packing: 4.2, impact: 5.0 },
      { date: "12/01", match: "vs æ¨ªæµã¬ããº", result: "4-0 å", rating: 7.0, goals: 0, assists: 1, minutes: 85, packing: 4.5, impact: 5.5 },
      { date: "11/24", match: "vs åå¤å±FC", result: "2-1 å", rating: 6.5, goals: 0, assists: 0, minutes: 80, packing: 4.0, impact: 4.8 },
      { date: "11/17", match: "vs ç¦å²¡ã·ãã£", result: "3-2 å", rating: 7.0, goals: 0, assists: 0, minutes: 78, packing: 4.5, impact: 5.2 },
      { date: "11/10", match: "vs æ­å¹FC", result: "1-0 å", rating: 6.8, goals: 0, assists: 0, minutes: 75, packing: 4.2, impact: 5.0 },
      { date: "11/03", match: "vs ç¥æ¸ã´ã£ã¯ããªã¼", result: "2-2 å", rating: 6.5, goals: 0, assists: 0, minutes: 72, packing: 4.0, impact: 4.5 },
      { date: "10/27", match: "vs åºå³¶SC", result: "3-1 å", rating: 7.0, goals: 0, assists: 0, minutes: 80, packing: 4.5, impact: 5.2 },
    ],
    seasonPerformance: [
      { month: "8æ", rating: 7.2 },
      { month: "9æ", rating: 7.0 },
      { month: "10æ", rating: 6.8 },
      { month: "11æ", rating: 6.5 },
      { month: "12æ", rating: 6.8 },
    ],
  },
}

const formColors = {
  excellent: "bg-primary text-primary-foreground",
  good: "bg-chart-2 text-white",
  average: "bg-chart-3 text-card-foreground",
  poor: "bg-destructive text-destructive-foreground",
}

const formLabels = {
  excellent: "çµ¶å¥½èª¿",
  good: "å¥½èª¿",
  average: "æ®é",
  poor: "ä¸èª¿",
}

const positionColors = {
  FW: "border-chart-5 text-chart-5",
  MF: "border-chart-2 text-chart-2",
  DF: "border-chart-4 text-chart-4",
  GK: "border-chart-3 text-chart-3",
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}æé${mins}å`
}

export default function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const player = players[id]

  if (!player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">é¸æãè¦ã¤ããã¾ãã</h1>
          <Link href="/">
            <Button>ããã·ã¥ãã¼ãã«æ»ã</Button>
          </Link>
        </div>
      </div>
    )
  }

  const radarData = [
    { skill: "ã¹ãã¼ã", value: player.speed },
    { skill: "ã·ã¥ã¼ã", value: player.shooting },
    { skill: "ãã¹", value: player.passing },
    { skill: "å®å", value: player.defense },
    { skill: "ãã£ã¸ã«ã«", value: player.physical },
  ]

  const trend = player.seasonPerformance[player.seasonPerformance.length - 1].rating - player.seasonPerformance[0].rating

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">é¸æè©³ç´°</h1>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        {/* Player Header */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24 border-4 border-primary">
                  <AvatarFallback className="bg-primary/20 text-primary text-3xl font-bold">
                    {player.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-card-foreground">{player.name}</h2>
                    <Badge variant="outline" className={`${positionColors[player.position as keyof typeof positionColors]}`}>
                      {player.position}
                    </Badge>
                    <Badge className={formColors[player.form]}>
                      {formLabels[player.form]}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">èçªå· {player.number}</p>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{player.age}æ­³</span>
                    <span>{player.height}</span>
                    <span>{player.weight}</span>
                    <span>{player.nationality}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-end">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary">{player.rating.toFixed(1)}</div>
                  <p className="text-sm text-muted-foreground mt-1">ã·ã¼ãºã³å¹³åè©ä¾¡</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {trend >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-primary" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <span className={`text-sm ${trend >= 0 ? "text-primary" : "text-destructive"}`}>
                      {trend >= 0 ? "+" : ""}{trend.toFixed(1)} ã·ã¼ãºã³æ¨ç§»
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Stats */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Timer className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-xl font-bold text-card-foreground">{formatMinutes(player.playingTime)}</p>
              <p className="text-xs text-muted-foreground">åºå ´æé</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Goal className="h-5 w-5 mx-auto mb-2 text-chart-5" />
              <p className="text-xl font-bold text-card-foreground">{player.goals}</p>
              <p className="text-xs text-muted-foreground">å¾ç¹</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Activity className="h-5 w-5 mx-auto mb-2 text-chart-2" />
              <p className="text-xl font-bold text-card-foreground">{player.assists}</p>
              <p className="text-xs text-muted-foreground">ã¢ã·ã¹ã</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Activity className="h-5 w-5 mx-auto mb-2 text-chart-3" />
              <p className="text-xl font-bold text-card-foreground">{player.preAssists}</p>
              <p className="text-xs text-muted-foreground">ãã¬ã¢ã·ã¹ã</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Zap className="h-5 w-5 mx-auto mb-2 text-chart-4" />
              <p className="text-xl font-bold text-card-foreground">{player.avgPackingRate.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">å¹³åããã­ã³ã°ã¬ã¼ã</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-xl font-bold text-card-foreground">{player.avgImpact.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">å¹³åã¤ã³ãã¯ã</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-card-foreground">è½åå¤</CardTitle>
              <CardDescription>åã¹ã­ã«ã®è©³ç´°è©ä¾¡</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      domain={[0, 100]}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    />
                    <Radar
                      name="è½å"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {radarData.map((item) => (
                  <div key={item.skill} className="flex items-center gap-4">
                    <span className="w-20 text-sm text-muted-foreground">{item.skill}</span>
                    <Progress value={item.value} className="flex-1 h-2" />
                    <span className="w-8 text-sm font-medium text-card-foreground text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-card-foreground">ã·ã¼ãºã³è©ä¾¡æ¨ç§»</CardTitle>
              <CardDescription>æå¥ã®è©ä¾¡å¤å</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={player.seasonPerformance}>
                    <defs>
                      <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[6, 10]}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--card-foreground))",
                      }}
                      labelStyle={{ color: "hsl(var(--card-foreground))" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rating"
                      stroke="hsl(var(--primary))"
                      fill="url(#ratingGradient)"
                      strokeWidth={2}
                      name="è©ä¾¡"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 - Weight & Speed */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <Heart className="h-5 w-5 text-chart-5" />
                ä½éæ¨ç§»
              </CardTitle>
              <CardDescription>æå¥ã®ä½éå¤å (kg)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={player.weightHistory}>
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={['dataMin - 1', 'dataMax + 1']}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--card-foreground))",
                      }}
                      labelStyle={{ color: "hsl(var(--card-foreground))" }}
                      formatter={(value: number) => [`${value} kg`, "ä½é"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--chart-5))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-5))", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <Zap className="h-5 w-5 text-chart-2" />
                æå¤§éåº¦æ¨ç§»
              </CardTitle>
              <CardDescription>æå¥ã®æå¤§ã¹ããªã³ãéåº¦ (km/h)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={player.maxSpeedHistory}>
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={['dataMin - 2', 'dataMax + 2']}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--card-foreground))",
                      }}
                      labelStyle={{ color: "hsl(var(--card-foreground))" }}
                      formatter={(value: number) => [`${value} km/h`, "æå¤§éåº¦"]}
                    />
                    <Bar
                      dataKey="speed"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 怪我の履歴 & フィードバックの履歴 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Injury Data */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              æªæãã¼ã¿
            </CardTitle>
            <CardDescription>éå»ã®æªæå±¥æ­´ã¨ç¾å¨ã®ç¶æ</CardDescription>
          </CardHeader>
          <CardContent>
            {player.injuries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                æªæã®è¨é²ã¯ããã¾ãã
              </div>
            ) : (
              <div className="space-y-3">
                {player.injuries.map((injury, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between rounded-lg p-4 ${
                      injury.status === "recovering" 
                        ? "bg-destructive/10 border border-destructive/30" 
                        : "bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        injury.status === "recovering" ? "bg-destructive/20" : "bg-primary/20"
                      }`}>
                        <AlertTriangle className={`h-4 w-4 ${
                          injury.status === "recovering" ? "text-destructive" : "text-primary"
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">{injury.type}</p>
                        <p className="text-sm text-muted-foreground">{injury.date} - é¢è±æé: {injury.duration}</p>
                      </div>
                    </div>
                    <Badge className={
                      injury.status === "recovering" 
                        ? "bg-destructive text-destructive-foreground" 
                        : "bg-primary text-primary-foreground"
                    }>
                      {injury.status === "recovering" ? "çé¤ä¸­" : "åå¾©æ¸ã¿"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          {/* Feedback History */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                フィードバック履歴
              </CardTitle>
              <CardDescription>監督・コーチからの評価・フィードバック</CardDescription>
            </CardHeader>
            <CardContent>
              {player.feedbacks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  フィードバックの記録はありません
                </div>
              ) : (
                <div className="space-y-3">
                  {player.feedbacks.map((fb, index) => (
                    <div key={index} className="rounded-lg p-4 bg-secondary/50 border border-border/50">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={
                            `text-xs font-semibold px-2 py-0.5 rounded-full ${
                              fb.category === "technical" ? "bg-blue-500/20 text-blue-400" :
                              fb.category === "physical" ? "bg-green-500/20 text-green-400" :
                              fb.category === "mental" ? "bg-purple-500/20 text-purple-400" :
                              "bg-orange-500/20 text-orange-400"
                            }`
                          }>
                            {fb.category === "technical" ? "技術" :
                             fb.category === "physical" ? "フィジカル" :
                             fb.category === "mental" ? "メンタル" : "戦術"}
                          </span>
                          <span className="text-sm font-medium text-card-foreground">{fb.from}</span>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{fb.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{fb.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Match History Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-card-foreground">åºå ´è©¦åã¨æç¸¾</CardTitle>
            <CardDescription>ç´è¿ã®è©¦åããã©ã¼ãã³ã¹è©³ç´°</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">æ¥ä»</TableHead>
                    <TableHead className="text-muted-foreground">è©¦å</TableHead>
                    <TableHead className="text-muted-foreground">çµæ</TableHead>
                    <TableHead className="text-muted-foreground text-center">è©ä¾¡</TableHead>
                    <TableHead className="text-muted-foreground text-center">å¾ç¹</TableHead>
                    <TableHead className="text-muted-foreground text-center">ã¢ã·ã¹ã</TableHead>
                    <TableHead className="text-muted-foreground text-center">åºå ´æé</TableHead>
                    <TableHead className="text-muted-foreground text-center">ããã­ã³ã°</TableHead>
                    <TableHead className="text-muted-foreground text-center">ã¤ã³ãã¯ã</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {player.matchHistory.map((match, index) => (
                    <TableRow key={index} className="border-border">
                      <TableCell className="text-card-foreground font-medium">{match.date}</TableCell>
                      <TableCell className="text-card-foreground">{match.match}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          match.result.includes("å") 
                            ? "border-primary text-primary" 
                            : match.result.includes("è² ") 
                              ? "border-destructive text-destructive"
                              : "border-chart-3 text-chart-3"
                        }>
                          {match.result}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${
                          match.rating >= 8.0 ? "text-primary" : 
                          match.rating >= 7.0 ? "text-chart-2" : 
                          "text-muted-foreground"
                        }`}>
                          {match.rating.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-card-foreground">{match.goals}</TableCell>
                      <TableCell className="text-center text-card-foreground">{match.assists}</TableCell>
                      <TableCell className="text-center text-card-foreground">{match.minutes}å</TableCell>
                      <TableCell className="text-center text-card-foreground">{match.packing.toFixed(1)}</TableCell>
                      <TableCell className="text-center text-card-foreground">{match.impact.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
