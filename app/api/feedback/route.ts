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

// 存在確認: シート名を指定したリクエストと
// gid=0（最初のシート）を指定したリクエストのsigを比較
// 一致する → 最初のシートが返ってきている → シートが存在しない可能性
// ただし最初のシート自体を要求した場合は一致して当然なので
// 最初のシート名（2月FB）かどうかで分岐する
async function getSheetSig(sheetParam: string): Promise<string> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${FB_SHEET_ID}/gviz/tq?tqx=out:json&${sheetParam}`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return ''
    const text = await res.text()
    const json = JSON.parse(text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, ''))
    return json.sig ?? ''
  } catch { return '' }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const playerName = searchParams.get("playerName") ?? ""
  const month = searchParams.get("month") ?? ""

  if (!playerName || !month) return NextResponse.json([])

  const sheetName = toSheetName(month)

  try {
    // gid=0（最初のシート固定）のsigと、シート名指定のsigを比較
    // ただし最初のシート（2月FB）の場合は比較しない
    const sigByName = await getSheetSig(`sheet=${encodeURIComponent(sheetName)}`)
    if (!sigByName) return NextResponse.json([])

    // 2月FB以外のシートについて、gid=0と一致するかチェック
    // 一致する場合はそのシートが存在しないと判断
    if (sheetName !== '2月FB') {
      const sigByGid0 = await getSheetSig('gid=0')
      if (sigByGid0 && sigByGid0 === sigByName) {
        return NextResponse.json([])
      }
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
