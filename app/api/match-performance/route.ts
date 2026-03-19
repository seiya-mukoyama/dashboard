import { NextResponse } from "next/server"
const SHEET_ID = process.env.SHEET_ID
const API_KEY = process.env.GOOGLE_API_KEY
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const playerName = searchParams.get("playerName")
  if (!playerName) return NextResponse.json([])
  try {
    if (!SHEET_ID || !API_KEY) return NextResponse.json([])
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/%E5%87%BA%E5%A0%B4%E8%A8%98%E9%8C%B2?key=${API_KEY}`
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return NextResponse.json([])
    const json = await res.json()
    const rows: string[][] = json.values ?? []
    // 列構成: A=選手名, B=日付, C=対戦相手, D=結果, E=得点, F=アシスト, G=出場時間, H=評価
    return NextResponse.json(
      rows.slice(1)
        .filter(r => r[0]?.trim() === playerName.trim())
        .map(r => ({
          date: r[1] ?? '',
          opponent: r[2] ?? '',
          result: r[3] ?? '',
          goals: Number(r[4]) || 0,
          assists: Number(r[5]) || 0,
          minutes: Number(r[6]) || 0,
          rating: Number(r[7]) || 0,
        }))
        .filter(r => r.date && r.opponent)
        .sort((a, b) => b.date.localeCompare(a.date))
    )
  } catch { return NextResponse.json([]) }
}