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

// シート名 -> gid のマッピングをキャッシュ
let sheetGidCache: Record<string, string> | null = null

// スプレッドシートのHTMLからシート名->gidマッピングを取得
async function getSheetGidMap(): Promise<Record<string, string>> {
  if (sheetGidCache) return sheetGidCache
  try {
    const url = `https://docs.google.com/spreadsheets/d/${FB_SHEET_ID}/htmlview`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return {}
    const html = await res.text()
    const map: Record<string, string> = {}
    // パターン: "sheetId":XXXXXXX,"title":"シート名"
    const re = /"sheetId":(d+),"title":"([^"]+)"/g
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) !== null) {
      map[m[2]] = m[1]
    }
    if (Object.keys(map).length > 0) sheetGidCache = map
    return map
  } catch { return {} }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const playerName = searchParams.get("playerName") ?? ""
  const month = searchParams.get("month") ?? ""
  const debug = searchParams.get("debug")

  if (!playerName || !month) return NextResponse.json([])

  const sheetName = `${month}FB`

  try {
    // gidマッピングを取得
    const gidMap = await getSheetGidMap()
    const gid = gidMap[sheetName]

    if (debug) return NextResponse.json({ sheetName, gid: gid ?? null, availableSheets: Object.keys(gidMap) })

    // gidが取れない場合はシートが存在しない
    if (!gid) return NextResponse.json([])

    // gidを使ってCSVを取得（シート名ではなくgidを使う）
    const csvUrl = `https://docs.google.com/spreadsheets/d/${FB_SHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`
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
