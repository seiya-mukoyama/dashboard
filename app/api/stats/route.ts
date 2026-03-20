import { NextResponse } from "next/server"

const SHEET_ID = process.env.SHEET_ID
const API_KEY = process.env.GOOGLE_API_KEY

export async function GET() {
  try {
    if (!SHEET_ID || !API_KEY) {
      return NextResponse.json({ teamName: "VONDS市原", matches: [] })
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/%E3%83%88%E3%83%AC%E3%83%BC%E3%83%8B%E3%83%B3%E3%82%B0%E3%83%9E%E3%83%83%E3%83%81?key=${API_KEY}`
    const res = await fetch(url, { next: { revalidate: 300 } })

    if (!res.ok) {
      return NextResponse.json({ teamName: "VONDS市原", matches: [] })
    }

    const json = await res.json()
    const rows: string[][] = json.values ?? []

    // 列構成:
    // A=日付, B=対戦相手, C=自チーム得点, D=失点
    // E=パッキング, F=相手パッキング, G=インパクト, H=ボックス侵入, I=相手ボックス侵入
    // J=エリア侵入, K=ラインブレイク, L=ラインブレイクAC, M=クロス, N=CK, O=FK
    // P=相手インパクト, Q=相手エリア侵入, R=相手ラインブレイク, S=相手ラインブレイクAC
    // T=相手クロス, U=シュート, V=相手シュート, W=相手CK, X=相手FK
    const matches = rows.slice(1).map(r => ({
      date: r[0] ?? "",
      opponent: r[1] ?? "",
      goalsFor: Number(r[2]) || 0,
      goalsAgainst: Number(r[3]) || 0,
      packingRate: Number(r[4]) || 0,
      opp_packingRate: Number(r[5]) || 0,
      impact: Number(r[6]) || 0,
      boxEntries: Number(r[7]) || 0,
      opp_boxEntries: Number(r[8]) || 0,
      goalAreaEntries: Number(r[9]) || 0,
      lineBreak: Number(r[10]) || 0,
      lineBreakAC: Number(r[11]) || 0,
      crosses: Number(r[12]) || 0,
      corners: Number(r[13]) || 0,
      freeKicks: Number(r[14]) || 0,
      opp_impact: Number(r[15]) || 0,
      opp_goalAreaEntries: Number(r[16]) || 0,
      opp_lineBreak: Number(r[17]) || 0,
      opp_lineBreakAC: Number(r[18]) || 0,
      opp_crosses: Number(r[19]) || 0,
      shots: Number(r[20]) || 0,
      opp_shots: Number(r[21]) || 0,
      opp_corners: Number(r[22]) || 0,
      opp_freeKicks: Number(r[23]) || 0,
    })).filter(m => m.date)

    return NextResponse.json({ teamName: "VONDS市原", matches })
  } catch {
    return NextResponse.json({ teamName: "VONDS市原", matches: [] })
  }
}