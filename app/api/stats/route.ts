import { NextResponse } from "next/server"

const STATS_SHEET_ID = process.env.STATS_SHEET_ID || "1Y_im99vGkmEc-6GgwXqXQC2Lz6yriRGqy-xV5wlm48g"
const API_KEY = process.env.GOOGLE_API_KEY

export async function GET() {
  try {
    if (!API_KEY) {
      return NextResponse.json({ teamName: "VONDS市原", matches: [] })
    }

    // スタッツシートを取得（A1:K33の範囲）
    const sheetName = encodeURIComponent("スタッツ")
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${STATS_SHEET_ID}/values/${sheetName}!A1:K33?key=${API_KEY}`
    const res = await fetch(url, { next: { revalidate: 300 } })

    if (!res.ok) {
      return NextResponse.json({ teamName: "VONDS市原", matches: [] })
    }

    const json = await res.json()
    const rows: string[][] = json.values ?? []

    const n = (v: string | undefined) => Number(v) || 0

    // 列Cから始まる試合データを取得（列インデックス2〜、最終列=平均列を除く）
    const dateCols: number[] = []
    const dateRow = rows[1] ?? [] // 行2（0-indexed: 行1）
    for (let col = 2; col < dateRow.length; col++) {
      if (dateRow[col] && dateRow[col] !== "平均") {
        dateCols.push(col)
      }
    }

    const matches = dateCols.map(col => ({
      date: rows[1]?.[col] ?? "",
      tournament: rows[3]?.[col] ?? "",
      opponent: rows[4]?.[col] ?? "",
      goalsFor: n(rows[5]?.[col]),
      goalsAgainst: n(rows[6]?.[col]),
      // VONDS
      packingRate: n(rows[11]?.[col]),
      impact: n(rows[12]?.[col]),
      boxEntries: n(rows[13]?.[col]),
      goalAreaEntries: n(rows[14]?.[col]),
      lineBreak: n(rows[15]?.[col]),
      lineBreakAC: n(rows[16]?.[col]),
      crosses: n(rows[17]?.[col]),
      shots: n(rows[18]?.[col]),
      corners: n(rows[19]?.[col]),
      freeKicks: n(rows[20]?.[col]),
      // 相手チーム
      opp_packingRate: n(rows[23]?.[col]),
      opp_impact: n(rows[24]?.[col]),
      opp_boxEntries: n(rows[25]?.[col]),
      opp_goalAreaEntries: n(rows[26]?.[col]),
      opp_lineBreak: n(rows[27]?.[col]),
      opp_lineBreakAC: n(rows[28]?.[col]),
      opp_crosses: n(rows[29]?.[col]),
      opp_shots: n(rows[30]?.[col]),
      opp_corners: n(rows[31]?.[col]),
      opp_freeKicks: n(rows[32]?.[col]),
    })).filter(m => m.date && m.opponent)

    return NextResponse.json({ teamName: "VONDS市原", matches })
  } catch {
    return NextResponse.json({ teamName: "VONDS市原", matches: [] })
  }
}