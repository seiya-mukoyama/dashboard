import { NextResponse } from "next/server"

// 1枚のシートに全日付データが入っている（gid=2040383334）
const SHEET_ID = "15-qo-D-rrIn6J7hUA-A_qfL8sqozgf7d1gxs0BHmaWs"

export const dynamic = "force-dynamic"
export const revalidate = 0

// スペース（半角・全角）除去して名前を正規化
function normName(s: string): string {
  return s.replace(/[\s\u3000]/g, "")
}

// CSV1行をカラム配列に変換
function splitCSVLine(line: string): string[] {
  const cols: string[] = []
  let cur = ""
  let inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === "," && !inQ) { cols.push(cur.trim()); cur = "" }
    else { cur += ch }
  }
  cols.push(cur.trim())
  return cols
}

// "2026-03-16 7:53:47" → "3/16" に変換
function toDateLabel(timeStr: string): string {
  const m = timeStr.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return ""
  const month = parseInt(m[2])  // "03" → 3
  const day   = parseInt(m[3])  // "16" → 16
  return `${month}/${day}`
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const playerName = searchParams.get("name") || ""
  if (!playerName) return NextResponse.json({ error: "name required" }, { status: 400 })

  const normalizedTarget = normName(playerName)

  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`)

    const csv = await res.text()
    const lines = csv.trim().split("\n")
    if (lines.length < 2) return NextResponse.json([])

    // A=0:時間, B=1:選手名, C=2:体重, D=3:BMI, E=4:体脂肪率%,
    // F=5:筋量, G=6:水分量, H=7:体脂肪量, I=8:除脂肪体重,
    // J=9:骨量, K=10:内臓脂肪, L=11:タンパク質%, M=12:骨格筋量

    // 対象選手の行を全部集める
    const playerRows: { dateLabel: string; weight: number; fat: number; muscle: number }[] = []

    for (let i = 1; i < lines.length; i++) {
      const cols = splitCSVLine(lines[i])
      if (cols.length < 5) continue
      const name = normName(cols[1].replace(/"/g, ""))
      if (name !== normalizedTarget) continue

      const timeStr = cols[0].replace(/"/g, "").trim()
      const dateLabel = toDateLabel(timeStr)
      if (!dateLabel) continue

      const weight = parseFloat(cols[2]) || 0
      const fat    = parseFloat(cols[4]) || 0
      const muscle = parseFloat(cols[12] || "0") || 0

      playerRows.push({ dateLabel, weight, fat, muscle })
    }

    // 日付ごとに最後の計測値を使用（同日複数回計測対応）
    const byDate = new Map<string, { weight: number; fat: number; muscle: number }>()
    for (const row of playerRows) {
      byDate.set(row.dateLabel, { weight: row.weight, fat: row.fat, muscle: row.muscle })
    }

    // 日付順にソート（月/日 → Dateオブジェクトで比較）
    const sorted = [...byDate.entries()]
      .map(([date, vals]) => {
        const [m, d] = date.split("/").map(Number)
        return { date, sortKey: m * 100 + d, ...vals }
      })
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ date, weight, fat, muscle }) => ({
        date,
        weight: weight || null,
        fat: fat || null,
        muscle: muscle || null,
      }))

    return NextResponse.json(sorted)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
