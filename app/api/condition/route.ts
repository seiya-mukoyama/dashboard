import { NextResponse } from "next/server"

const SHEET_ID = "1Cf9UCMrJDu6upu2n6LObRqfo8HxCCjtaikyHXssyvao"

// 練習日シート一覧（新しい練習日を追加したらここにgidを追尾）
// gidはGoogleスプレッドシートのURLの#gid=XXXXXXXXXから確認
const DATE_SHEETS: { name: string; gid: string }[] = [
  { name: "20260828", gid: "1011047146" },
]

function parseCSVLine(line: string): string[] {
  const cols: string[] = []
  let cur = ""
  let inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = "" }
    else { cur += ch }
  }
  cols.push(cur.trim())
  return cols
}

async function fetchSheetCSV(gid: string): Promise<string | null> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`
  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    return await res.text()
  } catch { return null }
}

type PlayerData = {
  number: number
  name: string
  distance: number
  spdMx: number
  seasonSpdMx: number
  spdMxRatio: number
  siD: number
  hiD: number
  sprint: number
  hrMax: number
  hrMid: number
  accelZ3: number
  decelZ3: number
}

async function parseSheet(gid: string): Promise<PlayerData[]> {
  const csv = await fetchSheetCSV(gid)
  if (!csv) return []
  const lines = csv.split("\n").filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim())
  const idx = (key: string) => headers.indexOf(key)
  return lines.slice(1).flatMap(line => {
    const cols = parseCSVLine(line).map(c => c.replace(/"/g, '').trim())
    const num = parseInt(cols[idx("Number")])
    if (!num || isNaN(num)) return []
    return [{
      number: num,
      name: cols[idx("Name")] ?? "",
      distance: parseFloat(cols[idx("Distance")]) || 0,
      spdMx: parseFloat(cols[idx("SPD MX")]) || 0,
      seasonSpdMx: parseFloat(cols[idx("SEASON SPD MX")]) || 0,
      spdMxRatio: parseFloat(cols[idx("SPD MX RATIO")]) || 0,
      siD: parseFloat(cols[idx("SI_D")]) || 0,
      hiD: parseFloat(cols[idx("HI_D")]) || 0,
      sprint: parseFloat(cols[idx("Sprint")]) || 0,
      hrMax: parseFloat(cols[idx("HR MAX")]) || 0,
      hrMid: parseFloat(cols[idx("HR MID")]) || 0,
      accelZ3: parseFloat(cols[idx("Accel_Z3")]) || 0,
      decelZ3: parseFloat(cols[idx("Decel_Z3")]) || 0,
    }]
  })
}

function acwrZone(acwr: number | null): "sweet" | "caution" | "danger" | "low" | "none" {
  if (acwr === null) return "none"
  if (acwr >= 1.5) return "danger"
  if (acwr >= 1.3) return "caution"
  if (acwr >= 0.8) return "sweet"
  return "low"
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action") ?? "latest"

  // 全日付データを並列取得
  const allData = (await Promise.all(
    DATE_SHEETS.map(async ({ name, gid }) => {
      const players = await parseSheet(gid)
      return { date: name, players }
    })
  )).filter(d => d.players.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date))

  const dates = allData.map(d => d.date)
  const latest = allData[allData.length - 1] ?? null

  // 最新日の選手一覧（信号機カラー付き）
  if (action === "latest" && latest) {
    // ACWR計算（Distanceベース）
    const playersWithAcwr = latest.players.map(p => {
      const history = allData.map(d => d.players.find(x => x.name === p.name)?.distance ?? 0)
      const lastIdx = history.length - 1
      const start7 = Math.max(0, lastIdx - 6)
      const start28 = Math.max(0, lastIdx - 27)
      const acute = history.slice(start7).reduce((s, v) => s + v, 0) / Math.max(1, history.slice(start7).length)
      const chronic = history.slice(start28).reduce((s, v) => s + v, 0) / Math.max(1, history.slice(start28).length)
      const acwr = chronic > 0 ? +(acute / chronic).toFixed(2) : null
      return { ...p, acute: +acute.toFixed(0), chronic: +chronic.toFixed(0), acwr, zone: acwrZone(acwr) }
    })
    return NextResponse.json({ dates, date: latest.date, players: playersWithAcwr })
  }

  // ACWR推移（選手別）
  if (action === "acwr") {
    const seriesMap: Record<string, { date: string; distance: number; acwr: number | null; zone: string }[]> = {}
    for (const d of allData) {
      for (const p of d.players) {
        if (!seriesMap[p.name]) seriesMap[p.name] = []
        seriesMap[p.name].push({ date: d.date, distance: p.distance, acwr: null, zone: "none" })
      }
    }
    // ACWRを計算
    for (const name of Object.keys(seriesMap)) {
      const series = seriesMap[name]
      series.forEach((entry, i) => {
        const start7 = Math.max(0, i - 6)
        const start28 = Math.max(0, i - 27)
        const acute = series.slice(start7, i+1).reduce((s, x) => s + x.distance, 0) / Math.max(1, i - start7 + 1)
        const chronic = series.slice(start28, i+1).reduce((s, x) => s + x.distance, 0) / Math.max(1, i - start28 + 1)
        entry.acwr = chronic > 0 ? +(acute / chronic).toFixed(2) : null
        entry.zone = acwrZone(entry.acwr)
      })
    }
    return NextResponse.json({ dates, series: seriesMap })
  }

  return NextResponse.json({ dates, allData })
}
