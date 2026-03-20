import { NextResponse } from "next/server"

const STATS_SHEET_ID = "1Y_im99vGkmEc-6GgwXqXQC2Lz6yriRGqy-xV5wlm48g"
const STATS_GID = "1979610514"

// CSVの1行をカラム配列にパース
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

const n = (v: string | undefined) => Number(v) || 0

export async function GET() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${STATS_SHEET_ID}/export?format=csv&gid=${STATS_GID}`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return NextResponse.json({ teamName: "VONDS市原", matches: [] })

    const csv = await res.text()
    const rows = csv.split("\n").map(parseCSVLine)

    // 行2(index1): 日付行、C列以降(index2〜)、K列(index9)=平均=スキップ
    const dateRow = rows[1] ?? []
    const dateCols: number[] = []
    for (let col = 2; col < dateRow.length; col++) {
      const v = dateRow[col]?.trim()
      if (v && v !== "平均") dateCols.push(col)
    }

    const matches = dateCols.map(col => ({
      date:             rows[1]?.[col]?.trim() ?? "",
      tournament:       rows[3]?.[col]?.trim() ?? "",
      opponent:         rows[4]?.[col]?.trim() ?? "",
      goalsFor:         n(rows[5]?.[col]),
      goalsAgainst:     n(rows[6]?.[col]),
      // VONDS (行12〜21 = index11〜20)
      packingRate:      n(rows[11]?.[col]),
      impact:           n(rows[12]?.[col]),
      boxEntries:       n(rows[13]?.[col]),
      goalAreaEntries:  n(rows[14]?.[col]),
      lineBreak:        n(rows[15]?.[col]),
      lineBreakAC:      n(rows[16]?.[col]),
      crosses:          n(rows[17]?.[col]),
      shots:            n(rows[18]?.[col]),
      corners:          n(rows[19]?.[col]),
      freeKicks:        n(rows[20]?.[col]),
      // 相手チーム (行24〜33 = index23〜32)
      opp_packingRate:      n(rows[23]?.[col]),
      opp_impact:           n(rows[24]?.[col]),
      opp_boxEntries:       n(rows[25]?.[col]),
      opp_goalAreaEntries:  n(rows[26]?.[col]),
      opp_lineBreak:        n(rows[27]?.[col]),
      opp_lineBreakAC:      n(rows[28]?.[col]),
      opp_crosses:          n(rows[29]?.[col]),
      opp_shots:            n(rows[30]?.[col]),
      opp_corners:          n(rows[31]?.[col]),
      opp_freeKicks:        n(rows[32]?.[col]),
    })).filter(m => m.date && m.opponent)

    return NextResponse.json({ teamName: "VONDS市原", matches })
  } catch {
    return NextResponse.json({ teamName: "VONDS市原", matches: [] })
  }
}