import { NextResponse } from "next/server"
const SHEET_ID = process.env.SHEET_ID
const API_KEY = process.env.GOOGLE_API_KEY
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const playerName = searchParams.get("playerName")
  if (!playerName) return NextResponse.json([])
  try {
    if (!SHEET_ID || !API_KEY) return NextResponse.json([])
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/%E6%80%AA%E6%88%91%E5%B1%A5%E6%AD%B4?key=${API_KEY}`
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return NextResponse.json([])
    const json = await res.json()
    const rows: string[][] = json.values ?? []
    return NextResponse.json(rows.slice(1).filter(r => r[0]?.trim() === playerName.trim()).map(r => ({ date: r[1]??'', type: r[2]??'', duration: r[3]??'', status: r[4]?.trim()==='recovering'?'recovering':'recovered' as "recovering"|"recovered" })).filter(r => r.date && r.type))
  } catch { return NextResponse.json([]) }
}