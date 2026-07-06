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

async function fetchCSV(sheetName: string): Promise<string> {
  // encodeURIComponent の代わりに直接文字列を使う（gviz APIの仕様上）
  const url = `https://docs.google.com/spreadsheets/d/${FB_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`
  const res = await fetch(url, { cache: "no-store" })
  return res.ok ? await res.text() : ''
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const playerName = searchParams.get("playerName") ?? ""
  const month = searchParams.get("month") ?? ""
  const debug = searchParams.get("debug")

  if (!playerName || !month) return NextResponse.json([])

  const sheetName = toSheetName(month)

  try {
    const csv = await fetchCSV(sheetName)
    if (!csv.trim()) return NextResponse.json([])

    // 2月FB以外のシートは、基準シートCSVと内容が同じなら「存在しない」と判断
    if (sheetName !== '2月FB') {
      const refCSV = await fetchCSV('2月FB')
      if (debug) return NextResponse.json({ sheetName, csvLen: csv.length, refLen: refCSV.length, same: csv === refCSV, first100: csv.substring(0, 100) })
      if (refCSV && csv === refCSV) return NextResponse.json([])
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
