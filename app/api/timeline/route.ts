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

// シート名でCSVを取得（gviz APIを使用）
// 注意: gviz APIは存在しないシート名でも最初のシートを返すため、
// シート名の存在確認はデフォルト(gidなし)のCSVと比較して行う
async function getDefaultCsv(): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/export?format=csv`
  const res = await fetch(url, { cache: "no-store" })
  return res.ok ? await res.text() : ""
}

async function fetchSheetByName(
  sheetName: string,
  offset: number,
  defaultCsv: string,
  vP: number[], vI: number[], oP: number[], oI: number[]
): Promise<boolean> {
  const url = `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return false

  const csv = await res.text()
  if (!csv.trim()) return false

  // gviz APIはシートが存在しない場合、デフォルトシート（最初のシート）のデータを返す
  // → デフォルトCSVの先頭100文字と一致したら「シートが存在しない」と判定
  const defaultHead = defaultCsv.substring(0, 100)
  const csvHead = csv.substring(0, 100)
  if (defaultHead && csvHead === defaultHead) return false

  const rows = csv.split("\n").slice(1).map(parseCSVLine)
  let hasData = false

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
    hasData = true

    for (let i = 6; i < cols.length; i++) {
      const d = cols[i]?.trim()
      if (!d) continue
      if (/^P [\d.]+/.test(d) || /^Packing [\d.]+/.test(d)) {
        const pts = extractNum(d)
        if (isOpp) oP[bucket] += pts; else vP[bucket] += pts
      }
      if (/^I [\d.]+/.test(d) || /^Impect [\d.]+/.test(d)) {
        const pts = extractNum(d)
        if (isOpp) oI[bucket] += pts; else vI[bucket] += pts
      }
    }
  })
  return hasData
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date") ?? ""

  if (!date) {
    return NextResponse.json({ labels: [], vonds: { packing: [], impact: [] }, opp: { packing: [], impact: [] }, noData: true })
  }

  try {
    const BUCKETS = 18
    const vPacking = new Array(BUCKETS).fill(0)
    const vImpact  = new Array(BUCKETS).fill(0)
    const oPacking = new Array(BUCKETS).fill(0)
    const oImpact  = new Array(BUCKETS).fill(0)

    // デフォルトCSVを取得（シート存在確認のため）
    const defaultCsv = await getDefaultCsv()

    const firstHalfName  = `${date}前半`
    const secondHalfName = `${date}後半`

    const hasFirst  = await fetchSheetByName(firstHalfName,  0, defaultCsv, vPacking, vImpact, oPacking, oImpact)
    const hasSecond = await fetchSheetByName(secondHalfName, 9, defaultCsv, vPacking, vImpact, oPacking, oImpact)

    if (!hasFirst && !hasSecond) {
      return NextResponse.json({ labels: [], vonds: { packing: [], impact: [] }, opp: { packing: [], impact: [] }, noData: true })
    }

    const cumSum = (arr: number[]) => {
      let acc = 0
      return arr.map(v => { acc += v; return Math.round(acc * 10) / 10 })
    }

    const lastBucket = Math.max(
      vPacking.findLastIndex(v => v > 0),
      oPacking.findLastIndex(v => v > 0)
    )
    if (lastBucket < 0) return NextResponse.json({ labels: [], vonds: { packing: [], impact: [] }, opp: { packing: [], impact: [] }, noData: true })

    const maxBucket = Math.min(lastBucket + 1, BUCKETS)
    const cumV  = cumSum(vPacking).slice(0, maxBucket)
    const cumVI = cumSum(vImpact).slice(0, maxBucket)
    const cumO  = cumSum(oPacking).slice(0, maxBucket)
    const cumOI = cumSum(oImpact).slice(0, maxBucket)

    const labels: string[] = Array.from({ length: maxBucket }, (_, i) => `${i * 5}-${(i + 1) * 5}`)
    const exLabel = hasSecond ? "90-EX" : "45-EX"
    labels.push(exLabel)
    cumV.push(cumV[cumV.length - 1] ?? 0)
    cumVI.push(cumVI[cumVI.length - 1] ?? 0)
    cumO.push(cumO[cumO.length - 1] ?? 0)
    cumOI.push(cumOI[cumOI.length - 1] ?? 0)

    return NextResponse.json({ labels, vonds: { packing: cumV, impact: cumVI }, opp: { packing: cumO, impact: cumOI } })
  } catch {
    return NextResponse.json({ error: "error" }, { status: 500 })
  }
}