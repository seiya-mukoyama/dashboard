import { NextResponse } from "next/server"

const SHEET_ID = "15-qo-D-rrIn6J7hUA-A_qfL8sqozgf7d1gxs0BHmaWs"

export const dynamic = "force-dynamic"
export const revalidate = 0

// 3月1日〜19日のシート名（増えたら追加）
const SHEET_DATES = [
  "03月01日","03月03日","03月04日","03月05日","03月06日",
  "03月07日","03月08日","03月11日","03月12日","03月13日",
  "03月14日","03月15日","03月16日","03月18日","03月19日",
]

function parseCSV(csv: string): string[][] {
  const lines = csv.trim().split("\n")
  return lines.map(line => {
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
  })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const playerName = searchParams.get("name") || ""

  try {
    const allRecords: { date: string; weight: number | null; fat: number | null; muscle: number | null }[] = []

    for (const sheetDate of SHEET_DATES) {
      try {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetDate)}`
        const res = await fetch(url, { cache: "no-store" })
        if (!res.ok) continue
        const csv = await res.text()
        const rows = parseCSV(csv)
        if (rows.length < 2) continue

        // ヘッダー行: 時間,家族,体重,BMI,体脂肪率%,筋量,水分量,体脂肪量,除脂肪体重,骨量,内臓脂肪,タンパク質%,骨格筋量
        // col[0]=時間, col[1]=家族(選手名), col[2]=体重, col[4]=体脂肪率%, col[12]=骨格筋量

        const dataRows = rows.slice(1).filter(r => r.length >= 5)
        const matched = dataRows.filter(r => {
          const name = r[1]?.replace(/"/g, "").trim() || ""
          return name === playerName
        })

        if (matched.length > 0) {
          // 同日複数回計測の場合は最後の値を使用
          const last = matched[matched.length - 1]
          const weight = parseFloat(last[2]) || null
          const fat = parseFloat(last[4]) || null
          const muscle = parseFloat(last[12] || "0") || null

          // 日付フォーマット: "03月16日" → "3/16"
          const dateLabel = sheetDate.replace("0", "").replace("月", "/").replace("日", "")

          allRecords.push({ date: dateLabel, weight, fat, muscle })
        }
      } catch {
        // シートが存在しない場合はスキップ
      }
    }

    return NextResponse.json(allRecords)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
