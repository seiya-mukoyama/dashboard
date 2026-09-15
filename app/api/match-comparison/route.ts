// @ts-nocheck
import { NextResponse } from "next/server"

export const revalidate = 300

const STATS_SHEET_ID = "1Y_im99vGkmEc-6GgwXqXQC2Lz6yriRGqy-xV5wlm48g"
const STATS_GID = "1979610514"

function serialToTimeStr(serial: number): string {
  const totalSec = Math.round(serial * 86400)
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

  // 山内の行構造 (確認済み):
  // rows[0]: col2以降 = 日付
  // rows[1]: col1="大会名"(label), col2以降 = HOME/AWAY
  // rows[2]: col1=null(空), col2以降 = TM or 公式戦名
  // rows[3]: col1="本数", col2以降 = 前半/後半
  // rows[4]: col1="対戦相手", col2以降 = 対戦相手名
  // rows[5]以降: col1=ラベル, col2以降 = 値

  const rows = rawRows.map(r => r.c ?? [])
  const numCols = rows[0]?.length ?? 0

  const getV = (cell: any) => cell?.v ?? null
  const getF = (cell: any) => cell?.f ?? null

  // ラベル検索(大会名などcol1がある行用)
  const getRowIdx = (label: string) => rows.findIndex(r => getV(r[1]) === label)

  // 各ラベル行のインデックス
  const labelRows: Record<string, number> = {}
  for (const label of [
    "得点","失点","試合時間","APT(90分換算)",
    "パッキングレート","インペクト","ボックス侵入回数","ゴールエリア侵入回数",
    "ラインブレイク","ラインブレイクＡＣ","クロス","シュート","ＣＫ数","ＦＫ数","xG"
  ]) { labelRows[label] = getRowIdx(label) }

  const num = (rowIdx: number, col: number): number | null => {
    if (rowIdx < 0) return null
    const v = getV(rows[rowIdx]?.[col])
    if (v === null) return null
    const n = parseFloat(String(v))
    return isNaN(n) ? null : n
  }

  const matches = []

  for (let col = 2; col < numCols; col++) {
    const dateCell = rows[0]?.[col]
    const dateV = getV(dateCell)
    if (!dateV) continue
    const date = getF(dateCell) ?? String(dateV)

    // 「大会名」の行(rows[1])から HOME/AWAYを取得
    const venueRowIdx = getRowIdx("大会名")
    const venue = venueRowIdx >= 0 ? (getV(rows[venueRowIdx]?.[col]) ?? "") : ""

    // TM/公式戦は rows[2] (「本数」の1行上 = idx 2)
    const typeRowIdx = venueRowIdx >= 0 ? venueRowIdx + 1 : 2
    const matchType = getV(rows[typeRowIdx]?.[col]) ?? ""

    // 本数 = rows[3]
    const periodRowIdx = getRowIdx("本数")
    const period = periodRowIdx >= 0 ? (getV(rows[periodRowIdx]?.[col]) ?? "") : ""

    // 対戦相手 = rows[4]
    const oppRowIdx = getRowIdx("対戦相手")
    const opponent = oppRowIdx >= 0 ? (getV(rows[oppRowIdx]?.[col]) ?? "") : ""

    const isTM = String(matchType) === "TM"
    if (filter === "tm" && !isTM) continue
    if (filter === "official" && isTM) continue

    // APT
    const aptCell = rows[labelRows["APT(90分換算)"]]?.[col]
    const aptV = getV(aptCell)
    const apt = aptCell?.f ?? (aptV != null
      ? (typeof aptV === 'number' && aptV < 1 ? serialToTimeStr(aptV) : String(aptV))
      : null)

    matches.push({
      date, venue: String(venue), type: isTM ? "TM" : "official",
      matchType: String(matchType), period: String(period), opponent: String(opponent),
      score: num(labelRows["得点"], col), conceded: num(labelRows["失点"], col),
      matchTime: num(labelRows["試合時間"], col), apt,
      packing: num(labelRows["パッキングレート"], col),
      impact: num(labelRows["インペクト"], col),
      boxEntries: num(labelRows["ボックス侵入回数"], col),
      goalAreaEntries: num(labelRows["ゴールエリア侵入回数"], col),
      lineBreak: num(labelRows["ラインブレイク"], col),
      lineBreakAC: num(labelRows["ラインブレイクＡＣ"], col),
      cross: num(labelRows["クロス"], col),
      shots: num(labelRows["シュート"], col),
      corners: num(labelRows["ＣＫ数"], col),
      freeKicks: num(labelRows["ＦＫ数"], col),
      xg: num(labelRows["xG"], col),
    })
  }

  return NextResponse.json({ matches })
}
