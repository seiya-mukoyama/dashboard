import { NextResponse } from "next/server"

const SHEET_ID = "15-qo-D-rrIn6J7hUA-A_qfL8sqozgf7d1gxs0BHmaWs"

export const dynamic = "force-dynamic"
export const revalidate = 0

// 日付シート一覧（増えたら追加）
const SHEET_DATES = [
  "03月01日","03月03日","03月04日","03月05日","03月06日",
  "03月07日","03月08日","03月11日","03月12日","03月13日",
  "03月14日","03月15日","03月16日","03月18日","03月19日",
]

// CSV1行をカラム配列に変換（ダブルクォート・カンマ対応）
function splitCSVLine(line: string): string[] {
  const cols: string[] = []
  let cur = ""
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQ = !inQ
    } else if (ch === "," && !inQ) {
      cols.push(cur.trim())
      cur = ""
    } else {
      cur += ch
    }
  }
  cols.push(cur.trim())
  return cols
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const playerName = searchParams.get("name") || ""

  if (!playerName) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  const allRecords: { date: string; weight: number | null; fat: number | null; muscle: number | null }[] = []

  for (const sheetDate of SHEET_DATES) {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetDate)}`
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) continue

      const csv = await res.text()
      const lines = csv.trim().split("\n")
      if (lines.length < 2) continue

      // ヘッダー行をスキップしてデータ行を処理
      // A=0:時間, B=1:選手名, C=2:体重, D=3:BMI, E=4:体脂肪率%, F=5:筋量,
      // G=6:水分量, H=7:体脂肪量, I=8:除脂肪体重, J=9:骨量, K=10:内臓脂肪,
      // L=11:タンパク質%, M=12:骨格筋量
      const matched: string[][] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = splitCSVLine(lines[i])
        if (cols.length < 3) continue
        const name = cols[1].replace(/"/g, "").trim()
        if (name === playerName) {
          matched.push(cols)
        }
      }

      if (matched.length === 0) continue

      // 同日複数回計測の場合は最後の値を使用
      const last = matched[matched.length - 1]
      const weight = parseFloat(last[2]) || null
      const fat    = parseFloat(last[4]) || null
      const muscle = last[12] ? (parseFloat(last[12]) || null) : null

      // 日付ラベル: "03月16日" → "3/16"
      const dateLabel = sheetDate
        .replace(/^0/, "")      // 先頭の0を除去
        .replace("月", "/")
        .replace("日", "")

      allRecords.push({ date: dateLabel, weight, fat, muscle })
    } catch {
      // シート取得エラーはスキップ
    }
  }

  return NextResponse.json(allRecords)
}
