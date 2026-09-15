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
  let csv = ""
  try {
    const res = await fetch(url, { cache: "no-store" })
    if (res.ok) csv = await res.text()
  } catch { /**/ }

  if (!csv) return NextResponse.json({ matches: [] })

  const rows = csv.split("\n").map(parseCSVLine)
  const numCols = rows[0]?.length ?? 0

  // 実際の行構造 (gviz CSV):
  // rows[0]: B列="", col2以降=日付
  // rows[1]: B列="大会名", col2以降=HOME/AWAY(スプレは結合セルで空)
  // rows[2]: B列="本数", col2以降=TM or 公式戦名(結合セルで空かも)
  // rows[3]: B列="対戦相手", col2以降=対戦相手名(結合セルで空かも)
  // rows[4]: B列="得点", col2以降=得点値
  // ...
  // 結合セルの場合、gvizは最初の列に値を入れ、展開列は空になる
  // → B列の値は入っている(結合接続首列)
  // → col2以降の値は空(HOME/AWAY/TMなどはスプレッドシート内で結合セルの場合)
  // → スプレッドシート内では結合セルになっていないかにより値が入る

  // 実際のデータは rows[4](得点) などの横列に入ることは確認済み
  // → 日付(rows[0])  が入っている列を溜等して matchデータを構築

  const getRowIdx = (label: string) => rows.findIndex(r => r[1] === label)
  
  // 大会名・本数・対戦相手の実際の列内容を確認するため
  // 結合セルで空が殺られている場合は、前の列の値を継承するロジックを追加
  
  const matches = []
  
  // 大会名(HOME/AWAY)・ TM判定・本数・対戦相手の行を取得
  const venueRowIdx = getRowIdx("大会名")     // HOME/AWAY
  const typeRowIdx = getRowIdx("本数")       // TM/公式戦名
  const periodRowIdx = getRowIdx("対戦相手") // 対戦相手... 正確には rows[2]=本数(前半/後半), rows[3]=対戦相手

  // 順序通りに: rows[1]=大会名, rows[2]=本数, rows[3]=対戦相手
  // だが実際のスプレッドシート: row3=HOME/AWAY, row4=TM/公式戦, row5=前半/後半, row6=対戦相手
  // gviz CSVは1行オフセットなしで全行出力するので rows[0]=row1
  // しかし上記確認でrows[0]=日付行(row2)だった
  // → row1が永遠に空行だったと思われる

  // 結合セルの値の継承ロジックを追加して各列の値を正しく取得
  // rows[1][各列]など空の場合は、その列以前で最後に非空だった値を使う
  
  // 各メタ行の値を事前に渗入させる
  const fillRow = (rowIdx: number): string[] => {
    if (rowIdx < 0) return []
    const result: string[] = [...(rows[rowIdx] ?? [])]
    let last = ""
    for (let i = 2; i < result.length; i++) {
      if (result[i] !== "") last = result[i]
      else result[i] = last
    }
    return result
  }

  const venueRow = fillRow(1)   // 大会名(HOME/AWAY)
  const typeRow = fillRow(2)    // TM/公式戦名
  const periodRow = fillRow(3)  // 前半/後半
  const oppRow = fillRow(4)     // 対戦相手名

  for (let col = 2; col < numCols; col++) {
    const date = rows[0]?.[col] ?? ""
    if (!date) continue

    const matchTypeRaw = typeRow[col] ?? ""
    const isTM = matchTypeRaw === "TM"
    if (filter === "tm" && !isTM) continue
    if (filter === "official" && isTM) continue

    const getByLabel = (label: string): string | null => {
      const idx = getRowIdx(label)
      if (idx < 0) return null
      const v = rows[idx]?.[col] ?? ""
      return v !== "" ? v : null
    }
    const num = (label: string): number | null => {
      const v = getByLabel(label)
      if (v === null) return null
      const n = parseFloat(v)
      return isNaN(n) ? null : n
    }

    matches.push({
      date,
      venue: venueRow[col] ?? "",
      type: isTM ? "TM" : "official",
      matchType: matchTypeRaw,
      period: periodRow[col] ?? "",
      opponent: oppRow[col] ?? "",
      score: num("得点"), conceded: num("失点"),
      matchTime: num("試合時間"), apt: getByLabel("APT(90分換算)"),
      packing: num("パッキングレート"), impact: num("インペクト"),
      boxEntries: num("ボックス侵入回数"), goalAreaEntries: num("ゴールエリア侵入回数"),
      lineBreak: num("ラインブレイク"), lineBreakAC: num("ラインブレイクＡＣ"),
      cross: num("クロス"), shots: num("シュート"),
      corners: num("ＣＫ数"), freeKicks: num("ＦＫ数"), xg: num("xG"),
    })
  }

  return NextResponse.json({ matches })
}
