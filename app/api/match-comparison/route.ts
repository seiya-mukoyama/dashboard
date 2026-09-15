// @ts-nocheck
import { NextResponse } from "next/server"

export const revalidate = 300

const STATS_SHEET_ID = "1Y_im99vGkmEc-6GgwXqXQC2Lz6yriRGqy-xV5wlm48g"
const STATS_GID = "1979610514"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filter = searchParams.get("type") ?? "all"

  // gviz JSON形式で取得 - 結合セルの値も正しく取れる
  const url = `https://docs.google.com/spreadsheets/d/${STATS_SHEET_ID}/gviz/tq?tqx=out:json&gid=${STATS_GID}`
  let rows: (string|number|null)[][] = []
  try {
    const res = await fetch(url, { cache: "no-store" })
    if (res.ok) {
      const text = await res.text()
      const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}')+1))
      rows = (json.table?.rows ?? []).map((r: any) =>
        (r.c ?? []).map((c: any) => c?.v ?? null)
      )
    }
  } catch { /**/ }

  if (!rows.length) return NextResponse.json({ matches: [] })

  // 実際の行構造 (gviz JSON):
  // rows[0]: col2以降 = 日付
  // rows[1]: col1="大会名", col2以降 = HOME/AWAY
  // rows[2]: col1=null, col2以降 = TM or 公式戦名
  // rows[3]: col1="本数", col2以降 = 前半/後半
  // rows[4]: col1="対戦相手", col2以降 = 対戦相手名
  // rows[5]以降: col1=ラベル, col2以降 = 値

  const numCols = rows[0]?.length ?? 0

  // ラベルで行を検索
  const getRowIdx = (label: string) => rows.findIndex(r => r[1] === label)

  const num = (rowIdx: number, col: number): number | null => {
    if (rowIdx < 0) return null
    const v = rows[rowIdx]?.[col]
    if (v === null || v === "") return null
    const n = parseFloat(String(v))
    return isNaN(n) ? null : n
  }
  const str = (rowIdx: number, col: number): string => {
    const v = rows[rowIdx]?.[col]
    return v !== null && v !== undefined ? String(v) : ""
  }

  // 各ラベルの行インデックスを事前取得
  const labelRows: Record<string, number> = {}
  for (const label of [
    "得点","失点","試合時間","APT(90分換算)",
    "パッキングレート","インペクト","ボックス侵入回数","ゴールエリア侵入回数",
    "ラインブレイク","ラインブレイクＡＣ","クロス","シュート","ＣＫ数","ＦＫ数","xG"
  ]) { labelRows[label] = getRowIdx(label) }

  const matches = []

  for (let col = 2; col < numCols; col++) {
    const date = str(0, col)
    if (!date) continue

    const venue = str(1, col)       // HOME/AWAY
    const matchType = str(2, col)   // TM or 公式戦名
    const period = str(3, col)      // 前半/後半
    const opponent = str(4, col)    // 対戦相手

    const isTM = matchType === "TM"
    if (filter === "tm" && !isTM) continue
    if (filter === "official" && isTM) continue

    matches.push({
      date, venue,
      type: isTM ? "TM" : "official",
      matchType, period, opponent,
      score:           num(labelRows["得点"], col),
      conceded:        num(labelRows["失点"], col),
      matchTime:       num(labelRows["試合時間"], col),
      apt:             str(labelRows["APT(90分換算)"], col) || null,
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
