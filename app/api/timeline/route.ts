import { NextResponse } from "next/server"

const PACKING_SHEET_ID = "1i1PmWTCT_x73GlDHTes9lN-e956gKPfapdY_P_nK11g"

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gid = searchParams.get("gid") ?? "0"
  try {
    const url = `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/export?format=csv&gid=${gid}`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return NextResponse.json({ error: "fetch failed" }, { status: 500 })

    const csv = await res.text()
    const allRows = csv.split("\n").map(parseCSVLine)

    const a1 = allRows[0]?.[0]?.trim() ?? ""
    const half = a1 === "後半" ? "後半" : "前半"

    const rows = allRows.slice(1)

    const BUCKETS = 9 // 5分×9 = 0〜45分
    const vPacking = new Array(BUCKETS).fill(0)
    const vImpact  = new Array(BUCKETS).fill(0)
    const oPacking = new Array(BUCKETS).fill(0)
    const oImpact  = new Array(BUCKETS).fill(0)

    // 45分以降（EX）のデータもカウント
    let vPackingEX = 0, vImpactEX = 0, oPpackingEX = 0, oImpactEX = 0
    let hasEX = false

    rows.forEach(cols => {
      const cat   = cols[1]?.trim()
      const click = cols[3]?.trim()
      if (!cat || !click) return

      const min = toMinutes(click)
      if (min === null) return

      const isOpp = cat === "相手"
      const bucket = Math.floor(min / 5)

      const addPts = (d: string) => {
        if (/^P [\d.]+/.test(d) || /^Packing [\d.]+/.test(d)) {
          const pts = extractNum(d)
          if (bucket >= BUCKETS) {
            hasEX = true
            if (isOpp) oPpackingEX += pts; else vPackingEX += pts
          } else if (bucket >= 0) {
            if (isOpp) oPacking[bucket] += pts; else vPacking[bucket] += pts
          }
        }
        if (/^I [\d.]+/.test(d) || /^Impect [\d.]+/.test(d)) {
          const pts = extractNum(d)
          if (bucket >= BUCKETS) {
            hasEX = true
            if (isOpp) oImpactEX += pts; else vImpactEX += pts
          } else if (bucket >= 0) {
            if (isOpp) oImpact[bucket] += pts; else vImpact[bucket] += pts
          }
        }
      }

      for (let i = 6; i < cols.length; i++) {
        const d = cols[i]?.trim()
        if (d) addPts(d)
      }
    })

    const cumSum = (arr: number[]) => {
      let acc = 0
      return arr.map(v => { acc += v; return Math.round(acc * 10) / 10 })
    }

    const lastBucket = Math.max(
      vPacking.findLastIndex(v => v > 0),
      oPacking.findLastIndex(v => v > 0)
    )
    if (lastBucket < 0 && !hasEX) return NextResponse.json({ labels: [], vonds: { packing: [], impact: [] }, opp: { packing: [], impact: [] }, half })

    const maxBucket = Math.min(lastBucket + 1, BUCKETS)

    const cumV = cumSum(vPacking)
    const cumVI = cumSum(vImpact)
    const cumO = cumSum(oPacking)
    const cumOI = cumSum(oImpact)

    // ラベル: "0-5", "5-10", ..., "40-45" で maxBucket個
    const labels: string[] = Array.from({ length: maxBucket }, (_, i) => `${i * 5}-${(i + 1) * 5}`)

    const vp = cumV.slice(0, maxBucket)
    const vi = cumVI.slice(0, maxBucket)
    const op = cumO.slice(0, maxBucket)
    const oi = cumOI.slice(0, maxBucket)

    // EXデータがある場合、または最後のバケットが45分ちょうどなら "45-EX" を追加
    // どちらにしても最後に平行線（前の値を繰り返す）を追加
    const lastVP = vp[vp.length - 1] ?? 0
    const lastVI = vi[vi.length - 1] ?? 0
    const lastOP = op[op.length - 1] ?? 0
    const lastOI = oi[oi.length - 1] ?? 0

    labels.push("45-EX")
    vp.push(Math.round((lastVP + vPackingEX) * 10) / 10)
    vi.push(Math.round((lastVI + vImpactEX) * 10) / 10)
    op.push(Math.round((lastOP + oPpackingEX) * 10) / 10)
    oi.push(Math.round((lastOI + oImpactEX) * 10) / 10)

    return NextResponse.json({
      labels,
      half,
      vonds: { packing: vp, impact: vi },
      opp:   { packing: op, impact: oi }
    })
  } catch {
    return NextResponse.json({ error: "error" }, { status: 500 })
  }
}