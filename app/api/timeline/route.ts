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

async function getGvizSig(sheetName?: string): Promise<string> {
  try {
    const url = sheetName
      ? `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`
      : `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/gviz/tq?tqx=out:json`
    const res = await fetch(url, { cache: "no-store" })
    const text = await res.text()
    const json = JSON.parse(text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, ''))
    return json.sig ?? ''
  } catch { return '' }
}

type HalfData = {
  label: string   // "前半" | "後半" | "3本目" | etc
  labels: string[]
  vonds: { packing: number[]; impact: number[] }
  opp:   { packing: number[]; impact: number[] }
}

async function fetchHalfData(sheetName: string): Promise<HalfData | null> {
  const url = `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return null
  const csv = await res.text()
  if (!csv.trim()) return null

  const allRows = csv.split("\n").map(parseCSVLine)
  const half = allRows[0]?.[0]?.trim() ?? sheetName
  const rows = allRows.slice(1)

  // 最大バケット数を動的に決定（データがある最後の分+1）
  const MAX_BUCKETS = 18 // 90分
  const vPacking = new Array(MAX_BUCKETS).fill(0)
  const vImpact  = new Array(MAX_BUCKETS).fill(0)
  const oPacking = new Array(MAX_BUCKETS).fill(0)
  const oImpact  = new Array(MAX_BUCKETS).fill(0)

  rows.forEach(cols => {
    const cat   = cols[1]?.trim()
    const click = cols[3]?.trim()
    if (!cat || !click) return
    const min = toMinutes(click)
    if (min === null) return
    const isOpp = cat === "相手"
    const bucket = Math.floor(min / 5)
    if (bucket < 0 || bucket >= MAX_BUCKETS) return
    for (let i = 6; i < cols.length; i++) {
      const d = cols[i]?.trim(); if (!d) continue
      if (/^P [\d.]+/.test(d) || /^Packing [\d.]+/.test(d)) {
        const pts = extractNum(d); if (isOpp) oPacking[bucket] += pts; else vPacking[bucket] += pts
      }
      if (/^I [\d.]+/.test(d) || /^Impect [\d.]+/.test(d)) {
        const pts = extractNum(d); if (isOpp) oImpact[bucket] += pts; else vImpact[bucket] += pts
      }
    }
  })

  const lastBucket = Math.max(
    vPacking.findLastIndex(v => v > 0),
    oPacking.findLastIndex(v => v > 0)
  )
  if (lastBucket < 0) return null

  const maxBucket = Math.min(lastBucket + 1, MAX_BUCKETS)
  const cumSum = (arr: number[]) => { let acc = 0; return arr.map(v => { acc += v; return Math.round(acc * 10) / 10 }) }

  const cumV  = cumSum(vPacking).slice(0, maxBucket)
  const cumVI = cumSum(vImpact).slice(0, maxBucket)
  const cumO  = cumSum(oPacking).slice(0, maxBucket)
  const cumOI = cumSum(oImpact).slice(0, maxBucket)

  const labels = Array.from({ length: maxBucket }, (_, i) => `${i * 5}-${(i + 1) * 5}`)
  const exLabel = `${maxBucket * 5}-EX`
  labels.push(exLabel)
  cumV.push(cumV[cumV.length - 1] ?? 0)
  cumVI.push(cumVI[cumVI.length - 1] ?? 0)
  cumO.push(cumO[cumO.length - 1] ?? 0)
  cumOI.push(cumOI[cumOI.length - 1] ?? 0)

  return {
    label: half,
    labels,
    vonds: { packing: cumV, impact: cumVI },
    opp:   { packing: cumO, impact: cumOI }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date") ?? ""

  if (!date) {
    return NextResponse.json({ halves: [], noData: true })
  }

  try {
    const defaultSig = await getGvizSig()

    // 前半・後半・3本目・4本目... を順に確認
    const halfNames = ["前半", "後半", "3本目", "4本目", "5本目"]
    const halves: HalfData[] = []

    for (const halfName of halfNames) {
      const sheetName = `${date}${halfName}`
      const sig = await getGvizSig(sheetName)
      if (!sig) continue

      let data: HalfData | null = null

      if (sig !== defaultSig) {
        // 別シートが存在する
        data = await fetchHalfData(sheetName)
      } else if (sig === defaultSig && halfName === "前半") {
        // 前半が最初のシートの可能性 → 後半が存在するか確認
        const secondSig = await getGvizSig(`${date}後半`)
        if (secondSig && secondSig !== defaultSig) {
          // 前半は最初のシート（デフォルトCSVを使用）
          const url = `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/gviz/tq?tqx=out:csv`
          const res = await fetch(url, { cache: "no-store" })
          if (res.ok) {
            const csv = await res.text()
            const tempRows = csv.split("\n").slice(1).map(parseCSVLine)
            // fetchHalfDataのロジックを再利用するため一時的なアプローチ
            const MAX_BUCKETS = 18
            const vP = new Array(MAX_BUCKETS).fill(0), vI = new Array(MAX_BUCKETS).fill(0)
            const oP = new Array(MAX_BUCKETS).fill(0), oI = new Array(MAX_BUCKETS).fill(0)
            tempRows.forEach(cols => {
              const cat = cols[1]?.trim(); const click = cols[3]?.trim()
              if (!cat || !click) return
              const min = toMinutes(click); if (min === null) return
              const isOpp = cat === "相手"
              const bucket = Math.floor(min / 5); if (bucket < 0 || bucket >= MAX_BUCKETS) return
              for (let i = 6; i < cols.length; i++) {
                const d = cols[i]?.trim(); if (!d) continue
                if (/^P [\d.]+/.test(d) || /^Packing [\d.]+/.test(d)) { const pts = extractNum(d); if (isOpp) oP[bucket] += pts; else vP[bucket] += pts }
                if (/^I [\d.]+/.test(d) || /^Impect [\d.]+/.test(d)) { const pts = extractNum(d); if (isOpp) oI[bucket] += pts; else vI[bucket] += pts }
              }
            })
            const lastBucket = Math.max(vP.findLastIndex(v => v > 0), oP.findLastIndex(v => v > 0))
            if (lastBucket >= 0) {
              const maxBucket = Math.min(lastBucket + 1, MAX_BUCKETS)
              const cumSum = (arr: number[]) => { let acc = 0; return arr.map(v => { acc += v; return Math.round(acc * 10) / 10 }) }
              const labels = [...Array.from({ length: maxBucket }, (_, i) => `${i * 5}-${(i + 1) * 5}`), `${maxBucket * 5}-EX`]
              const cV = [...cumSum(vP).slice(0, maxBucket)]; cV.push(cV[cV.length-1] ?? 0)
              const cVI = [...cumSum(vI).slice(0, maxBucket)]; cVI.push(cVI[cVI.length-1] ?? 0)
              const cO = [...cumSum(oP).slice(0, maxBucket)]; cO.push(cO[cO.length-1] ?? 0)
              const cOI = [...cumSum(oI).slice(0, maxBucket)]; cOI.push(cOI[cOI.length-1] ?? 0)
              data = { label: "前半", labels, vonds: { packing: cV, impact: cVI }, opp: { packing: cO, impact: cOI } }
            }
          }
        }
      }

      if (data) halves.push(data)
    }

    if (halves.length === 0) {
      return NextResponse.json({ halves: [], noData: true })
    }

    return NextResponse.json({ halves })
  } catch {
    return NextResponse.json({ error: "error" }, { status: 500 })
  }
}