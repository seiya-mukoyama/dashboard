import { NextResponse } from "next/server"

const SHEET_ID = "1sP1M07b1potJg_YffjNVb_M-95UDZW7bgtX62-Qe7_0"
const GID = "0"

export const dynamic = "force-dynamic"
export const revalidate = 0

function normName(s: string) { return s.replace(/[\s\u3000]/g, "") }

function splitCSVLine(line: string): string[] {
  const cols: string[] = []
  let cur = "", inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === "," && !inQ) { cols.push(cur.trim()); cur = "" }
    else { cur += ch }
  }
  cols.push(cur.trim())
  return cols
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const playerName = searchParams.get("name") || ""
  if (!playerName) return NextResponse.json({ error: "name required" }, { status: 400 })

  const normalizedTarget = normName(playerName)

  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error("fetch failed")
    const csv = await res.text()
    const lines = csv.trim().split("\n")

    // ヘッダー行(1行目・2行目)をスキップ、3行目からデータ
    // A列: 名前, B列〜: 各月の最大速度
    let maxSpeed: number | null = null
    for (let i = 2; i < lines.length; i++) {
      const cols = splitCSVLine(lines[i])
      if (cols.length < 2) continue
      const name = normName(cols[0].replace(/"/g, ""))
      if (name !== normalizedTarget) continue

      // B列以降の数値の中で最大値を取得
      const speeds = cols.slice(1)
        .map(v => parseFloat(v.replace(/"/g, "")))
        .filter(v => !isNaN(v) && v > 0)
      if (speeds.length > 0) {
        maxSpeed = Math.max(...speeds)
      }
      break
    }

    return NextResponse.json({ maxSpeed })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
