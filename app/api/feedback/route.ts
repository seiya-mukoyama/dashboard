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

let sheetGidCache: Record<string, string> | null = null

async function getSheetGidMap(): Promise<Record<string, string>> {
  if (sheetGidCache) return sheetGidCache
  try {
    // htmlviewからJSに埋め込まれたシートID情報を取得
    const url = `https://docs.google.com/spreadsheets/d/${FB_SHEET_ID}/htmlview`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return {}
    const html = await res.text()
    const map: Record<string, string> = {}

    // パターン1: "title":"シート名","index":N,"sheetId":XXXXXXX
    const re1 = /"title":"([^"]+)","index":d+,"sheetId":(d+)/g
    let m: RegExpExecArray | null
    while ((m = re1.exec(html)) !== null) map[m[1]] = m[2]
    if (Object.keys(map).length > 0) { sheetGidCache = map; return map }

    // パターン2: "sheetId":XXXXXXX,"title":"シート名"  
    const re2 = /"sheetId":(d+)[^}]*?"title":"([^"]+)"/g
    while ((m = re2.exec(html)) !== null) map[m[2]] = m[1]
    if (Object.keys(map).length > 0) { sheetGidCache = map; return map }

    // パターン3: ,XXXXXXX,"シート名",
    const re3 = /,(d{5,}),"([^"]+)",/g
    while ((m = re3.exec(html)) !== null) {
      if (m[2].endsWith('FB') || m[2].includes('FB')) map[m[2]] = m[1]
    }
    if (Object.keys(map).length > 0) { sheetGidCache = map; return map }

    return {}
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
      const url = `https://docs.google.com/spreadsheets/d/${FB_SHEET_ID}/htmlview`
      const res = await fetch(url, { cache: "no-store" })
      const html = res.ok ? await res.text() : ''
      // FB含むスニペットを探す
      const fbIdx = html.indexOf('FB')
      const snippet = fbIdx >= 0 ? html.substring(Math.max(0, fbIdx-100), fbIdx+200) : html.substring(0, 300)
      return NextResponse.json({ sheetName, gid: gid ?? null, availableSheets: Object.keys(gidMap), htmlFBSnippet: snippet })
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
