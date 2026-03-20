import { NextResponse } from "next/server"

const PACKING_SHEET_ID = "1i1PmWTCT_x73GlDHTes9lN-e956gKPfapdY_P_nK11g"
// 前半gid=0, 後半gid=2146914840
const HALVES = [
  { gid: "0",          half: "前半", offset: 0  },
  { gid: "2146914840", half: "後半", offset: 9  }, // 9バケット分(45分)オフセット
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

function toMinutes(t: string): number | null {
  const s = t.replace(/"/g, '').trim()
  if (!s) return null
  const parts = s.split(':')
  if (parts.length >= 2) return parseInt(parts[0]) + parseInt(parts[1]) / 60
  return null
}

function extractNum(s: string): number {
  const m = s.match(/[\d.]+/)
  return m ? parseFloat(m[0]) : 0
}

export async function GET() {
  try {
    const BUCKETS = 18 // 前半9 + 後半9 = 90分
    const vPacking = new Array(BUCKETS).fill(0)
    const vImpact  = new Array(BUCKETS).fill(0)
    const oPacking = new Array(BUCKETS).fill(0)
    const oImpact  = new Array(BUCKETS).fill(0)

    let lastDataBucket = -1
    let hasFirstHalf = false
    let hasSecondHalf = false

    for (const { gid, half, offset } of HALVES) {
      const url = `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/export?format=csv&gid=${gid}`
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) continue

      const csv = await res.text()
      const allRows = csv.split("\n").map(parseCSVLine)
      const a1 = allRows[0]?.[0]?.trim() ?? ""
      if (a1 === "前半") hasFirstHalf = true
      if (a1 === "後半") hasSecondHalf = true

      const rows = allRows.slice(1)

      rows.forEach(cols => {
        const cat   = cols[1]?.trim()
        const click = cols[3]?.trim()
        if (!cat || !click) return

        const min = toMinutes(click)
        if (min === null) return

        const isOpp = cat === "相手"
        const localBucket = Math.floor(min / 5)
        if (localBucket < 0 || localBucket >= 9) return

        const bucket = localBucket + offset

        for (let i = 6; i < cols.length; i++) {
          const d = cols[i]?.trim()
          if (!d) continue
          if (/^P [\d.]+/.test(d) || /^Packing [\d.]+/.test(d)) {
            const pts = extractNum(d)
            if (isOpp) oPacking[bucket] += pts; else vPacking[bucket] += pts
          }
          if (/^I [\d.]+/.test(d) || /^Impect [\d.]+/.test(d)) {
            const pts = extractNum(d)
            if (isOpp) oImpact[bucket] += pts; else vImpact[bucket] += pts
          }
        }
      })

      // このハーフで最後にデータがあったバケットを更新
      for (let b = offset + 8; b >= offset; b--) {
        if (vPacking[b] > 0 || oPacking[b] > 0) {
          lastDataBucket = Math.max(lastDataBucket, b)
          break
        }
      }
    }

    if (lastDataBucket < 0) return NextResponse.json({ labels: [], vonds: { packing: [], impact: [] }, opp: { packing: [], impact: [] } })

    const maxBucket = Math.min(lastDataBucket + 1, BUCKETS)

    const cumSum = (arr: number[]) => {
      let acc = 0
      return arr.map(v => { acc += v; return Math.round(acc * 10) / 10 })
    }

    const cumV  = cumSum(vPacking).slice(0, maxBucket)
    const cumVI = cumSum(vImpact).slice(0, maxBucket)
    const cumO  = cumSum(oPacking).slice(0, maxBucket)
    const cumOI = cumSum(oImpact).slice(0, maxBucket)

    // ラベル: 前半は"0-5"〜"40-45", 後半は"45-50"〜"85-90"
    const labels: string[] = Array.from({ length: maxBucket }, (_, i) => {
      const start = i * 5
      const end = (i + 1) * 5
      return `${start}-${end}`
    })

    // 末尾に "EX" バケットを追加（平行線）
    const exLabel = hasSecondHalf ? "90-EX" : "45-EX"
    labels.push(exLabel)
    cumV.push(cumV[cumV.length - 1] ?? 0)
    cumVI.push(cumVI[cumVI.length - 1] ?? 0)
    cumO.push(cumO[cumO.length - 1] ?? 0)
    cumOI.push(cumOI[cumOI.length - 1] ?? 0)

    return NextResponse.json({
      labels,
      hasFirstHalf,
      hasSecondHalf,
      vonds: { packing: cumV, impact: cumVI },
      opp:   { packing: cumO, impact: cumOI }
    })
  } catch {
    return NextResponse.json({ error: "error" }, { status: 500 })
  }
}