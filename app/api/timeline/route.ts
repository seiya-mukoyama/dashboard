import { NextResponse } from "next/server"

const PACKING_SHEET_ID = "1i1PmWTCT_x73GlDHTes9lN-e956gKPfapdY_P_nK11g"

// 試合日付 → パッキングシートのgid（前半・後半）
// スタッツカウントのdate列（例: "3月8日"）と照合
const MATCH_SHEETS: Record<string, { firstHalf: string; secondHalf: string }> = {
  "3月8日":  { firstHalf: "0",          secondHalf: "2146914840" },
  "3月15日": { firstHalf: "65946394",   secondHalf: "1289732912" },
}

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

async function fetchHalf(gid: string, offset: number, vP: number[], vI: number[], oP: number[], oI: number[]) {
  const url = `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/export?format=csv&gid=${gid}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return

  const csv = await res.text()
  const rows = csv.split("\n").slice(1).map(parseCSVLine)

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
        if (isOpp) oP[bucket] += pts; else vP[bucket] += pts
      }
      if (/^I [\d.]+/.test(d) || /^Impect [\d.]+/.test(d)) {
        const pts = extractNum(d)
        if (isOpp) oI[bucket] += pts; else vI[bucket] += pts
      }
    }
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  // date パラメータで試合を特定（例: "3月8日"）
  const date = searchParams.get("date") ?? ""

  // dateに対応するシートを探す
  // 完全一致優先、なければ部分一致
  let sheets = MATCH_SHEETS[date]
  if (!sheets) {
    // 部分一致 e.g. "3月8日" が "3月8日" を含む
    for (const [key, val] of Object.entries(MATCH_SHEETS)) {
      if (date.includes(key) || key.includes(date)) {
        sheets = val
        break
      }
    }
  }

  if (!sheets) {
    return NextResponse.json({ labels: [], vonds: { packing: [], impact: [] }, opp: { packing: [], impact: [] }, noData: true })
  }

  try {
    const BUCKETS = 18
    const vPacking = new Array(BUCKETS).fill(0)
    const vImpact  = new Array(BUCKETS).fill(0)
    const oPacking = new Array(BUCKETS).fill(0)
    const oImpact  = new Array(BUCKETS).fill(0)

    await fetchHalf(sheets.firstHalf,  0, vPacking, vImpact, oPacking, oImpact)
    await fetchHalf(sheets.secondHalf, 9, vPacking, vImpact, oPacking, oImpact)

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

    const labels: string[] = Array.from({ length: maxBucket }, (_, i) => {
      const start = i * 5; const end = (i + 1) * 5
      return `${start}-${end}`
    })
    // 末尾EXラベル追加
    const exLabel = maxBucket > 9 ? "90-EX" : "45-EX"
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