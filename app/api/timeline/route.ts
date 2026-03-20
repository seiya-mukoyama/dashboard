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

type BucketData = { vP: number[]; vI: number[]; oP: number[]; oI: number[] }

async function fetchHalfData(csvUrl: string): Promise<BucketData | null> {
  const res = await fetch(csvUrl, { cache: "no-store" })
  if (!res.ok) return null
  const csv = await res.text()
  if (!csv.trim()) return null

  const BUCKETS = 18
  const vP = new Array(BUCKETS).fill(0)
  const vI = new Array(BUCKETS).fill(0)
  const oP = new Array(BUCKETS).fill(0)
  const oI = new Array(BUCKETS).fill(0)
  let hasData = false

  const rows = csv.split("\n").slice(1).map(parseCSVLine)
  rows.forEach(cols => {
    const cat = cols[1]?.trim(); const click = cols[3]?.trim()
    if (!cat || !click) return
    const min = toMinutes(click); if (min === null) return
    const isOpp = cat === "相手"
    const lb = Math.floor(min / 5); if (lb < 0 || lb >= BUCKETS) return
    hasData = true
    for (let i = 6; i < cols.length; i++) {
      const d = cols[i]?.trim(); if (!d) continue
      if (/^P [\d.]+/.test(d) || /^Packing [\d.]+/.test(d)) { const pts = extractNum(d); if (isOpp) oP[lb] += pts; else vP[lb] += pts }
      if (/^I [\d.]+/.test(d) || /^Impect [\d.]+/.test(d)) { const pts = extractNum(d); if (isOpp) oI[lb] += pts; else vI[lb] += pts }
    }
  })
  if (!hasData) return null
  return { vP, vI, oP, oI }
}

function buildResult(data: BucketData, label: string) {
  const cumSum = (arr: number[]) => { let acc = 0; return arr.map(v => { acc += v; return Math.round(acc * 10) / 10 }) }
  const lastBucket = Math.max(data.vP.findLastIndex(v => v > 0), data.oP.findLastIndex(v => v > 0))
  if (lastBucket < 0) return null
  const maxBucket = Math.min(lastBucket + 1, 18)
  const cumV  = cumSum(data.vP).slice(0, maxBucket)
  const cumVI = cumSum(data.vI).slice(0, maxBucket)
  const cumO  = cumSum(data.oP).slice(0, maxBucket)
  const cumOI = cumSum(data.oI).slice(0, maxBucket)
  const labels = Array.from({ length: maxBucket }, (_, i) => `${i * 5}-${(i + 1) * 5}`)
  labels.push(`${maxBucket * 5}-EX`)
  cumV.push(cumV[cumV.length-1] ?? 0); cumVI.push(cumVI[cumVI.length-1] ?? 0)
  cumO.push(cumO[cumO.length-1] ?? 0); cumOI.push(cumOI[cumOI.length-1] ?? 0)
  return { label, labels, vonds: { packing: cumV, impact: cumVI }, opp: { packing: cumO, impact: cumOI } }
}

function mergeBuckets(a: BucketData, b: BucketData): BucketData {
  const merge = (x: number[], y: number[]) => x.map((v, i) => v + (y[i] ?? 0))
  return { vP: merge(a.vP, b.vP), vI: merge(a.vI, b.vI), oP: merge(a.oP, b.oP), oI: merge(a.oI, b.oI) }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date") ?? ""
  if (!date) return NextResponse.json({ halves: [], noData: true })

  try {
    const defaultSig = await getGvizSig()
    const halfDefs = [
      { name: `${date}前半`, label: '前半' },
      { name: `${date}後半`, label: '後半' },
      { name: `${date}3本目`, label: '3本目' },
      { name: `${date}4本目`, label: '4本目' },
    ]
    const sigs = await Promise.all(halfDefs.map(h => getGvizSig(h.name)))

    const halves: ReturnType<typeof buildResult>[] = []
    const allBuckets: BucketData[] = []

    for (let i = 0; i < halfDefs.length; i++) {
      const { name, label } = halfDefs[i]
      const sig = sigs[i]
      let csvUrl = ''
      if (sig && sig !== defaultSig) {
        csvUrl = `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`
      } else if (sig === defaultSig && label === '前半') {
        const hasOther = sigs.slice(1).some(s => s && s !== defaultSig)
        if (hasOther) csvUrl = `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/gviz/tq?tqx=out:csv`
      }
      if (!csvUrl) continue
      const data = await fetchHalfData(csvUrl)
      if (!data) continue
      const result = buildResult(data, label)
      if (result) { halves.push(result); allBuckets.push(data) }
    }

    if (halves.length === 0) return NextResponse.json({ halves: [], noData: true })

    // 合計 = 全ハーフを合算
    const totalData = allBuckets.reduce((acc, cur) => mergeBuckets(acc, cur))
    const total = buildResult(totalData, '合計')

    return NextResponse.json({ total, halves })
  } catch {
    return NextResponse.json({ error: "error" }, { status: 500 })
  }
}