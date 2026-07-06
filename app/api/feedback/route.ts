import { NextResponse } from "next/server"

const FB_SHEET_ID = "16b5KqE5LZghiQYbv6Ra_ZDMeFM0vZ8GoCLvdVAJq0NM"

function parseCSVLine(line: string): string[] {
  const cols: string[] = []
  let cur = ""
  let inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = "" }
    else { cur += ch }
  }
  cols.push(cur.trim())
  return cols
}

function normName(s: string) {
  return s.replace(/[\s\u3000]/g, "")
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const playerName = searchParams.get("playerName") ?? ""
  const month = searchParams.get("month") ?? ""

  if (!playerName || !month) return NextResponse.json([])

  const sheetName = `${month}FB`

  try {
    // export エンドポイントを使用（シート名で直接取得可能）
    const csvUrl = `https://docs.google.com/spreadsheets/d/${FB_SHEET_ID}/export?format=csv&sheet=${encodeURIComponent(sheetName)}`
    const res = await fetch(csvUrl, { cache: "no-store" })
    if (!res.ok) return NextResponse.json([])
    const csv = await res.text()
    if (!csv.trim()) return NextResponse.json([])

    // 存在しないシートを指定すると最初のシートが返る
    // 2月FB以外のシートは最初のシート（2月FB）と内容が同じなら存在しないと判断
    if (sheetName !== '2月FB') {
      const refUrl = `https://docs.google.com/spreadsheets/d/${FB_SHEET_ID}/export?format=csv&sheet=2月FB`
      const refRes = await fetch(refUrl, { cache: "no-store" })
      if (refRes.ok) {
        const refCSV = await refRes.text()
        if (refCSV && csv === refCSV) return NextResponse.json([])
      }
    }

    const rows = csv.split("\n").slice(1).map(parseCSVLine)
    const results: { comment: string; youtube: string }[] = []

    for (const cols of rows) {
      const name = cols[0]?.trim() ?? ""
      if (!name) continue
      if (normName(name) !== normName(playerName)) continue
      const comment = cols[1]?.trim() ?? ""
      const youtube = cols[2]?.trim() ?? ""
      if (comment || youtube) results.push({ comment, youtube })
    }

    return NextResponse.json(results)
  } catch (e) {
    console.error(e)
    return NextResponse.json([])
  }
}
