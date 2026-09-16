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
  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return []
    const text = await res.text()
    const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}')+1))
    return (json.table?.rows ?? []).map((r: any) => r.c ?? [])
  } catch { return [] }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filter = searchParams.get("type") ?? "all"

  const [metaRows, allRows] = await Promise.all([
    fetchGvizJson(STATS_SHEET_ID, STATS_GID, "A1:CZ6"),
    fetchGvizJson(STATS_SHEET_ID, STATS_GID),
  ])

  if (!allRows.length) return NextResponse.json({ matches: [] })

  const numCols = allRows[0]?.length ?? 0

  const metaDateRow  = metaRows[0] ?? []
  const metaVenueRow = metaRows[1] ?? []
  const metaTypeRow  = metaRows[2] ?? []
  const metaOppRow   = metaRows[4] ?? []

  const getRowIdx = (label: string) =>
    allRows.findIndex(r => { const v = getV(r[1]); return v !== null && String(v) === label })

  // 自チームラベル
  const OWN_LABELS = [
    "得点","失点","試合時間","APT(90分換算)",
    "パッキングレート","インペクト","ボックス侵入回数","ゴールエリア侵入回数",
    "ラインブレイク","ラインブレイクAC","クロス","シュート","CK数","FK数","xG"
  ]
  // 相手チームラベル (「相手チーム」の次の行から同じ順序)
  const OPP_LABELS = [
    "パッキングレート","インペクト","ボックス侵入回数","ゴールエリア侵入回数",
    "ラインブレイク","ラインブレイクAC","クロス","シュート","CK数","FK数","xG"
  ]

  // 「相手チーム」ラベルの行番号を基準に相手行のインデックスを取得
  const oppSectionIdx = getRowIdx("相手チーム")

  const labelRows: Record<string, number> = {}
  for (const label of OWN_LABELS) { labelRows["own_" + label] = getRowIdx(label) }
  // 相手は「相手チーム」セクション以降の行を探索
  for (let i = 0; i < OPP_LABELS.length; i++) {
    const label = OPP_LABELS[i]
    // oppSectionIdx以降で同じラベルの行を探索
    const idx = oppSectionIdx >= 0
      ? allRows.findIndex((r, ri) => ri > oppSectionIdx && getV(r[1]) !== null && String(getV(r[1])) === label)
      : -1
    labelRows["opp_" + label] = idx
  }

  const numVal = (idx: number, col: number): number | null => {
    if (idx < 0) return null
    const v = getV(allRows[idx]?.[col])
    if (v === null) return null
    const n = parseFloat(String(v))
    return isNaN(n) ? null : n
  }

  // 前半/後半/3本目を同一試合としてグループ化し合算
  // 同じ (date, opponent, matchType) の列をまとめる
  type Col = { col: number; matchTime: number | null }
  const matchGroups: Map<string, Col[]> = new Map()

  for (let col = 2; col < numCols; col++) {
    const dateV = getV(metaDateRow[col])
    if (!dateV) continue
    const dateCell = metaDateRow[col]
    const date = dateCell?.f ?? String(dateV)
    const matchType = String(getV(metaTypeRow[col]) ?? "")
    const opponent  = String(getV(metaOppRow[col])  ?? "")
    const venue     = String(getV(metaVenueRow[col]) ?? "")

    const isTM = matchType === "TM"
    if (filter === "tm" && !isTM) continue
    if (filter === "official" && isTM) continue

    const key = date + "||" + opponent + "||" + matchType + "||" + venue
    if (!matchGroups.has(key)) matchGroups.set(key, [])
    matchGroups.get(key)!.push({ col, matchTime: numVal(labelRows["own_試合時間"], col) })
  }

  const matches: any[] = []

  for (const [key, cols] of matchGroups) {
    const [date, opponent, matchType, venue] = key.split("||")
    const isTM = matchType === "TM"

    // 合算関数
    const sumOwn = (label: string) => {
      const idx = labelRows["own_" + label]
      if (idx < 0) return null
      let s = 0, hasVal = false
      for (const { col } of cols) {
        const v = numVal(idx, col)
        if (v !== null) { s += v; hasVal = true }
      }
      return hasVal ? Math.round(s * 10) / 10 : null
    }
    const sumOpp = (label: string) => {
      const idx = labelRows["opp_" + label]
      if (idx < 0) return null
      let s = 0, hasVal = false
      for (const { col } of cols) {
        const v = numVal(idx, col)
        if (v !== null) { s += v; hasVal = true }
      }
      return hasVal ? Math.round(s * 10) / 10 : null
    }

    // APTは最後の列の値を使用 (時間になるので合算しない)
    const aptIdx = labelRows["own_APT(90分換算)"]
    const aptCell = aptIdx >= 0 ? allRows[aptIdx]?.[cols[cols.length-1].col] : null
    const aptV = getV(aptCell)
    const apt = aptCell?.f ?? (aptV != null
      ? (typeof aptV === 'number' && aptV < 1 ? serialToTimeStr(aptV) : String(aptV))
      : null)

    matches.push({
      date: date.startsWith('Date(') ? date : date,
      venue, type: isTM ? "TM" : "official", matchType, opponent,
      totalTime: sumOwn("試合時間"),
      apt,
      // 自チーム
      score: sumOwn("得点"), conceded: sumOwn("失点"),
      packing: sumOwn("パッキングレート"), impact: sumOwn("インペクト"),
      boxEntries: sumOwn("ボックス侵入回数"), goalAreaEntries: sumOwn("ゴールエリア侵入回数"),
      lineBreak: sumOwn("ラインブレイク"), lineBreakAC: sumOwn("ラインブレイクAC"),
      cross: sumOwn("クロス"), shots: sumOwn("シュート"),
      corners: sumOwn("CK数"), freeKicks: sumOwn("FK数"), xg: sumOwn("xG"),
      // 相手チーム
      oppPacking: sumOpp("パッキングレート"), oppImpact: sumOpp("インペクト"),
      oppBoxEntries: sumOpp("ボックス侵入回数"), oppGoalAreaEntries: sumOpp("ゴールエリア侵入回数"),
      oppLineBreak: sumOpp("ラインブレイク"), oppLineBreakAC: sumOpp("ラインブレイクAC"),
      oppCross: sumOpp("クロス"), oppShots: sumOpp("シュート"),
      oppCorners: sumOpp("CK数"), oppFreeKicks: sumOpp("FK数"), oppXg: sumOpp("xG"),
    })
  }

  return NextResponse.json({ matches })
}
