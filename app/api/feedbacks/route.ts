import { NextResponse } from "next/server"

const SHEET_ID = process.env.SHEET_ID
const API_KEY = process.env.GOOGLE_API_KEY

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const playerName = searchParams.get("playerName")
  if (!playerName) return NextResponse.json([])
  try {
    if (!SHEET_ID || !API_KEY) return NextResponse.json([])
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/%E3%83%95%E3%82%A3%E3%83%BC%E3%83%89%E3%83%90%E3%83%83%E3%82%AF?key=${API_KEY}`
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return NextResponse.json([])
    const json = await res.json()
    const rows: string[][] = json.values ?? []
    const validCategories = ["technical", "physical", "mental", "tactical"]
    const feedbacks = rows.slice(1)
      .filter(row => row[0]?.trim() === playerName.trim())
      .map(row => ({
        date: row[1] ?? "",
        from: row[2] ?? "",
        comment: row[3] ?? "",
        category: (validCategories.includes(row[4]?.trim()) ? row[4].trim() : "technical") as "technical" | "physical" | "mental" | "tactical",
      }))
      .filter(r => r.date && r.comment)
      .sort((a, b) => b.date.localeCompare(a.date))
    return NextResponse.json(feedbacks)
  } catch {
    return NextResponse.json([])
  }
}
