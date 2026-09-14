// @ts-nocheck
import { NextResponse } from "next/server"

export const revalidate = 300

const STATS_SHEET_ID = "1Y_im99vGkmEc-6GgwXqXQC2Lz6yriRGqy-xV5wlm48g"
const STATS_GID = "1979610514"  // スタッツシート(全試合)
const TRACKING_SHEET_ID = "1FNxTC76yGGXbswZa5TTXTVDoSBvzh8gWiCsS-c7lvn4"

function parseCSVLine(line) {
  const cols = []; let cur = "", inQ = false
  for (const ch of line) {
    if (ch === '"') inQ = !inQ
    else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = "" }
    else cur += ch
  }
  cols.push(cur.trim())
  return cols.map(c => c.replace(/^"|"$/g, '').trim())
}

async function fetchCSV(url) {
  try {
    const res = await fetch(url, { cache: "no-store" })
    return res.ok ? await res.text() : null
  } catch { return null }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const filter = searchParams.get("type") ?? "all" // all | tm | official

  // スタッツシート取得
  const statsCSV = await fetchCSV(
    `https://docs.google.com/spreadsheets/d/${STATS_SHEET_ID}/gviz/tq?tqx=out:csv&gid=${STATS_GID}`
  )
  if (!statsCSV) return NextResponse.json({ matches: [] })

  const rows = statsCSV.split("\n").map(parseCSVLine)

  // ヘッダー行（転置前）
  // row0: ラベル列, row1=日付, row2=大会名, row3=TM/公式戦, row4=本数, row5=対戦相手
  const labelCol = rows.map(r => r[0])      // A列 = 各行のラベル
  const headerCol = rows.map(r => r[1])     // B列 = 別名ラベル
  
  // 各列(試合)のデータを取得
  const numCols = rows[0]?.length ?? 0
  const matches = []

  for (let col = 2; col < numCols; col++) {
    const date = rows[0]?.[col] ?? ""           // row0 = 日付
    const venue = rows[1]?.[col] ?? ""          // row1 = HOME/AWAY  
    const matchType = rows[2]?.[col] ?? ""      // row2 = TM or 公式戦名称
    const period = rows[3]?.[col] ?? ""         // row3 = 前半/後半
    const opponent = rows[4]?.[col] ?? ""       // row4 = 対戦相手

    if (!date || date === "日付") continue

    // タイプフィルター
    const isTM = matchType === "TM" || matchType.includes("TM")
    if (filter === "tm" && !isTM) continue
    if (filter === "official" && isTM) continue

    // 各スタッツ値を取得
    const getVal = (label) => {
      // ラベルに一致する行番号を探す
      // B列(別名)から棄てA列(ラベル)でマッチ
      const rowIdx = labelCol.findIndex(l => l === label)
      if (rowIdx < 0) return null
      const v = rows[rowIdx]?.[col]
      return v !== "" && v !== null ? (isNaN(Number(v)) ? v : Number(v)) : null
    }
    const getValByHeader = (label) => {
      const rowIdx = headerCol.findIndex(l => l === label)
      if (rowIdx < 0) return null
      const v = rows[rowIdx]?.[col]
      return v !== "" && v !== null ? (isNaN(Number(v)) ? v : Number(v)) : null
    }

    matches.push({
      date,
      venue,
      type: isTM ? "TM" : "official",
      matchType,
      period,
      opponent,
      // 自チーム
      score: getValByHeader("得点"),
      conceded: getValByHeader("失点"),
      matchTime: getValByHeader("試合時間"),
      apt: getValByHeader("APT(90分換算)"),
      packing: getValByHeader("パッキングレート"),
      impact: getValByHeader("インペクト"),
      boxEntries: getValByHeader("ボックス侵入回数"),
      goalAreaEntries: getValByHeader("ゴールエリア侵入回数"),
      lineBreak: getValByHeader("ラインブレイク"),
      lineBreakAC: getValByHeader("ラインブレイクＡＣ"),
      cross: getValByHeader("クロス"),
      shots: getValByHeader("シュート"),
      corners: getValByHeader("ＣＫ数"),
      freeKicks: getValByHeader("ＦＫ数"),
      xg: getValByHeader("xG"),
    })
  }

  // 日付順にソート
  matches.sort((a, b) => {
    const da = a.date.replace(/月|日/g, '/').replace(//$/, '')
    const db = b.date.replace(/月|日/g, '/').replace(//$/, '')
    return da.localeCompare(db)
  })

  return NextResponse.json({ matches })
}
