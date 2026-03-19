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

    const lines = csv.trim().split("\n")

    const players = lines.slice(1).map(line => {
      const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g) || []
      const clean = (v?: string) => (v || "").replace(/"/g, "").trim()
      return {
        number: clean(cols[0]),
        name: clean(cols[1]),
        nameEn: clean(cols[2]),
        position: clean(cols[3]),
        image: clean(cols[4]),
        profileUrl: clean(cols[5]),
        birthdate: clean(cols[6]),
        height: clean(cols[7]),
        weight: clean(cols[8]),
      }
    }).filter(p => p.number && p.name)

    return NextResponse.json(players)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
