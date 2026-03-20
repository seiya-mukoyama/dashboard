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

// gviz JSONのsigを取得（シートが存在するかの確認に使用）
async function getSheetSig(sheetName?: string): Promise<string> {
  const query = sheetName
    ? `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`
    : `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/gviz/tq?tqx=out:json`
  try {
    const res = await fetch(query, { cache: "no-store" })
    const text = await res.text()
    const json = JSON.parse(text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, ''))
    return json.sig ?? ''
  } catch {
    return ''
  }
}

async function fetchSheetByName(
  sheetName: string,
  offset: number,
  defaultSig: string,
  vP: number[], vI: number[], oP: number[], oI: number[]
): Promise<boolean> {
  // sigがデフォルトと同じ → シートが存在しない（デフォルトシートが返っている）
  const sig = await getSheetSig(sheetName)
  if (!sig || sig === defaultSig) return false

  // シートが存在する → CSVを取得してデータ集計
  const url = `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return false
  const csv = await res.text()
  if (!csv.trim()) return false

  const rows = csv.split("\n").slice(1).map(parseCSVLine)
  let hasData = false

  rows.forEach(cols => {
    const cat   = cols[1]?.trim()
    const click = cols[3]?.trim()
    if (!cat || !click) return
    const min = toMinutes(click)
    if (min === null) return
    const isOpp = cat === "相手"
    const lb = Math.floor(min / 5)
    if (lb < 0 || lb >= 9) return
    const bucket = lb + offset
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

// 最初のシート（デフォルト）のCSVを直接使ってデータ集計
async function fetchDefaultSheet(
  offset: number,
  vP: number[], vI: number[], oP: number[], oI: number[]
): Promise<boolean> {
  const url = `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/gviz/tq?tqx=out:csv`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return false
  const csv = await res.text()
  if (!csv.trim()) return false

  const rows = csv.split("\n").slice(1).map(parseCSVLine)
  let hasData = false
  rows.forEach(cols => {
    const cat = cols[1]?.trim(); const click = cols[3]?.trim()
    if (!cat || !click) return
    const min = toMinutes(click); if (min === null) return
    const isOpp = cat === "相手"
    const lb = Math.floor(min / 5); if (lb < 0 || lb >= 9) return
    const bucket = lb + offset; hasData = true
    for (let i = 6; i < cols.length; i++) {
      const d = cols[i]?.trim(); if (!d) continue
      if (/^P [\d.]+/.test(d) || /^Packing [\d.]+/.test(d)) { const pts = extractNum(d); if (isOpp) oP[bucket] += pts; else vP[bucket] += pts }
      if (/^I [\d.]+/.test(d) || /^Impect [\d.]+/.test(d)) { const pts = extractNum(d); if (isOpp) oI[bucket] += pts; else vI[bucket] += pts }
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

    // デフォルトシートのsigを取得（存在確認の基準）
    const defaultSig = await getSheetSig()

    const firstHalfName  = `${date}前半`
    const secondHalfName = `${date}後半`

    // 前半シートの処理
    // sigがデフォルトと同じ → 前半が最初のシートか、存在しないシート
    const firstSig = await getSheetSig(firstHalfName)
    let hasFirst = false

    if (firstSig && firstSig !== defaultSig) {
      // 別のシートが存在する
      hasFirst = await fetchSheetByName(firstHalfName, 0, defaultSig, vPacking, vImpact, oPacking, oImpact)
    } else if (firstSig === defaultSig) {
      // sigが一致 → 前半が最初のシート（デフォルト）の可能性がある
      // デフォルトシートのA1が「前半」かつ、後半シートが存在するか確認
      const secondSig = await getSheetSig(secondHalfName)
      if (secondSig && secondSig !== defaultSig) {
        // 後半が別シートとして存在する → 前半はデフォルトシート
        hasFirst = await fetchDefaultSheet(0, vPacking, vImpact, oPacking, oImpact)
      }
      // 後半も存在しない（両方sigが同じ）→ この日付のデータなし
    }

    // 後半シートの処理
    let hasSecond = false
    const secondSig = await getSheetSig(secondHalfName)
    if (secondSig && secondSig !== defaultSig) {
      hasSecond = await fetchSheetByName(secondHalfName, 9, defaultSig, vPacking, vImpact, oPacking, oImpact)
    }

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