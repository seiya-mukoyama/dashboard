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

function toSheetName(month: string): string {
  return `${month}FB`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const playerName = searchParams.get("playerName") ?? ""
  const month = searchParams.get("month") ?? ""
  const debug = searchParams.get("debug")

  if (!playerName || !month) return NextResponse.json([])

  const sheetName = toSheetName(month)

  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${FB_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
    const res = await fetch(csvUrl, { cache: "no-store" })
    if (!res.ok) return NextResponse.json([])
    const csv = await res.text()
    if (!csv.trim()) return NextResponse.json([])

    // 2月FB以外のシートは存在確認（2月FBのCSVと比較）
    if (sheetName !== '2\u6708FB') {
      const ref = await fetch(
        `https://docs.google.com/spreadsheets/d/${FB_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('2\u6708FB')}`,
        { cache: "no-store" }
      )
      if (ref.ok) {
        const refCSV = await ref.text()
        if (debug) return NextResponse.json({ sheetCSVLen: csv.length, refCSVLen: refCSV.length, same: csv === refCSV, first100: csv.substring(0, 100) })
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
