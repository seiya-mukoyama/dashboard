import { NextResponse } from "next/server"

const PACKING_SHEET_ID = "1i1PmWTCT_x73GlDHTes9lN-e956gKPfapdY_P_nK11g"
const PLAYERS_SHEET_ID = "1vnHF5iHJkirI6PhUzD3isKmdkz6Vani4aQfItMgL80k"
const HALVES = [
  { gid: "0" },
  { gid: "2146914840" },
]

const POS_ORDER: Record<string, number> = { GK: 1, DF: 2, MF: 3, FW: 4 }

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
    // 選手一覧取得（姓→フルネーム・ポジションマップ）
    const playersUrl = `https://docs.google.com/spreadsheets/d/${PLAYERS_SHEET_ID}/export?format=csv&gid=0`
    const playersRes = await fetch(playersUrl, { cache: "no-store" })
    const playersCsv = await playersRes.text()

    // 姓→{fullName, pos} マップ
    const lastNameMap: Record<string, { fullName: string; pos: string }> = {}
    playersCsv.split("\n").slice(1).forEach(line => {
      const cols = parseCSVLine(line)
      const fullName = cols[1]?.trim()
      const pos      = cols[3]?.trim()
      if (!fullName || !pos) return
      // 姓（スペース前）で登録
      const lastName = fullName.split(/[\s\u3000]/)[0]
      if (lastName) lastNameMap[lastName] = { fullName, pos }
      // フルネームでも登録
      lastNameMap[fullName] = { fullName, pos }
    })

    type PlayerStats = {
      lastName: string; fullName: string; pos: string
      packing: number; packingR: number
      impact: number; impactR: number
    }
    const stats: Record<string, PlayerStats> = {}

    const getOrCreate = (lastName: string): PlayerStats => {
      if (!stats[lastName]) {
        const info = lastNameMap[lastName] ?? { fullName: lastName, pos: "-" }
        stats[lastName] = { lastName, fullName: info.fullName, pos: info.pos, packing: 0, packingR: 0, impact: 0, impactR: 0 }
      }
      return stats[lastName]
    }

    for (const { gid } of HALVES) {
      const url = `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/export?format=csv&gid=${gid}`
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) continue
      const csv = await res.text()
      const rows = csv.split("\n").slice(1).map(parseCSVLine)

      rows.forEach(cols => {
        const cat = cols[1]?.trim()
        if (!cat || SKIP_CATS.has(cat)) return

        const p = getOrCreate(cat)

        for (let i = 6; i < cols.length; i++) {
          const d = cols[i]?.trim()
          if (!d) continue

          if (/^P [\d.]+/.test(d) || /^Packing [\d.]+/.test(d)) {
            p.packing += extractNum(d)
          }
          if (/^I [\d.]+/.test(d) || /^Impect [\d.]+/.test(d)) {
            p.impact += extractNum(d)
          }

          // "名前 Res" → 次列の Packing/Impect をレシーブとして加算
          const resMatch = d.match(/^(.+?) Res$/)
          if (resMatch) {
            const recLastName = resMatch[1].split(/[\s\u3000]/)[0]
            const rec = getOrCreate(recLastName)
            for (let j = i + 1; j < Math.min(i + 4, cols.length); j++) {
              const next = cols[j]?.trim()
              if (!next) continue
              if (/^Packing [\d.]+/.test(next)) rec.packingR += extractNum(next)
              if (/^Impect [\d.]+/.test(next))  rec.impactR  += extractNum(next)
            }
          }
        }
      })
    }

    const round1 = (v: number) => Math.round(v * 10) / 10

    const result = Object.values(stats)
      .map(s => ({
        name: s.fullName,
        pos: s.pos,
        packing: round1(s.packing),
        packingR: round1(s.packingR),
        impact: round1(s.impact),
        impactR: round1(s.impactR),
      }))
      .sort((a, b) => {
        const pa = POS_ORDER[a.pos] ?? 9
        const pb = POS_ORDER[b.pos] ?? 9
        if (pa !== pb) return pa - pb
        return b.packing - a.packing
      })

    return NextResponse.json(result)
  } catch (e) {
    console.error(e)
    return NextResponse.json([])
  }
}