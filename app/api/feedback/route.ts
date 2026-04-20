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

// htmlview の data-name="シート名" からシート一覧取得
async function getSheetNames(): Promise<string[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${FB_SHEET_ID}/htmlview`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return []
    const html = await res.text()
    // data-name="シート名" を全て抽出
    const names: string[] = []
    const re = /data-name="([^"]+)"/g
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) !== null) {
      names.push(m[1])
    }
    return names
  } catch { return [] }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const playerName = searchParams.get("playerName") ?? ""
  const month = searchParams.get("month") ?? ""

  if (!playerName || !month) return NextResponse.json([])

  const sheetName = toSheetName(month)

  try {
    // シート一覧を取得して存在確認
    const sheetNames = await getSheetNames()
    if (sheetNames.length > 0 && !sheetNames.includes(sheetName)) {
      return NextResponse.json([])
    }

    // CSVを取得
    const csvUrl = `https://docs.google.com/spreadsheets/d/${FB_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
    const res = await fetch(csvUrl, { cache: "no-store" })
    if (!res.ok) return NextResponse.json([])
    const csv = await res.text()
    if (!csv.trim()) return NextResponse.json([])

    const rows = csv.split("\n").slice(1).map(parseCSVLine)
    const results: { comment: string; youtube: string }[] = []

    for (const cols of rows) {
      const name = cols[0]?.trim() ?? ""
      if (!name) continue
      if (normName(name) !== normName(playerName)) continue
      const comment = cols[1]?.trim() ?? ""
      const youtube = cols[2]?.trim() ?? ""
      if (comment || youtube) {
        results.push({ comment, youtube })
      }
    }

    return NextResponse.json(results)
  } catch (e) {
    console.error(e)
    return NextResponse.json([])
  }
}
