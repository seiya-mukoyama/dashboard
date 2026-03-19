import { NextResponse } from "next/server"

const SHEET_ID = "1vnHF5iHJkirI6PhUzD3isKmdkz6Vani4aQfItMgL80k"
const GID = "0"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to fetch sheet")
    const csv = await res.text()

    const lines = csv.trim().split("\n").filter(Boolean)

    const players = lines.slice(1).map(line => {
      // URLにカンマが含まれる場合を考慮したCSVパース
      const cols: string[] = []
      let current = ""
      let inQuote = false
      for (const ch of line) {
        if (ch === '"') { inQuote = !inQuote }
        else if (ch === ',' && !inQuote) { cols.push(current.trim()); current = "" }
        else { current += ch }
      }
      cols.push(current.trim())

      return {
        number: cols[0]?.replace(/"/g, "").trim() || "",
        name: cols[1]?.replace(/"/g, "").trim() || "",
        nameEn: cols[2]?.replace(/"/g, "").trim() || "",
        position: cols[3]?.replace(/"/g, "").trim() || "",
        image: cols[4]?.replace(/"/g, "").trim() || "",
        profileUrl: cols[5]?.replace(/"/g, "").trim() || "",
      }
    }).filter(p => p.number && p.name)

    return NextResponse.json(players)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
