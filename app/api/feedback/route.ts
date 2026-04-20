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

async function getSheetNames(): Promise<{ names: string[]; raw: string }> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${FB_SHEET_ID}/htmlview`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return { names: [], raw: 'fetch failed: ' + res.status }
    const html = await res.text()

    // パターン1: data-name="..."
    const names1: string[] = []
    const re1 = /data-name="([^"]+)"/g
    let m: RegExpExecArray | null
    while ((m = re1.exec(html)) !== null) names1.push(m[1])

    // パターン2: <li ...>...<a ...>テキスト...</a>...</li> のシートタブ
    const names2: string[] = []
    const re2 = /id="([^"]*sheet[^"]*)"[^>]*>([^<]*)/g
    while ((m = re2.exec(html)) !== null) if (m[2].trim()) names2.push(m[2].trim())

    // htmlの先頭5000文字でFBが含まれる箇所を確認
    const fbIdx = html.indexOf('FB')
    const snippet = fbIdx >= 0 ? html.substring(Math.max(0, fbIdx-100), fbIdx+100) : 'FB not found'

    return { names: names1.length > 0 ? names1 : names2, raw: snippet }
  } catch (e) {
    return { names: [], raw: String(e) }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const playerName = searchParams.get("playerName") ?? ""
  const month = searchParams.get("month") ?? ""
  const debug = searchParams.get("debug")

  if (debug) {
    const result = await getSheetNames()
    return NextResponse.json(result)
  }

  if (!playerName || !month) return NextResponse.json([])

  const sheetName = toSheetName(month)

  try {
    const { names: sheetNames } = await getSheetNames()
    if (sheetNames.length > 0 && !sheetNames.includes(sheetName)) {
      return NextResponse.json([])
    }

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
      if (comment || youtube) results.push({ comment, youtube })
    }

    return NextResponse.json(results)
  } catch (e) {
    console.error(e)
    return NextResponse.json([])
  }
}
