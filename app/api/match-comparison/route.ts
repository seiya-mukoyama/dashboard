// @ts-nocheck
import { NextResponse } from "next/server"

export const revalidate = 300

const STATS_SHEET_ID = "1Y_im99vGkmEc-6GgwXqXQC2Lz6yriRGqy-xV5wlm48g"
const STATS_GID = "1979610514"

function serialToTimeStr(v: number): string {
  const totalSec = Math.round(v * 86400)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return ":" + String(m).padStart(2,'0') + ":" + String(s).padStart(2,'0')
}

const getV = (cell: any): any =>
  (cell === null || cell === undefined) ? null : (cell.v ?? null)

async function fetchGvizJson(sheetId: string, gid: string, range?: string) {
  const url = range
    ? `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}&range=${range}`
    : `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return []
  const text = await res.text()
  const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}')+1))
  return (json.table?.rows ?? []).map((r: any) => r.c ?? [])
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filter = searchParams.get("type") ?? "all"

  // メタ行 (1-6) を range指定で取得 - 結合セルが展開される
  // 全体取得 - 数値はこちらから
  const [metaRows, allRows] = await Promise.all([
    fetchGvizJson(STATS_SHEET_ID, STATS_GID, "A1:CZ6"),
    fetchGvizJson(STATS_SHEET_ID, STATS_GID),
  ]).catch(() => [[], []])

  if (!allRows.length) return NextResponse.json({ matches: [] })

  const numCols = allRows[0]?.length ?? 0

  // メタ行の内容 (range指定で結合セル展開済み)
  // metaRows[0]=日付, [1]=HOME/AWAY, [2]=TM/公式戦, [3]=本数, [4]=対戦相手
  const metaDateRow   = metaRows[0] ?? []
  const metaVenueRow  = metaRows[1] ?? []
  const metaTypeRow   = metaRows[2] ?? []
  const metaPeriodRow = metaRows[3] ?? []
  const metaOppRow    = metaRows[4] ?? []

  // allRowsのラベル検索
  const getRowIdx = (label: string) =>
    allRows.findIndex(r => { const v = getV(r[1]); return v !== null && String(v) === label })

  const labelRows: Record<string, number> = {}
  for (const label of [
    "得点","失点","試合時間","APT(90分換算)",
    "パッキングレート","インペクト","ボックス侵入回数","ゴールエリア侵入回数",
    "ラインブレイク","ラインブレイクＡＣ","クロス","シュート","ＣＫ数","ＦＫ数","xG"
  ]) { labelRows[label] = getRowIdx(label) }

  const num = (idx: number, col: number): number | null => {
    if (idx < 0) return null
    const v = getV(allRows[idx]?.[col])
    if (v === null) return null
    const n = parseFloat(String(v))
    return isNaN(n) ? null : n
  }

  const matches: any[] = []

  for (let col = 2; col < numCols; col++) {
    const dateCell = metaDateRow[col]
    const dateV = getV(dateCell)
    if (!dateV) continue
    const date = dateCell?.f ?? String(dateV)

    const venue     = String(getV(metaVenueRow[col])  ?? "")
    const matchType = String(getV(metaTypeRow[col])   ?? "")
    const period    = String(getV(metaPeriodRow[col]) ?? "")
    const opponent  = String(getV(metaOppRow[col])    ?? "")

    const isTM = matchType === "TM"
    if (filter === "tm" && !isTM) continue
    if (filter === "official" && isTM) continue

    const aptIdx = labelRows["APT(90分換算)"]
    const aptCell = aptIdx >= 0 ? allRows[aptIdx]?.[col] : null
    const aptV = getV(aptCell)
    const apt = aptCell?.f ?? (aptV != null
      ? (typeof aptV === 'number' && aptV < 1 ? serialToTimeStr(aptV) : String(aptV))
      : null)

    matches.push({
      date: date.startsWith('Date(') ? String(dateV) : date,
      venue, type: isTM ? "TM" : "official",
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
