import { NextResponse } from "next/server"

const PACKING_SHEET_ID = "1i1PmWTCT_x73GlDHTes9lN-e956gKPfapdY_P_nK11g"
const PLAYERS_SHEET_ID = "1vnHF5iHJkirI6PhUzD3isKmdkz6Vani4aQfItMgL80k"
// 後半シートのgid
const HALVES = [
  { gid: "0",          label: "前半" },
  { gid: "2146914840", label: "後半" },
]

function parseCSVLine(line: string): string[] {
  const cols: string[] = []; let cur = ""; let inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = "" }
    else { cur += ch }
  }
  cols.push(cur.trim())
  return cols
}

const SKIP_CATS = new Set(["相手","ボックス","被ボックス","クロス","被クロス",
  "エリア","被エリア","CK","被CK","FK","被FK"])

function extractNum(s: string): number {
  const m = s.match(/[\d.]+/)
  return m ? parseFloat(m[0]) : 0
}

export async function GET() {
  try {
    // 選手一覧取得（ポジション情報）
    const playersUrl = `https://docs.google.com/spreadsheets/d/${PLAYERS_SHEET_ID}/export?format=csv&gid=0`
    const playersRes = await fetch(playersUrl, { cache: "no-store" })
    const playersCsv = await playersRes.text()
    const posMap: Record<string, string> = {}
    playersCsv.split("\n").slice(1).forEach(line => {
      const cols = parseCSVLine(line)
      const name = cols[1]?.trim()
      const pos  = cols[3]?.trim()
      if (name && pos) {
        // 姓のみで照合できるようにする
        const lastName = name.split(/[\s　]/)[0]
        posMap[lastName] = pos
        posMap[name] = pos
      }
    })

    // パッキング個人シートから集計
    type PlayerStats = {
      name: string; pos: string
      packing: number; packingR: number
      impact: number; impactR: number
    }
    const stats: Record<string, PlayerStats> = {}

    for (const { gid } of HALVES) {
      const url = `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/export?format=csv&gid=${gid}`
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) continue
      const csv = await res.text()
      const rows = csv.split("\n").slice(1).map(parseCSVLine)

      rows.forEach(cols => {
        const cat = cols[1]?.trim()
        if (!cat || SKIP_CATS.has(cat)) return

        // この行の選手名
        const playerName = cat
        if (!stats[playerName]) {
          const pos = posMap[playerName] ?? posMap[playerName.split(/[\s　]/)[0]] ?? "-"
          stats[playerName] = { name: playerName, pos, packing: 0, packingR: 0, impact: 0, impactR: 0 }
        }

        // G列以降のDesからポイント集計
        for (let i = 6; i < cols.length; i++) {
          const d = cols[i]?.trim()
          if (!d) continue

          // この行の選手のパッキング（Pass系 + Packing系）
          if (/^P [\d.]+/.test(d) || /^Packing [\d.]+/.test(d)) {
            stats[playerName].packing += extractNum(d)
          }
          if (/^I [\d.]+/.test(d) || /^Impect [\d.]+/.test(d)) {
            stats[playerName].impact += extractNum(d)
          }

          // レシーブ（他の選手名 Res → Packingポイントのカウント）
          const resMatch = d.match(/^(.+?) Res$/)
          if (resMatch) {
            // 次の列にPacking N やImpect Nがあるか確認
            for (let j = i + 1; j < Math.min(i + 3, cols.length); j++) {
              const next = cols[j]?.trim()
              if (!next) continue
              if (/^Packing [\d.]+/.test(next)) {
                const recName = resMatch[1]
                if (!stats[recName]) {
                  const pos = posMap[recName] ?? "-"
                  stats[recName] = { name: recName, pos, packing: 0, packingR: 0, impact: 0, impactR: 0 }
                }
                stats[recName].packingR += extractNum(next)
              }
              if (/^Impect [\d.]+/.test(next)) {
                const recName = resMatch[1]
                if (!stats[recName]) {
                  const pos = posMap[recName] ?? "-"
                  stats[recName] = { name: recName, pos, packing: 0, packingR: 0, impact: 0, impactR: 0 }
                }
                stats[recName].impactR += extractNum(next)
              }
            }
          }
        }
      })
    }

    const round1 = (v: number) => Math.round(v * 10) / 10

    const result = Object.values(stats).map(s => ({
      name: s.name,
      pos: s.pos,
      packing: round1(s.packing),
      packingR: round1(s.packingR),
      impact: round1(s.impact),
      impactR: round1(s.impactR),
    })).sort((a, b) => b.packing - a.packing)

    return NextResponse.json(result)
  } catch (e) {
    console.error(e)
    return NextResponse.json([])
  }
}