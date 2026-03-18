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
  matchHistory: { date: string; match: string; result: string; rating: number; goals: number; assists: number; minutes: number; packing: number; impact: number }[]
  seasonPerformance: { month: string; rating: number }[]
}> = {
  "1": {
    id: 1,
    name: "田中 翔太",
    position: "FW",
    number: 9,
    rating: 8.4,
    goals: 12,
    assists: 5,
    preAssists: 3,
    matches: 18,
    form: "excellent",
    initials: "田",
    speed: 85,
    shooting: 88,
    passing: 72,
    defense: 45,
    physical: 78,
    age: 26,
    height: "178cm",
    weight: "72kg",
    nationality: "日本",
    playingTime: 1520,
    avgPackingRate: 8.2,
    avgImpact: 12.5,
    weightHistory: [
      { month: "8月", weight: 71.5 },
      { month: "9月", weight: 72.0 },
      { month: "10月", weight: 72.2 },
      { month: "11月", weight: 71.8 },
      { month: "12月", weight: 72.0 },
    ],
    maxSpeedHistory: [
      { month: "8月", speed: 32.5 },
      { month: "9月", speed: 33.1 },
      { month: "10月", speed: 33.4 },
      { month: "11月", speed: 33.2 },
      { month: "12月", speed: 33.5 },
    ],
    injuries: [
      { date: "2024/05/15", type: "右ハムストリング肉離れ", duration: "3週間", status: "recovered" },
      { date: "2024/09/20", type: "左足首捻挫", duration: "1週間", status: "recovered" },
    ],
    matchHistory: [
      { date: "12/15", match: "vs 東京FC", result: "3-1 勝", rating: 8.5, goals: 2, assists: 0, minutes: 90, packing: 9.2, impact: 14.5 },
      { date: "12/08", match: "vs 大阪ユナイテッド", result: "2-2 分", rating: 7.8, goals: 1, assists: 1, minutes: 85, packing: 7.5, impact: 11.2 },
      { date: "12/01", match: "vs 横浜レッズ", result: "4-0 勝", rating: 9.0, goals: 2, assists: 1, minutes: 78, packing: 10.1, impact: 15.8 },
      { date: "11/24", match: "vs 名古屋FC", result: "2-1 勝", rating: 8.2, goals: 1, assists: 0, minutes: 90, packing: 8.0, impact: 12.0 },
      { date: "11/17", match: "vs 福岡シティ", result: "3-2 勝", rating: 8.8, goals: 2, assists: 0, minutes: 90, packing: 8.8, impact: 13.5 },
      { date: "11/10", match: "vs 札幌FC", result: "1-0 勝", rating: 7.5, goals: 0, assists: 1, minutes: 72, packing: 6.5, impact: 9.8 },
      { date: "11/03", match: "vs 神戸ヴィクトリー", result: "2-2 分", rating: 7.8, goals: 1, assists: 0, minutes: 90, packing: 7.2, impact: 10.5 },
      { date: "10/27", match: "vs 広島SC", result: "3-1 勝", rating: 8.5, goals: 1, assists: 1, minutes: 85, packing: 8.5, impact: 12.8 },
    ],
    seasonPerformance: [
      { month: "8月", rating: 7.5 },
      { month: "9月", rating: 7.8 },
      { month: "10月", rating: 8.2 },
      { month: "11月", rating: 8.5 },
      { month: "12月", rating: 8.4 },
    ],
  },
  "2": {
    id: 2,
    name: "山本 健",
    position: "MF",
    number: 10,
    rating: 7.9,
    goals: 4,
    assists: 11,
    preAssists: 7,
    matches: 20,
    form: "good",
    initials: "山",
    speed: 78,
    shooting: 70,
    passing: 88,
    defense: 65,
    physical: 72,
    age: 28,
    height: "175cm",
    weight: "70kg",
    nationality: "日本",
    playingTime: 1750,
    avgPackingRate: 9.5,
    avgImpact: 10.8,
    weightHistory: [
      { month: "8月", weight: 69.5 },
      { month: "9月", weight: 70.0 },
      { month: "10月", weight: 70.2 },
      { month: "11月", weight: 70.0 },
      { month: "12月", weight: 70.1 },
    ],
    maxSpeedHistory: [
      { month: "8月", speed: 30.2 },
      { month: "9月", speed: 30.5 },
      { month: "10月", speed: 30.8 },
      { month: "11月", speed: 30.6 },
      { month: "12月", speed: 30.9 },
    ],
    injuries: [
      { date: "2024/03/10", type: "軽度の筋疲労", duration: "5日間", status: "recovered" },
    ],
    matchHistory: [
      { date: "12/15", match: "vs 東京FC", result: "3-1 勝", rating: 7.5, goals: 0, assists: 2, minutes: 90, packing: 10.2, impact: 11.5 },
      { date: "12/08", match: "vs 大阪ユナイテッド", result: "2-2 分", rating: 8.0, goals: 1, assists: 1, minutes: 90, packing: 9.8, impact: 12.0 },
      { date: "12/01", match: "vs 横浜レッズ", result: "4-0 勝", rating: 8.2, goals: 0, assists: 2, minutes: 90, packing: 11.5, impact: 13.2 },
      { date: "11/24", match: "vs 名古屋FC", result: "2-1 勝", rating: 7.8, goals: 1, assists: 1, minutes: 88, packing: 8.5, impact: 10.0 },
      { date: "11/17", match: "vs 福岡シティ", result: "3-2 勝", rating: 8.0, goals: 0, assists: 2, minutes: 90, packing: 9.0, impact: 11.0 },
      { date: "11/10", match: "vs 札幌FC", result: "1-0 勝", rating: 7.2, goals: 0, assists: 0, minutes: 90, packing: 7.8, impact: 8.5 },
      { date: "11/03", match: "vs 神戸ヴィクトリー", result: "2-2 分", rating: 7.5, goals: 0, assists: 1, minutes: 85, packing: 8.2, impact: 9.2 },
      { date: "10/27", match: "vs 広島SC", result: "3-1 勝", rating: 8.0, goals: 1, assists: 1, minutes: 90, packing: 9.5, impact: 11.8 },
    ],
    seasonPerformance: [
      { month: "8月", rating: 7.2 },
      { month: "9月", rating: 7.5 },
      { month: "10月", rating: 7.8 },
      { month: "11月", rating: 8.0 },
      { month: "12月", rating: 7.9 },
    ],
  },
  "3": {
    id: 3,
    name: "佐藤 大輝",
    position: "DF",
    number: 4,
    rating: 7.6,
    goals: 2,
    assists: 3,
    preAssists: 1,
    matches: 19,
    form: "good",
    initials: "佐",
    speed: 72,
    shooting: 45,
    passing: 68,
    defense: 86,
    physical: 82,
    age: 30,
    height: "185cm",
    weight: "82kg",
    nationality: "日本",
    playingTime: 1680,
    avgPackingRate: 5.2,
    avgImpact: 6.5,
    weightHistory: [
      { month: "8月", weight: 81.5 },
      { month: "9月", weight: 82.0 },
      { month: "10月", weight: 82.5 },
      { month: "11月", weight: 82.2 },
      { month: "12月", weight: 82.0 },
    ],
    maxSpeedHistory: [
      { month: "8月", speed: 29.5 },
      { month: "9月", speed: 29.8 },
      { month: "10月", speed: 30.0 },
      { month: "11月", speed: 29.9 },
      { month: "12月", speed: 30.1 },
    ],
    injuries: [],
    matchHistory: [
      { date: "12/15", match: "vs 東京FC", result: "3-1 勝", rating: 7.2, goals: 0, assists: 0, minutes: 90, packing: 5.5, impact: 6.8 },
      { date: "12/08", match: "vs 大阪ユナイテッド", result: "2-2 分", rating: 7.8, goals: 1, assists: 0, minutes: 90, packing: 6.2, impact: 7.5 },
      { date: "12/01", match: "vs 横浜レッズ", result: "4-0 勝", rating: 7.5, goals: 0, assists: 1, minutes: 90, packing: 5.0, impact: 6.2 },
      { date: "11/24", match: "vs 名古屋FC", result: "2-1 勝", rating: 8.0, goals: 0, assists: 1, minutes: 90, packing: 5.8, impact: 7.0 },
      { date: "11/17", match: "vs 福岡シティ", result: "3-2 勝", rating: 7.6, goals: 1, assists: 0, minutes: 90, packing: 5.2, impact: 6.5 },
      { date: "11/10", match: "vs 札幌FC", result: "1-0 勝", rating: 7.8, goals: 0, assists: 0, minutes: 90, packing: 4.8, impact: 6.0 },
      { date: "11/03", match: "vs 神戸ヴィクトリー", result: "2-2 分", rating: 7.2, goals: 0, assists: 0, minutes: 90, packing: 5.0, impact: 6.2 },
      { date: "10/27", match: "vs 広島SC", result: "3-1 勝", rating: 7.5, goals: 0, assists: 1, minutes: 90, packing: 5.5, impact: 6.8 },
    ],
    seasonPerformance: [
      { month: "8月", rating: 7.0 },
      { month: "9月", rating: 7.2 },
      { month: "10月", rating: 7.5 },
      { month: "11月", rating: 7.8 },
      { month: "12月", rating: 7.6 },
    ],
  },
  "4": {
    id: 4,
    name: "鈴木 拓也",
    position: "GK",
    number: 1,
    rating: 7.8,
    goals: 0,
    assists: 0,
    preAssists: 0,
    matches: 20,
    form: "excellent",
    initials: "鈴",
    speed: 55,
    shooting: 25,
    passing: 62,
    defense: 88,
    physical: 75,
    age: 32,
    height: "188cm",
    weight: "84kg",
    nationality: "日本",
    playingTime: 1800,
    avgPackingRate: 1.2,
    avgImpact: 2.5,
    weightHistory: [
      { month: "8月", weight: 83.5 },
      { month: "9月", weight: 84.0 },
      { month: "10月", weight: 84.2 },
      { month: "11月", weight: 84.0 },
      { month: "12月", weight: 84.0 },
    ],
    maxSpeedHistory: [
      { month: "8月", speed: 25.2 },
      { month: "9月", speed: 25.5 },
      { month: "10月", speed: 25.8 },
      { month: "11月", speed: 25.6 },
      { month: "12月", speed: 25.9 },
    ],
    injuries: [
      { date: "2024/02/20", type: "右肩脱臼", duration: "6週間", status: "recovered" },
    ],
    matchHistory: [
      { date: "12/15", match: "vs 東京FC", result: "3-1 勝", rating: 8.0, goals: 0, assists: 0, minutes: 90, packing: 1.5, impact: 3.0 },
      { date: "12/08", match: "vs 大阪ユナイテッド", result: "2-2 分", rating: 7.5, goals: 0, assists: 0, minutes: 90, packing: 1.2, impact: 2.5 },
      { date: "12/01", match: "vs 横浜レッズ", result: "4-0 勝", rating: 8.2, goals: 0, assists: 0, minutes: 90, packing: 1.0, impact: 2.0 },
      { date: "11/24", match: "vs 名古屋FC", result: "2-1 勝", rating: 7.8, goals: 0, assists: 0, minutes: 90, packing: 1.2, impact: 2.5 },
      { date: "11/17", match: "vs 福岡シティ", result: "3-2 勝", rating: 7.6, goals: 0, assists: 0, minutes: 90, packing: 1.0, impact: 2.2 },
      { date: "11/10", match: "vs 札幌FC", result: "1-0 勝", rating: 8.5, goals: 0, assists: 0, minutes: 90, packing: 1.5, impact: 3.5 },
      { date: "11/03", match: "vs 神戸ヴィクトリー", result: "2-2 分", rating: 7.2, goals: 0, assists: 0, minutes: 90, packing: 1.0, impact: 2.0 },
      { date: "10/27", match: "vs 広島SC", result: "3-1 勝", rating: 7.8, goals: 0, assists: 0, minutes: 90, packing: 1.2, impact: 2.5 },
    ],
    seasonPerformance: [
      { month: "8月", rating: 7.2 },
      { month: "9月", rating: 7.5 },
      { month: "10月", rating: 7.8 },
      { month: "11月", rating: 8.0 },
      { month: "12月", rating: 7.8 },
    ],
  },
  "5": {
    id: 5,
    name: "伊藤 颯",
    position: "MF",
    number: 8,
    rating: 7.2,
    goals: 3,
    assists: 6,
    preAssists: 4,
    matches: 17,
    form: "average",
    initials: "伊",
    speed: 82,
    shooting: 68,
    passing: 75,
    defense: 60,
    physical: 70,
    age: 24,
    height: "172cm",
    weight: "68kg",
    nationality: "日本",
    playingTime: 1380,
    avgPackingRate: 7.8,
    avgImpact: 9.2,
    weightHistory: [
      { month: "8月", weight: 67.5 },
      { month: "9月", weight: 68.0 },
      { month: "10月", weight: 68.2 },
      { month: "11月", weight: 68.0 },
      { month: "12月", weight: 68.0 },
    ],
    maxSpeedHistory: [
      { month: "8月", speed: 31.5 },
      { month: "9月", speed: 31.8 },
      { month: "10月", speed: 32.0 },
      { month: "11月", speed: 31.9 },
      { month: "12月", speed: 32.2 },
    ],
    injuries: [
      { date: "2024/10/05", type: "軽度の筋肉痛", duration: "3日間", status: "recovered" },
    ],
    matchHistory: [
      { date: "12/15", match: "vs 東京FC", result: "3-1 勝", rating: 7.0, goals: 0, assists: 1, minutes: 75, packing: 7.5, impact: 9.0 },
      { date: "12/08", match: "vs 大阪ユナイテッド", result: "2-2 分", rating: 7.2, goals: 1, assists: 0, minutes: 82, packing: 8.0, impact: 9.5 },
      { date: "12/01", match: "vs 横浜レッズ", result: "4-0 勝", rating: 7.5, goals: 0, assists: 2, minutes: 78, packing: 8.5, impact: 10.2 },
      { date: "11/24", match: "vs 名古屋FC", result: "2-1 勝", rating: 7.0, goals: 1, assists: 0, minutes: 85, packing: 7.2, impact: 8.8 },
      { date: "11/17", match: "vs 福岡シティ", result: "3-2 勝", rating: 7.3, goals: 0, assists: 1, minutes: 80, packing: 7.8, impact: 9.2 },
      { date: "11/10", match: "vs 札幌FC", result: "1-0 勝", rating: 7.0, goals: 0, assists: 0, minutes: 70, packing: 7.0, impact: 8.5 },
      { date: "11/03", match: "vs 神戸ヴィクトリー", result: "2-2 分", rating: 7.2, goals: 0, assists: 1, minutes: 78, packing: 7.5, impact: 9.0 },
      { date: "10/27", match: "vs 広島SC", result: "3-1 勝", rating: 7.5, goals: 1, assists: 1, minutes: 82, packing: 8.2, impact: 10.0 },
    ],
    seasonPerformance: [
      { month: "8月", rating: 7.5 },
      { month: "9月", rating: 7.3 },
      { month: "10月", rating: 7.0 },
      { month: "11月", rating: 7.2 },
      { month: "12月", rating: 7.2 },
    ],
  },
  "6": {
    id: 6,
    name: "渡辺 龍",
    position: "FW",
    number: 11,
    rating: 7.5,
    goals: 8,
    assists: 3,
    preAssists: 2,
    matches: 16,
    form: "good",
    initials: "渡",
    speed: 90,
    shooting: 82,
    passing: 65,
    defense: 35,
    physical: 68,
    age: 22,
    height: "176cm",
    weight: "70kg",
    nationality: "日本",
    playingTime: 1120,
    avgPackingRate: 7.0,
    avgImpact: 11.0,
    weightHistory: [
      { month: "8月", weight: 69.0 },
      { month: "9月", weight: 69.5 },
      { month: "10月", weight: 70.0 },
      { month: "11月", weight: 70.2 },
      { month: "12月", weight: 70.0 },
    ],
    maxSpeedHistory: [
      { month: "8月", speed: 33.8 },
      { month: "9月", speed: 34.0 },
      { month: "10月", speed: 34.2 },
      { month: "11月", speed: 34.5 },
      { month: "12月", speed: 34.8 },
    ],
    injuries: [],
    matchHistory: [
      { date: "12/15", match: "vs 東京FC", result: "3-1 勝", rating: 7.8, goals: 1, assists: 0, minutes: 70, packing: 7.5, impact: 11.5 },
      { date: "12/08", match: "vs 大阪ユナイテッド", result: "2-2 分", rating: 7.2, goals: 1, assists: 1, minutes: 75, packing: 6.8, impact: 10.5 },
      { date: "12/01", match: "vs 横浜レッズ", result: "4-0 勝", rating: 7.5, goals: 2, assists: 0, minutes: 68, packing: 7.2, impact: 12.0 },
      { date: "11/24", match: "vs 名古屋FC", result: "2-1 勝", rating: 7.8, goals: 1, assists: 1, minutes: 72, packing: 7.0, impact: 11.2 },
      { date: "11/17", match: "vs 福岡シティ", result: "3-2 勝", rating: 7.5, goals: 1, assists: 0, minutes: 65, packing: 6.5, impact: 10.8 },
      { date: "11/10", match: "vs 札幌FC", result: "1-0 勝", rating: 7.0, goals: 0, assists: 0, minutes: 70, packing: 6.0, impact: 9.5 },
      { date: "11/03", match: "vs 神戸ヴィクトリー", result: "2-2 分", rating: 7.2, goals: 1, assists: 0, minutes: 68, packing: 6.8, impact: 10.2 },
      { date: "10/27", match: "vs 広島SC", result: "3-1 勝", rating: 7.8, goals: 1, assists: 1, minutes: 75, packing: 7.5, impact: 11.8 },
    ],
    seasonPerformance: [
      { month: "8月", rating: 6.8 },
      { month: "9月", rating: 7.0 },
      { month: "10月", rating: 7.5 },
      { month: "11月", rating: 7.8 },
      { month: "12月", rating: 7.5 },
    ],
  },
  "7": {
    id: 7,
    name: "高橋 誠",
    position: "DF",
    number: 5,
    rating: 7.3,
    goals: 1,
    assists: 2,
    preAssists: 1,
    matches: 18,
    form: "average",
    initials: "高",
    speed: 68,
    shooting: 40,
    passing: 65,
    defense: 84,
    physical: 85,
    age: 29,
    height: "183cm",
    weight: "80kg",
    nationality: "日本",
    playingTime: 1580,
    avgPackingRate: 4.8,
    avgImpact: 5.8,
    weightHistory: [
      { month: "8月", weight: 79.5 },
      { month: "9月", weight: 80.0 },
      { month: "10月", weight: 80.5 },
      { month: "11月", weight: 80.2 },
      { month: "12月", weight: 80.0 },
    ],
    maxSpeedHistory: [
      { month: "8月", speed: 28.5 },
      { month: "9月", speed: 28.8 },
      { month: "10月", speed: 29.0 },
      { month: "11月", speed: 28.9 },
      { month: "12月", speed: 29.1 },
    ],
    injuries: [
      { date: "2024/08/15", type: "右膝靭帯損傷", duration: "4週間", status: "recovered" },
    ],
    matchHistory: [
      { date: "12/15", match: "vs 東京FC", result: "3-1 勝", rating: 7.0, goals: 0, assists: 0, minutes: 90, packing: 4.5, impact: 5.5 },
      { date: "12/08", match: "vs 大阪ユナイテッド", result: "2-2 分", rating: 7.5, goals: 0, assists: 1, minutes: 90, packing: 5.2, impact: 6.2 },
      { date: "12/01", match: "vs 横浜レッズ", result: "4-0 勝", rating: 7.2, goals: 0, assists: 0, minutes: 90, packing: 4.8, impact: 5.8 },
      { date: "11/24", match: "vs 名古屋FC", result: "2-1 勝", rating: 7.5, goals: 1, assists: 0, minutes: 90, packing: 5.0, impact: 6.0 },
      { date: "11/17", match: "vs 福岡シティ", result: "3-2 勝", rating: 7.3, goals: 0, assists: 1, minutes: 90, packing: 4.8, impact: 5.8 },
      { date: "11/10", match: "vs 札幌FC", result: "1-0 勝", rating: 7.5, goals: 0, assists: 0, minutes: 90, packing: 4.5, impact: 5.5 },
      { date: "11/03", match: "vs 神戸ヴィクトリー", result: "2-2 分", rating: 7.0, goals: 0, assists: 0, minutes: 88, packing: 4.2, impact: 5.2 },
      { date: "10/27", match: "vs 広島SC", result: "3-1 勝", rating: 7.5, goals: 0, assists: 0, minutes: 90, packing: 5.0, impact: 6.0 },
    ],
    seasonPerformance: [
      { month: "8月", rating: 7.0 },
      { month: "9月", rating: 7.2 },
      { month: "10月", rating: 7.3 },
      { month: "11月", rating: 7.5 },
      { month: "12月", rating: 7.3 },
    ],
  },
  "8": {
    id: 8,
    name: "小林 優",
    position: "MF",
    number: 7,
    rating: 7.0,
    goals: 2,
    assists: 4,
    preAssists: 3,
    matches: 15,
    form: "average",
    initials: "小",
    speed: 80,
    shooting: 65,
    passing: 78,
    defense: 55,
    physical: 65,
    age: 25,
    height: "170cm",
    weight: "66kg",
    nationality: "日本",
    playingTime: 1150,
    avgPackingRate: 7.2,
    avgImpact: 8.5,
    weightHistory: [
      { month: "8月", weight: 65.5 },
      { month: "9月", weight: 66.0 },
      { month: "10月", weight: 66.2 },
      { month: "11月", weight: 66.0 },
      { month: "12月", weight: 66.0 },
    ],
    maxSpeedHistory: [
      { month: "8月", speed: 30.5 },
      { month: "9月", speed: 30.8 },
      { month: "10月", speed: 31.0 },
      { month: "11月", speed: 30.9 },
      { month: "12月", speed: 31.2 },
    ],
    injuries: [
      { date: "2024/11/20", type: "右足首捻挫", duration: "2週間", status: "recovering" },
    ],
    matchHistory: [
      { date: "12/15", match: "vs 東京FC", result: "3-1 勝", rating: 6.8, goals: 0, assists: 1, minutes: 65, packing: 7.0, impact: 8.2 },
      { date: "12/08", match: "vs 大阪ユナイテッド", result: "2-2 分", rating: 7.2, goals: 1, assists: 0, minutes: 72, packing: 7.5, impact: 8.8 },
      { date: "12/01", match: "vs 横浜レッズ", result: "4-0 勝", rating: 7.0, goals: 0, assists: 1, minutes: 68, packing: 7.2, impact: 8.5 },
      { date: "11/24", match: "vs 名古屋FC", result: "2-1 勝", rating: 7.0, goals: 0, assists: 1, minutes: 75, packing: 7.0, impact: 8.2 },
      { date: "11/17", match: "vs 福岡シティ", result: "3-2 勝", rating: 7.2, goals: 1, assists: 0, minutes: 70, packing: 7.5, impact: 9.0 },
      { date: "11/10", match: "vs 札幌FC", result: "1-0 勝", rating: 6.8, goals: 0, assists: 0, minutes: 60, packing: 6.5, impact: 7.8 },
      { date: "11/03", match: "vs 神戸ヴィクトリー", result: "2-2 分", rating: 7.0, goals: 0, assists: 0, minutes: 72, packing: 7.0, impact: 8.2 },
      { date: "10/27", match: "vs 広島SC", result: "3-1 勝", rating: 7.2, goals: 0, assists: 1, minutes: 78, packing: 7.5, impact: 9.0 },
    ],
    seasonPerformance: [
      { month: "8月", rating: 6.5 },
      { month: "9月", rating: 6.8 },
      { month: "10月", rating: 7.0 },
      { month: "11月", rating: 7.2 },
      { month: "12月", rating: 7.0 },
    ],
  },
  "9": {
    id: 9,
    name: "加藤 光",
    position: "DF",
    number: 3,
    rating: 6.8,
    goals: 0,
    assists: 1,
    preAssists: 0,
    matches: 14,
    form: "poor",
    initials: "加",
    speed: 70,
    shooting: 35,
    passing: 60,
    defense: 80,
    physical: 78,
    age: 27,
    height: "180cm",
    weight: "76kg",
    nationality: "日本",
    playingTime: 1100,
    avgPackingRate: 4.2,
    avgImpact: 5.0,
    weightHistory: [
      { month: "8月", weight: 75.5 },
      { month: "9月", weight: 76.0 },
      { month: "10月", weight: 76.5 },
      { month: "11月", weight: 76.2 },
      { month: "12月", weight: 76.0 },
    ],
    maxSpeedHistory: [
      { month: "8月", speed: 29.0 },
      { month: "9月", speed: 29.2 },
      { month: "10月", speed: 29.5 },
      { month: "11月", speed: 29.3 },
      { month: "12月", speed: 29.5 },
    ],
    injuries: [
      { date: "2024/06/10", type: "左ハムストリング肉離れ", duration: "4週間", status: "recovered" },
      { date: "2024/12/01", type: "右膝炎症", duration: "2週間", status: "recovering" },
    ],
    matchHistory: [
      { date: "12/15", match: "vs 東京FC", result: "3-1 勝", rating: 6.5, goals: 0, assists: 0, minutes: 78, packing: 4.0, impact: 4.8 },
      { date: "12/08", match: "vs 大阪ユナイテッド", result: "2-2 分", rating: 6.8, goals: 0, assists: 0, minutes: 82, packing: 4.2, impact: 5.0 },
      { date: "12/01", match: "vs 横浜レッズ", result: "4-0 勝", rating: 7.0, goals: 0, assists: 1, minutes: 85, packing: 4.5, impact: 5.5 },
      { date: "11/24", match: "vs 名古屋FC", result: "2-1 勝", rating: 6.5, goals: 0, assists: 0, minutes: 80, packing: 4.0, impact: 4.8 },
      { date: "11/17", match: "vs 福岡シティ", result: "3-2 勝", rating: 7.0, goals: 0, assists: 0, minutes: 78, packing: 4.5, impact: 5.2 },
      { date: "11/10", match: "vs 札幌FC", result: "1-0 勝", rating: 6.8, goals: 0, assists: 0, minutes: 75, packing: 4.2, impact: 5.0 },
      { date: "11/03", match: "vs 神戸ヴィクトリー", result: "2-2 分", rating: 6.5, goals: 0, assists: 0, minutes: 72, packing: 4.0, impact: 4.5 },
      { date: "10/27", match: "vs 広島SC", result: "3-1 勝", rating: 7.0, goals: 0, assists: 0, minutes: 80, packing: 4.5, impact: 5.2 },
    ],
    seasonPerformance: [
      { month: "8月", rating: 7.2 },
      { month: "9月", rating: 7.0 },
      { month: "10月", rating: 6.8 },
      { month: "11月", rating: 6.5 },
      { month: "12月", rating: 6.8 },
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
  excellent: "絶好調",
  good: "好調",
  average: "普通",
  poor: "不調",
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
  return `${hours}時間${mins}分`
}

export default function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const player = players[id]

  if (!player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">選手が見つかりません</h1>
          <Link href="/">
            <Button>ダッシュボードに戻る</Button>
          </Link>
        </div>
      </div>
    )
  }

  const radarData = [
    { skill: "スピード", value: player.speed },
    { skill: "シュート", value: player.shooting },
    { skill: "パス", value: player.passing },
    { skill: "守備", value: player.defense },
    { skill: "フィジカル", value: player.physical },
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
          <h1 className="text-lg font-semibold text-foreground">選手詳細</h1>
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
                  <p className="text-muted-foreground">背番号 {player.number}</p>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{player.age}歳</span>
                    <span>{player.height}</span>
                    <span>{player.weight}</span>
                    <span>{player.nationality}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-end">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary">{player.rating.toFixed(1)}</div>
                  <p className="text-sm text-muted-foreground mt-1">シーズン平均評価</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {trend >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-primary" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <span className={`text-sm ${trend >= 0 ? "text-primary" : "text-destructive"}`}>
                      {trend >= 0 ? "+" : ""}{trend.toFixed(1)} シーズン推移
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
              <p className="text-xs text-muted-foreground">出場時間</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Goal className="h-5 w-5 mx-auto mb-2 text-chart-5" />
              <p className="text-xl font-bold text-card-foreground">{player.goals}</p>
              <p className="text-xs text-muted-foreground">得点</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Activity className="h-5 w-5 mx-auto mb-2 text-chart-2" />
              <p className="text-xl font-bold text-card-foreground">{player.assists}</p>
              <p className="text-xs text-muted-foreground">アシスト</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Activity className="h-5 w-5 mx-auto mb-2 text-chart-3" />
              <p className="text-xl font-bold text-card-foreground">{player.preAssists}</p>
              <p className="text-xs text-muted-foreground">プレアシスト</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Zap className="h-5 w-5 mx-auto mb-2 text-chart-4" />
              <p className="text-xl font-bold text-card-foreground">{player.avgPackingRate.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">平均パッキングレート</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-xl font-bold text-card-foreground">{player.avgImpact.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">平均インパクト</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-card-foreground">能力値</CardTitle>
              <CardDescription>各スキルの詳細評価</CardDescription>
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
                      name="能力"
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
              <CardTitle className="text-card-foreground">シーズン評価推移</CardTitle>
              <CardDescription>月別の評価変動</CardDescription>
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
                      name="評価"
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
                体重推移
              </CardTitle>
              <CardDescription>月別の体重変化 (kg)</CardDescription>
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
                      formatter={(value: number) => [`${value} kg`, "体重"]}
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
                最大速度推移
              </CardTitle>
              <CardDescription>月別の最大スプリント速度 (km/h)</CardDescription>
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
                      formatter={(value: number) => [`${value} km/h`, "最大速度"]}
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

        {/* Injury Data */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              怪我データ
            </CardTitle>
            <CardDescription>過去の怪我履歴と現在の状態</CardDescription>
          </CardHeader>
          <CardContent>
            {player.injuries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                怪我の記録はありません
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
                        <p className="text-sm text-muted-foreground">{injury.date} - 離脱期間: {injury.duration}</p>
                      </div>
                    </div>
                    <Badge className={
                      injury.status === "recovering" 
                        ? "bg-destructive text-destructive-foreground" 
                        : "bg-primary text-primary-foreground"
                    }>
                      {injury.status === "recovering" ? "療養中" : "回復済み"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Match History Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-card-foreground">出場試合と成績</CardTitle>
            <CardDescription>直近の試合パフォーマンス詳細</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">日付</TableHead>
                    <TableHead className="text-muted-foreground">試合</TableHead>
                    <TableHead className="text-muted-foreground">結果</TableHead>
                    <TableHead className="text-muted-foreground text-center">評価</TableHead>
                    <TableHead className="text-muted-foreground text-center">得点</TableHead>
                    <TableHead className="text-muted-foreground text-center">アシスト</TableHead>
                    <TableHead className="text-muted-foreground text-center">出場時間</TableHead>
                    <TableHead className="text-muted-foreground text-center">パッキング</TableHead>
                    <TableHead className="text-muted-foreground text-center">インパクト</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {player.matchHistory.map((match, index) => (
                    <TableRow key={index} className="border-border">
                      <TableCell className="text-card-foreground font-medium">{match.date}</TableCell>
                      <TableCell className="text-card-foreground">{match.match}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          match.result.includes("勝") 
                            ? "border-primary text-primary" 
                            : match.result.includes("負") 
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
                      <TableCell className="text-center text-card-foreground">{match.minutes}分</TableCell>
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
