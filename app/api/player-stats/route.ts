import { NextResponse } from "next/server"

const PACKING_SHEET_ID = "1i1PmWTCT_x73GlDHTes9lN-e956gKPfapdY_P_nK11g"
const PLAYERS_SHEET_ID = "1vnHF5iHJkirI6PhUzD3isKmdkz6Vani4aQfItMgL80k"
const TRACKING_SHEET_ID = "1FNxTC76yGGXbswZa5TTXTVDoSBvzh8gWiCsS-c7lvn4"
const HALVES = [{ gid: "0" }, { gid: "2146914840" }]
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

function normName(s: string): string {
  return s.replace(/[\s\u3000]/g, "")
}

async function getDefaultSig(): Promise<string> {
  try {
    const res = await fetch(
      `https://docs.google.com/spreadsheets/d/${TRACKING_SHEET_ID}/gviz/tq?tqx=out:json`,
      { cache: "no-store" }
    )
    const text = await res.text()
    const json = JSON.parse(text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, ''))
    return json.sig ?? ''
  } catch { return '' }
}

async function getSheetSig(sheetName: string): Promise<string> {
  try {
    const res = await fetch(
      `https://docs.google.com/spreadsheets/d/${TRACKING_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`,
      { cache: "no-store" }
    )
    const text = await res.text()
    const json = JSON.parse(text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, ''))
    return json.sig ?? ''
  } catch { return '' }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date") ?? ""

  try {
    // 選手一覧（姓→フルネーム・ポジション）
    const playersUrl = `https://docs.google.com/spreadsheets/d/${PLAYERS_SHEET_ID}/export?format=csv&gid=0`
    const playersRes = await fetch(playersUrl, { cache: "no-store" })
    const playersCsv = await playersRes.text()
    const lastNameMap: Record<string, { fullName: string; pos: string }> = {}
    playersCsv.split("\n").slice(1).forEach(line => {
      const cols = parseCSVLine(line)
      const fullName = cols[1]?.trim(); const pos = cols[3]?.trim()
      if (!fullName || !pos) return
      const lastName = fullName.split(/[\s\u3000]/)[0]
      if (lastName) lastNameMap[lastName] = { fullName, pos }
      lastNameMap[fullName] = { fullName, pos }
    })

    // パッキング集計
    type PlayerStats = {
      lastName: string; fullName: string; pos: string
      packing: number; packingR: number; impact: number; impactR: number
      distance: number | null; maxSpeed: number | null; hi: number | null; sprint: number | null
    }
    const stats: Record<string, PlayerStats> = {}
    const getOrCreate = (lastName: string): PlayerStats => {
      if (!stats[lastName]) {
        const info = lastNameMap[lastName] ?? { fullName: lastName, pos: "-" }
        stats[lastName] = { lastName, fullName: info.fullName, pos: info.pos, packing: 0, packingR: 0, impact: 0, impactR: 0, distance: null, maxSpeed: null, hi: null, sprint: null }
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
          const d = cols[i]?.trim(); if (!d) continue
          if (/^P [\d.]+/.test(d) || /^Packing [\d.]+/.test(d)) p.packing += extractNum(d)
          if (/^I [\d.]+/.test(d) || /^Impect [\d.]+/.test(d)) p.impact += extractNum(d)
          const resMatch = d.match(/^(.+?) Res$/)
          if (resMatch) {
            const rec = getOrCreate(resMatch[1].split(/[\s\u3000]/)[0])
            for (let j = i + 1; j < Math.min(i + 4, cols.length); j++) {
              const next = cols[j]?.trim(); if (!next) continue
              if (/^Packing [\d.]+/.test(next)) rec.packingR += extractNum(next)
              if (/^Impect [\d.]+/.test(next)) rec.impactR += extractNum(next)
            }
          }
        }
      })
    }

    // トラッキングデータ（試合日が指定されている場合のみ取得）
    if (date) {
      try {
        const [defaultSig, sheetSig] = await Promise.all([getDefaultSig(), getSheetSig(date)])
        let csvUrl = ''
        if (sheetSig && sheetSig !== defaultSig) {
          csvUrl = `https://docs.google.com/spreadsheets/d/${TRACKING_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(date)}`
        } else if (sheetSig === defaultSig) {
          // 最初のシートの可能性 - htmlで確認
          const htmlRes = await fetch(
            `https://docs.google.com/spreadsheets/d/${TRACKING_SHEET_ID}/gviz/tq?tqx=out:html&tq=SELECT+1+LIMIT+0&sheet=${encodeURIComponent(date)}`,
            { cache: "no-store" }
          )
          const html = await htmlRes.text()
          if (html.includes(date)) {
            csvUrl = `https://docs.google.com/spreadsheets/d/${TRACKING_SHEET_ID}/export?format=csv&gid=0`
          }
        }

        if (csvUrl) {
          const res = await fetch(csvUrl, { cache: "no-store" })
          if (res.ok) {
            const csv = await res.text()
            const rows = csv.split("\n").map(parseCSVLine)
            const header = rows[0].map(h => h.toLowerCase().replace(/[_\s]/g, ''))
            const idxName   = header.findIndex(h => h === 'name')
            const idxDist   = header.findIndex(h => h.includes('distance') || h === 'dist')
            const idxSpeed  = header.findIndex(h => h.includes('spdmx'))
            const idxHI     = header.findIndex(h => h.includes('hi') && h.includes('%'))
            const idxSprint = header.findIndex(h => h === 'sprint')

            rows.slice(1).forEach(cols => {
              const rawName = cols[idxName]?.trim()
              if (!rawName) return
              const normRaw = normName(rawName)
              // パッキングシートの選手（姓のみ）と照合
              // フルネーム完全一致 → 姓のみ照合の順で試みる
              const normFirst = normRaw.split('')[0] // 不使用
              const matched = Object.values(stats).find(s => normName(s.fullName) === normRaw) ??
                Object.values(stats).find(s => {
                  const lastName = normName(s.fullName.split(/[\s\u3000]/)[0])
                  const trackingLastName = normName(rawName.split(/[\s\u3000]/)[0])
                  return lastName === trackingLastName
                })
              if (!matched) return
              if (idxDist >= 0) matched.distance = Math.round(parseFloat(cols[idxDist]) || 0) || null
              if (idxSpeed >= 0) matched.maxSpeed = parseFloat(cols[idxSpeed]) || null
              if (idxHI >= 0) matched.hi = parseFloat(cols[idxHI]) || null
              if (idxSprint >= 0) matched.sprint = parseInt(cols[idxSprint]) || null
            })
          }
        }
      } catch { /* トラッキングデータ取得失敗は無視 */ }
    }

    const round1 = (v: number) => Math.round(v * 10) / 10
    const result = Object.values(stats)
      .map(s => ({
        name: s.fullName, pos: s.pos,
        packing: round1(s.packing), packingR: round1(s.packingR),
        impact: round1(s.impact), impactR: round1(s.impactR),
        distance: s.distance, maxSpeed: s.maxSpeed, hi: s.hi, sprint: s.sprint,
      }))
      .sort((a, b) => {
        const pa = POS_ORDER[a.pos] ?? 9, pb = POS_ORDER[b.pos] ?? 9
        return pa !== pb ? pa - pb : b.packing - a.packing
      })
    return NextResponse.json(result)
  } catch (e) {
    console.error(e)
    return NextResponse.json([])
  }
}