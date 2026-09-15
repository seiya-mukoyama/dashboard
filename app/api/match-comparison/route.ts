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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filter = searchParams.get("type") ?? "all"

  const url = `https://docs.google.com/spreadsheets/d/${STATS_SHEET_ID}/gviz/tq?tqx=out:json&gid=${STATS_GID}`
  let rawRows: any[] = []
  try {
    const res = await fetch(url, { cache: "no-store" })
    if (res.ok) {
      const text = await res.text()
      const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}')+1))
      rawRows = json.table?.rows ?? []
    }
  } catch { /**/ }

  if (!rawRows.length) return NextResponse.json({ matches: [] })

  const rows = rawRows.map((r: any) => r.c ?? [])
  const numCols = rows[0]?.length ?? 0

  const getV = (cell: any): any => {
    if (cell === null || cell === undefined) return null
    return cell.v ?? null
  }
  const getF = (cell: any): string | null => cell?.f ?? null

  // 行ラベルを文字列変換して比較
  const getRowIdx = (label: string): number =>
    rows.findIndex((r: any[]) => {
      const v = r[1]?.v
      return v !== null && v !== undefined && String(v) === label
    })

  // メタ行インデックス (固定値でフォールバック)
  const venueRowIdx  = getRowIdx("大会名")  // 1
  const periodRowIdx = getRowIdx("本数")    // 3
  const oppRowIdx    = getRowIdx("対戦相手") // 4
  // TM行 = venueRowIdx+1 (rows[2], col1が空のためgetRowIdxで辺れない)
  const typeRowIdx = venueRowIdx >= 0 ? venueRowIdx + 1 : 2

  // 数値ラベル行
  const labelRows: Record<string, number> = {}
  for (const label of [
    "得点","失点","試合時間","APT(90分換算)",
    "パッキングレート","インペクト","ボックス侵入回数","ゴールエリア侵入回数",
    "ラインブレイク","ラインブレイクＡＣ","クロス","シュート","ＣＫ数","ＦＫ数","xG"
  ]) { labelRows[label] = getRowIdx(label) }

  const num = (idx: number, col: number): number | null => {
    if (idx < 0) return null
    const v = getV(rows[idx]?.[col])
    if (v === null) return null
    const n = parseFloat(String(v))
    return isNaN(n) ? null : n
  }

  const matches: any[] = []

  for (let col = 2; col < numCols; col++) {
    const dateCell = rows[0]?.[col]
    const dateV = getV(dateCell)
    if (!dateV && dateV !== 0) continue
    const date = getF(dateCell) ?? String(dateV)

    const venue     = venueRowIdx >= 0  ? String(getV(rows[venueRowIdx]?.[col])  ?? "") : ""
    const matchType = typeRowIdx >= 0   ? String(getV(rows[typeRowIdx]?.[col])   ?? "") : ""
    const period    = periodRowIdx >= 0 ? String(getV(rows[periodRowIdx]?.[col]) ?? "") : ""
    const opponent  = oppRowIdx >= 0    ? String(getV(rows[oppRowIdx]?.[col])    ?? "") : ""

    const isTM = matchType === "TM"
    if (filter === "tm" && !isTM) continue
    if (filter === "official" && isTM) continue

    const aptIdx = labelRows["APT(90分換算)"]
    const aptCell = aptIdx >= 0 ? rows[aptIdx]?.[col] : null
    const aptV = getV(aptCell)
    const apt = getF(aptCell) ?? (aptV != null
      ? (typeof aptV === 'number' && aptV < 1 ? serialToTimeStr(aptV) : String(aptV))
      : null)

    matches.push({
      date: date.startsWith("Date(") ? String(dateV) : date,
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
      // デバッグ用
      _idx: { venueRowIdx, typeRowIdx, periodRowIdx, oppRowIdx },
      _raw: {
        r1c2: getV(rows[1]?.[2]), r2c2: getV(rows[2]?.[2]),
        r3c2: getV(rows[3]?.[2]), r4c2: getV(rows[4]?.[2]),
        venueVal: getV(rows[venueRowIdx]?.[2]),
      },
    })
  }

  return NextResponse.json({ matches })
}
