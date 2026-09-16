// @ts-nocheck
import { NextResponse } from "next/server"

export const revalidate = 300

const STATS_SHEET_ID = "1Y_im99vGkmEc-6GgwXqXQC2Lz6yriRGqy-xV5wlm48g"
const STATS_GID = "1979610514"

function parseCSVLine(line: string): string[] {
  const cols: string[] = []
  let cur = "", inQ = false
  for (const ch of line) {
    if (ch === '"') inQ = !inQ
    else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = "" }
    else cur += ch
  }
  cols.push(cur.trim())
  return cols.map(c => c.replace(/^"|"$/g, '').trim())
}

// 結合セル対応: 左の値を右に伝播する
function fillRow(row: string[]): string[] {
  const result = [...row]
  let last = ""
  for (let i = 2; i < result.length; i++) {
    if (result[i] !== "") last = result[i]
    else result[i] = last
  }
  return result
}

function serialToTimeStr(v: number): string {
  const totalSec = Math.round(v * 86400)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return ":" + String(m).padStart(2,'0') + ":" + String(s).padStart(2,'0')
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filter = searchParams.get("type") ?? "all"

  // CSVで取得 (fillRowで結合セルを展開)
  const csvUrl = `https://docs.google.com/spreadsheets/d/${STATS_SHEET_ID}/export?format=csv&gid=${STATS_GID}`
  let csvRows: string[][] = []
  try {
    const res = await fetch(csvUrl, { cache: "no-store" })
    if (res.ok) csvRows = (await res.text()).split("\n").map(parseCSVLine)
  } catch { /**/ }

  // JSONで取得 (数値はこちらが正確)
  const jsonUrl = `https://docs.google.com/spreadsheets/d/${STATS_SHEET_ID}/gviz/tq?tqx=out:json&gid=${STATS_GID}`
  let jsonRows: any[][] = []
  try {
    const res = await fetch(jsonUrl, { cache: "no-store" })
    if (res.ok) {
      const text = await res.text()
      const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}')+1))
      jsonRows = (json.table?.rows ?? []).map((r: any) => r.c ?? [])
    }
  } catch { /**/ }

  if (!csvRows.length) return NextResponse.json({ matches: [] })

  const numCols = csvRows[0]?.length ?? 0

  // CSV行からメタ情報 (fillRowで結合セルを展開)
  const venueRow  = fillRow(csvRows[1] ?? [])  // HOME/AWAY
  const typeRow   = fillRow(csvRows[2] ?? [])  // TM/公式戦名
  const periodRow = fillRow(csvRows[3] ?? [])  // 前半/後半
  const oppRow    = fillRow(csvRows[4] ?? [])  // 対戦相手

  // JSON行から数値のラベル行インデックス
  const getV = (cell: any): any => (cell === null || cell === undefined) ? null : (cell.v ?? null)
  const getRowIdx = (label: string) =>
    jsonRows.findIndex(r => { const v = getV(r[1]); return v !== null && String(v) === label })

  const labelRows: Record<string, number> = {}
  for (const label of [
    "得点","失点","試合時間","APT(90分換算)",
    "パッキングレート","インペクト","ボックス侵入回数","ゴールエリア侵入回数",
    "ラインブレイク","ラインブレイクＡＣ","クロス","シュート","ＣＫ数","ＦＫ数","xG"
  ]) { labelRows[label] = getRowIdx(label) }

  const num = (idx: number, col: number): number | null => {
    if (idx < 0 || !jsonRows[idx]) return null
    const v = getV(jsonRows[idx][col])
    if (v === null) return null
    const n = parseFloat(String(v))
    return isNaN(n) ? null : n
  }

  const matches: any[] = []

  for (let col = 2; col < numCols; col++) {
    const date = csvRows[0]?.[col] ?? ""
    if (!date) continue

    const venue     = venueRow[col]  ?? ""
    const matchType = typeRow[col]   ?? ""
    const period    = periodRow[col] ?? ""
    const opponent  = oppRow[col]    ?? ""

    const isTM = matchType === "TM"
    if (filter === "tm" && !isTM) continue
    if (filter === "official" && isTM) continue

    // APT
    const aptIdx = labelRows["APT(90分換算)"]
    const aptCell = aptIdx >= 0 ? jsonRows[aptIdx]?.[col] : null
    const aptV = getV(aptCell)
    const apt = aptCell?.f ?? (aptV != null
      ? (typeof aptV === 'number' && aptV < 1 ? serialToTimeStr(aptV) : String(aptV))
      : null)

    matches.push({
      date, venue, type: isTM ? "TM" : "official",
      matchType, period, opponent,
      score:           num(labelRows["得点"], col),
      conceded:        num(labelRows["失点"], col),
      matchTime:       num(labelRows["試合時間"], col),
      apt,
      packing:         num(labelRows["パッキングレート"], col),
      impact:          num(labelRows["インペクト"], col),
      boxEntries:      num(labelRows["ボックス侵入回数"], col),
      goalAreaEntries: num(labelRows["ゴールエリア侵入回数"], col),
      lineBreak:       num(labelRows["ラインブレイク"], col),
      lineBreakAC:     num(labelRows["ラインブレイクＡＣ"], col),
      cross:           num(labelRows["クロス"], col),
      shots:           num(labelRows["シュート"], col),
      corners:         num(labelRows["ＣＫ数"], col),
      freeKicks:       num(labelRows["ＦＫ数"], col),
      xg:              num(labelRows["xG"], col),
    })
  }

  return NextResponse.json({ matches })
}
