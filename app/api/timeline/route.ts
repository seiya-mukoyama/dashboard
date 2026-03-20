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
  if (parts.length === 2) return parseInt(parts[0]) + parseInt(parts[1]) / 60
  if (parts.length === 3) return parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 60
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
    const rows = csv.split("\n").slice(1).map(parseCSVLine)

    const BUCKETS = 18 // 5分×18 = 90分
    const vPacking = new Array(BUCKETS).fill(0)
    const vImpact  = new Array(BUCKETS).fill(0)
    const oPacking = new Array(BUCKETS).fill(0)
    const oImpact  = new Array(BUCKETS).fill(0)

    rows.forEach(cols => {
      const cat   = cols[1]?.trim()
      const click = cols[3]?.trim()
      if (!cat || !click) return

      const min = toMinutes(click)
      if (min === null) return
      const bucket = Math.floor(min / 5)
      if (bucket < 0 || bucket >= BUCKETS) return

      const isOpp = cat === "相手"

      // G列以降(index6〜)のDesからポイント抽出
      for (let i = 6; i < cols.length; i++) {
        const d = cols[i]?.trim()
        if (!d) continue
        if (/^P [\d.]+/.test(d) || /^Packing [\d.]+/.test(d)) {
          const pts = extractNum(d)
          if (isOpp) oPacking[bucket] += pts
          else vPacking[bucket] += pts
        }
        if (/^I [\d.]+/.test(d) || /^Impect [\d.]+/.test(d)) {
          const pts = extractNum(d)
          if (isOpp) oImpact[bucket] += pts
          else vImpact[bucket] += pts
        }
      }
    })

    // 累積合計
    const cumSum = (arr: number[]) => {
      let acc = 0
      return arr.map(v => { acc += v; return Math.round(acc * 10) / 10 })
    }

    // 最後のデータがある時間帯を特定
    const lastBucket = Math.max(
      vPacking.findLastIndex(v => v > 0),
      oPacking.findLastIndex(v => v > 0)
    )
    const maxBucket = lastBucket >= 0 ? lastBucket + 2 : BUCKETS

    const labels = Array.from({ length: maxBucket }, (_, i) => `${i * 5}-${(i + 1) * 5}`)

    return NextResponse.json({
      labels,
      vonds: {
        packing: cumSum(vPacking).slice(0, maxBucket),
        impact:  cumSum(vImpact).slice(0, maxBucket),
      },
      opp: {
        packing: cumSum(oPacking).slice(0, maxBucket),
        impact:  cumSum(oImpact).slice(0, maxBucket),
      }
    })
  } catch {
    return NextResponse.json({ error: "error" }, { status: 500 })
  }
}