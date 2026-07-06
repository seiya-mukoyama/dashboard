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

// htmlviewからシート名->gidマッピングを取得（複数パターン対応）
async function getSheetGidMap(): Promise<Record<string, string>> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${FB_SHEET_ID}/htmlview`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return {}
    const html = await res.text()
    const map: Record<string, string> = {}

    // パターン1: "sheetId":XXXXXXX,"title":"シート名"
    const re1 = /"sheetId":(d+),"title":"([^"]+)"/g
    let m: RegExpExecArray | null
    while ((m = re1.exec(html)) !== null) map[m[2]] = m[1]
    if (Object.keys(map).length > 0) return map

    // パターン2: id="XXXXXXX" ... data-name="シート名"
    const re2 = /data-name="([^"]+)"[^>]*data-sheet-id="(d+)"/g
    while ((m = re2.exec(html)) !== null) map[m[1]] = m[2]
    if (Object.keys(map).length > 0) return map

    // パターン3: gid=XXXXXXX を anchor hrefから取得
    const re3 = /href="[^"]*[?&]gid=(d+)[^"]*"[^>]*>([^<]+)</g
    while ((m = re3.exec(html)) !== null) {
      const name = m[2].trim()
      if (name) map[name] = m[1]
    }

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
    const gidMap = await getSheetGidMap()
    const gid = gidMap[sheetName]

    if (debug) {
      // HTMLの一部も返してデバッグしやすくする
      const url = `https://docs.google.com/spreadsheets/d/${FB_SHEET_ID}/htmlview`
      const res = await fetch(url, { cache: "no-store" })
      const html = res.ok ? await res.text() : ''
      const snippet = html.substring(0, 500)
      return NextResponse.json({ sheetName, gid: gid ?? null, availableSheets: Object.keys(gidMap), htmlSnippet: snippet })
    }

    if (!gid) return NextResponse.json([])

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
