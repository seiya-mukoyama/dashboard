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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filter = searchParams.get("type") ?? "all"

  const url = `https://docs.google.com/spreadsheets/d/${STATS_SHEET_ID}/gviz/tq?tqx=out:csv&gid=${STATS_GID}`
  let csv: string | null = null
  try {
    const res = await fetch(url, { cache: "no-store" })
    if (res.ok) csv = await res.text()
  } catch { /* ignore */ }

  if (!csv) return NextResponse.json({ matches: [] })

  const rows = csv.split("\n").map(parseCSVLine)
  const numCols = rows[0]?.length ?? 0
  const matches = []

  for (let col = 2; col < numCols; col++) {
    // スプレッドシートの行構造
    // row0=ラベル列, row1=日付, row2=大会名(HOME/AWAY), row3=TMまたは公式戦名, row4=本数(前半/後半), row5=対戦相手
    const date = rows[1]?.[col] ?? ""
    const venue = rows[2]?.[col] ?? ""
    const matchType = rows[3]?.[col] ?? ""
    const period = rows[4]?.[col] ?? ""
    const opponent = rows[5]?.[col] ?? ""

    if (!date) continue

    const isTM = matchType === "TM"
    if (filter === "tm" && !isTM) continue
    if (filter === "official" && isTM) continue

    const getRow = (label: string): string | null => {
      const idx = rows.findIndex(r => r[1] === label)
      if (idx < 0) return null
      const v = rows[idx]?.[col] ?? ""
      return v !== "" ? v : null
    }

    const num = (label: string) => {
      const v = getRow(label)
      if (v === null) return null
      const n = parseFloat(v)
      return isNaN(n) ? null : n
    }

    matches.push({
      date,
      venue,
      type: isTM ? "TM" : "official",
      matchType,
      period,
      opponent,
      score: num("得点"),
      conceded: num("失点"),
      matchTime: num("試合時間"),
      apt: getRow("APT(90分換算)"),
      packing: num("パッキングレート"),
      impact: num("インペクト"),
      boxEntries: num("ボックス侵入回数"),
      goalAreaEntries: num("ゴールエリア侵入回数"),
      lineBreak: num("ラインブレイク"),
      lineBreakAC: num("ラインブレイクＡＣ"),
      cross: num("クロス"),
      shots: num("シュート"),
      corners: num("ＣＫ数"),
      freeKicks: num("ＦＫ数"),
      xg: num("xG"),
    })
  }

  return NextResponse.json({ matches })
}
