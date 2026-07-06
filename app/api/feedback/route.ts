import { NextResponse } from "next/server"

const FB_SHEET_ID = "16b5KqE5LZghiQYbv6Ra_ZDMeFM0vZ8GoCLvdVAJq0NM"

// シート名 -> gid のマッピング（スプレッドシートURLのgidパラメータから確認）
// 新しい月のシートが追加されたらここに追加する
const SHEET_GIDS: Record<string, string> = {
  "2月FB": "787446982",
  "3月FB": "1670399719",
  "4月FB": "214233510",
  "5月FB": "2059143529",
  // 6月以降は追加時にgidを確認してここに追加
}

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
  const gid = SHEET_GIDS[sheetName]

  // gidが不明なシートは存在しないとみなす
  if (!gid) return NextResponse.json([])

  try {
    // gidを直接指定してCSVを取得（シート名指定では動作しない場合があるため）
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
