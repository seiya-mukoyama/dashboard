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
    // A=選手名, B=日付, C=試合, D=結果, E=得点, F=アシスト, G=プレアシスト
    // H=出場時間, I=パッキング, J=パッキングR, K=インパクト, L=インパクトR
    // M=HI, N=最大速度, O=走行距離, P=ラインブレイク
    return NextResponse.json(
      rows.slice(1)
        .filter(r => r[0]?.trim() === playerName.trim())
        .map(r => ({
          date: r[1] ?? '',
          match: r[2] ?? '',
          result: r[3] ?? '',
          goals: Number(r[4]) || 0,
          assists: Number(r[5]) || 0,
          preAssists: Number(r[6]) || 0,
          minutes: Number(r[7]) || 0,
          packing: Number(r[8]) || 0,
          packingReceive: Number(r[9]) || 0,
          impact: Number(r[10]) || 0,
          impactReceive: Number(r[11]) || 0,
          hi: Number(r[12]) || 0,
          maxSpeed: Number(r[13]) || 0,
          distance: Number(r[14]) || 0,
          lineBreak: Number(r[15]) || 0,
        }))
        .filter(r => r.date && r.match)
        .sort((a, b) => b.date.localeCompare(a.date))
    )
  } catch { return NextResponse.json([]) }
}