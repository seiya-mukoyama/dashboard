import { NextResponse } from "next/server"

const SHEET_ID = "1Cf9UCMrJDu6upu2n6LObRqfo8HxCCjtaikyHXssyvao"

// 練習日シート一覧（新しい練習日を追加したらここにgidを追尾）
const DATE_SHEETS: { name: string; gid: string }[] = [
  { name: "20260825", gid: "1688750764" },
  { name: "20260826", gid: "906373835" },
  { name: "20260827", gid: "915779806" },
  { name: "20260828", gid: "1011047146" },
]

// 週目標値シート
const WEEK_GID = "510630760"

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

async function fetchCSV(gid: string): Promise<string | null> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`
  try {
    const res = await fetch(url, { cache: "no-store" })
    return res.ok ? await res.text() : null
  } catch { return null }
}

type PlayerData = {
  number: number; name: string
  distance: number; spdMx: number; seasonSpdMx: number; spdMxRatio: number
  siD: number; hiD: number; sprint: number
  hrMax: number; hrMid: number; accelZ3: number; decelZ3: number
}

type WeekTarget = {
  week: number; trStart: string; matchDate: string
  distance: number; siD: number; hiD: number; sprint: number; accelZ3: number; decelZ3: number
}

async function parseSheet(gid: string): Promise<PlayerData[]> {
  const csv = await fetchCSV(gid)
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

async function fetchWeekTargets(): Promise<WeekTarget[]> {
  const csv = await fetchCSV(WEEK_GID)
  if (!csv) return []
  const lines = csv.split("\n").filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim())
  const idx = (key: string) => headers.indexOf(key)
  return lines.slice(1).flatMap(line => {
    const cols = parseCSVLine(line).map(c => c.replace(/"/g, '').trim())
    const week = parseInt(cols[idx("Week")])
    if (!week || isNaN(week)) return []
    return [{
      week,
      trStart: cols[idx("TR開始日")] ?? "",
      matchDate: cols[idx("試合日")] ?? "",
      distance: parseFloat(cols[idx("距離目標")]) || 0,
      siD: parseFloat(cols[idx("SI目標")]) || 0,
      hiD: parseFloat(cols[idx("HI目標")]) || 0,
      sprint: parseFloat(cols[idx("Sprint目標")]) || 0,
      accelZ3: parseFloat(cols[idx("高加速目標")]) || 0,
      decelZ3: parseFloat(cols[idx("高減速目標")]) || 0,
    }]
  })
}

// 日付文字列からYYYYMMDD形式の整数を返す
function dateToNum(s: string): number {
  return parseInt(s.replace(/-/g, ''))
}

// 現在日がどのWeekに属するか判定
function findCurrentWeek(weeks: WeekTarget[], todayStr: string): WeekTarget | null {
  const today = dateToNum(todayStr)
  // TR開始日 ≤ today ≤ 試合日 の週を返す
  for (const w of weeks) {
    const start = dateToNum(w.trStart)
    const match = dateToNum(w.matchDate)
    if (today >= start && today <= match) return w
  }
  // 該当週なければ最近の週を返す
  const past = weeks.filter(w => dateToNum(w.matchDate) < today)
  if (past.length > 0) return past[past.length - 1]
  return weeks[0] ?? null
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

  // 週目標値を取得
  const weekTargets = await fetchWeekTargets()

  // 全練習日データを並列取得
  const allData = (await Promise.all(
    DATE_SHEETS.map(async ({ name, gid }) => {
      const players = await parseSheet(gid)
      return { date: name, players }
    })
  )).filter(d => d.players.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date))

  const dates = allData.map(d => d.date)

  // 現在アクティブなWeekを判定
  const latestDate = allData[allData.length - 1]?.date ?? ""
  const currentWeek = findCurrentWeek(weekTargets, latestDate)

  // 今週のWeekにTR日が何日分含まれるかかカウント
  const weekSheets = currentWeek
    ? allData.filter(d => {
        const n = dateToNum(d.date)
        return n >= dateToNum(currentWeek.trStart) && n < dateToNum(currentWeek.matchDate)
      })
    : allData

  // 選手ごとの週累計を計算
  function aggregatePlayers(sheets: typeof allData): Map<string, PlayerData & { days: number }> {
    const map = new Map<string, PlayerData & { days: number }>()
    for (const sheet of sheets) {
      for (const p of sheet.players) {
        if (!p.name) continue
        const ex = map.get(p.name)
        if (!ex) {
          map.set(p.name, { ...p, days: 1 })
        } else {
          ex.distance += p.distance
          ex.siD += p.siD
          ex.hiD += p.hiD
          ex.sprint += p.sprint
          ex.accelZ3 += p.accelZ3
          ex.decelZ3 += p.decelZ3
          ex.hrMax = Math.max(ex.hrMax, p.hrMax)
          ex.hrMid = Math.round((ex.hrMid * ex.days + p.hrMid) / (ex.days + 1))
          ex.spdMx = Math.max(ex.spdMx, p.spdMx)
          ex.spdMxRatio = Math.max(ex.spdMxRatio, p.spdMxRatio)
          ex.days += 1
        }
      }
    }
    return map
  }

  if (action === "latest") {
    const aggMap = aggregatePlayers(weekSheets)
    const allPlayers = aggregatePlayers(allData)

    const players = Array.from(aggMap.values()).map(p => {
      // ACWR計算（全日程データを使用）
      const history = allData.map(d => d.players.find(x => x.name === p.name)?.distance ?? 0)
      const lastIdx = history.length - 1
      const start7 = Math.max(0, lastIdx - 6)
      const start28 = Math.max(0, lastIdx - 27)
      const acute = history.slice(start7).reduce((s, v) => s + v, 0) / Math.max(1, history.slice(start7).length)
      const chronic = history.slice(start28).reduce((s, v) => s + v, 0) / Math.max(1, history.slice(start28).length)
      const acwr = chronic > 0 ? +(acute / chronic).toFixed(2) : null
      return { ...p, acute: +acute.toFixed(0), chronic: +chronic.toFixed(0), acwr, zone: acwrZone(acwr) }
    })

    return NextResponse.json({
      dates,
      date: latestDate,
      weekDays: weekSheets.length,
      currentWeek: currentWeek ?? null,
      players,
    })
  }

  if (action === "acwr") {
    const seriesMap: Record<string, { date: string; distance: number; acwr: number | null; zone: string }[]> = {}
    for (const d of allData) {
      for (const p of d.players) {
        if (!seriesMap[p.name]) seriesMap[p.name] = []
        seriesMap[p.name].push({ date: d.date, distance: p.distance, acwr: null, zone: "none" })
      }
    }
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

  return NextResponse.json({ dates, allData, weekTargets })
}
