// @ts-nocheck
import { NextResponse } from "next/server"

export const revalidate = 300

const STATS_SHEET_ID = "1Y_im99vGkmEc-6GgwXqXQC2Lz6yriRGqy-xV5wlm48g"
const STATS_GID = "1979610514"

// Excelシリアル日付 → "M月D日" に変換
function serialToDateStr(serial: number): string {
  // Excelの基準日: 1900/1/1 = 1 (ただし1900/2/29のバグあり)
  const d = new Date((serial - 25569) * 86400 * 1000)
  const m = d.getUTCMonth() + 1
  const day = d.getUTCDate()
  return m + "月" + day + "日"
}

// APTの小数値 → "MM:SS" 形式に変換
function serialToTimeStr(serial: number | null): string | null {
  if (serial === null) return null
  if (typeof serial === 'string') return serial
  // serialは1日分の小数 (0.5 = 12時)
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

  // gviz JSONの各セル: { v: 値, f: フォーマット済み文字列 }
  // 日付・時刻は f を使うと表示形式で取れる
  const getF = (cell: any): string => cell?.f ?? (cell?.v != null ? String(cell.v) : "")
  const getV = (cell: any): any => cell?.v ?? null

  const rows: any[][] = rawRows.map(r => r.c ?? [])
  const numCols = rows[0]?.length ?? 0

  // 各行のラベルを B列(index 1)の v で検索
  const getRowIdx = (label: string) => rows.findIndex(r => getV(r[1]) === label)

  const num = (rowIdx: number, col: number): number | null => {
    if (rowIdx < 0 || !rows[rowIdx]) return null
    const v = getV(rows[rowIdx][col])
    if (v === null || v === "") return null
    const n = parseFloat(String(v))
    return isNaN(n) ? null : n
  }

  const labelRows: Record<string, number> = {}
  for (const label of [
    "得点","失点","試合時間","APT(90分換算)",
    "パッキングレート","インペクト","ボックス侵入回数","ゴールエリア侵入回数",
    "ラインブレイク","ラインブレイクＡＣ","クロス","シュート","ＣＫ数","ＦＫ数","xG"
  ]) { labelRows[label] = getRowIdx(label) }

  const matches = []

  for (let col = 2; col < numCols; col++) {
    const dateCell = rows[0]?.[col]
    const dateV = getV(dateCell)
    if (!dateV) continue
    // 日付: fにフォーマット済み文字列があればそれを使う、なければシリアル変換
    const date = dateCell?.f
      ? String(dateCell.f)
      : (typeof dateV === 'number' ? serialToDateStr(dateV) : String(dateV))

    const venue = getF(rows[1]?.[col]) || getV(rows[1]?.[col]) || ""      // HOME/AWAY
    const matchType = getF(rows[2]?.[col]) || getV(rows[2]?.[col]) || ""  // TM/公式戦名
    const period = getF(rows[3]?.[col]) || getV(rows[3]?.[col]) || ""     // 前半/後半
    const opponent = getF(rows[4]?.[col]) || getV(rows[4]?.[col]) || ""   // 対戦相手

    const isTM = String(matchType) === "TM"
    if (filter === "tm" && !isTM) continue
    if (filter === "official" && isTM) continue

    // APTは時刻シリアル値の場合があるので f を優先使用
    const aptCell = rows[labelRows["APT(90分換算)"]]?.[col]
    const apt = aptCell?.f ?? (aptCell?.v != null
      ? (typeof aptCell.v === 'number' && aptCell.v < 1 ? serialToTimeStr(aptCell.v) : String(aptCell.v))
      : null)

    matches.push({
      date: date.replace(/^Date(.*)$/, date),
      venue: String(venue), type: isTM ? "TM" : "official",
      matchType: String(matchType), period: String(period), opponent: String(opponent),
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
