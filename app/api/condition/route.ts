import { NextResponse } from "next/server"

const SHEET_ID = "1Cf9UCMrJDu6upu2n6LObRqfo8HxCCjtaikyHXssyvao"
const WEEK_GID = "510630760"

// 練習日シート一覧 - 新しい練習日を追加したらgidを追尾
const DATE_SHEETS: { name: string; gid: string }[] = [
  { name: "20260825", gid: "1688750764" },
  { name: "20260826", gid: "906373835" },
  { name: "20260827", gid: "915779806" },
  { name: "20260828", gid: "1011047146" },
  { name: "20260901", gid: "1311272156" },
]

function parseCSVLine(line: string): string[] {
  const cols: string[] = []
  let cur = "", inQ = false
  for (const ch of line) {
    if (ch === '"') inQ = !inQ
    else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = "" }
    else cur += ch
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
      number: num, name: cols[idx("Name")] ?? "",
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
      week, trStart: cols[idx("TR\u958b\u59cb\u65e5")] ?? "", matchDate: cols[idx("\u8a66\u5408\u65e5")] ?? "",
      distance: parseFloat(cols[idx("\u8ddd\u96e2\u76ee\u6a19")]) || 0,
      siD: parseFloat(cols[idx("SI\u76ee\u6a19")]) || 0,
      hiD: parseFloat(cols[idx("HI\u76ee\u6a19")]) || 0,
      sprint: parseFloat(cols[idx("Sprint\u76ee\u6a19")]) || 0,
      accelZ3: parseFloat(cols[idx("\u9ad8\u52a0\u901f\u76ee\u6a19")]) || 0,
      decelZ3: parseFloat(cols[idx("\u9ad8\u6e1b\u901f\u76ee\u6a19")]) || 0,
    }]
  })
}

function dateToNum(s: string): number { return parseInt(s.replace(/-/g, '')) }

function findCurrentWeek(weeks: WeekTarget[], dateStr: string): WeekTarget | null {
  const d = dateToNum(dateStr)
  for (const w of weeks) {
    if (d >= dateToNum(w.trStart) && d < dateToNum(w.matchDate)) return w
  }
  const past = weeks.filter(w => dateToNum(w.matchDate) <= d)
  return past[past.length - 1] ?? weeks[0] ?? null
}

function acwrZone(v: number | null): "sweet" | "caution" | "danger" | "low" | "none" {
  if (v === null) return "none"
  if (v >= 1.5) return "danger"
  if (v >= 1.3) return "caution"
  if (v >= 0.8) return "sweet"
  return "low"
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action") ?? "latest"
  const playerName = searchParams.get("name") ?? ""

  const [weekTargets, ...sheetDataArr] = await Promise.all([
    fetchWeekTargets(),
    ...DATE_SHEETS.map(s => parseSheet(s.gid))
  ])

  // 全日程: date が分かる形で配列化
  const allData = DATE_SHEETS.map((s, i) => ({ date: s.name, players: sheetDataArr[i] }))
    .filter(d => d.players.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date))

  const dates = allData.map(d => d.date)
  const latestDate = allData[allData.length - 1]?.date ?? ""
  const currentWeek = findCurrentWeek(weekTargets, latestDate)

  const weekSheets = currentWeek
    ? allData.filter(d => {
        const n = dateToNum(d.date)
        return n >= dateToNum(currentWeek.trStart) && n < dateToNum(currentWeek.matchDate)
      })
    : allData

  // 選手別週累計集計
  function aggregatePlayers(sheets: typeof allData) {
    const map = new Map<string, PlayerData & { days: number }>()
    for (const sheet of sheets) {
      for (const p of sheet.players) {
        if (!p.name) continue
        const ex = map.get(p.name)
        if (!ex) { map.set(p.name, { ...p, days: 1 }) }
        else {
          ex.distance += p.distance; ex.siD += p.siD; ex.hiD += p.hiD
          ex.sprint += p.sprint; ex.accelZ3 += p.accelZ3; ex.decelZ3 += p.decelZ3
          ex.hrMax = Math.max(ex.hrMax, p.hrMax)
          ex.hrMid = Math.round((ex.hrMid * ex.days + p.hrMid) / (ex.days + 1))
          ex.spdMx = Math.max(ex.spdMx, p.spdMx); ex.spdMxRatio = Math.max(ex.spdMxRatio, p.spdMxRatio)
          ex.days += 1
        }
      }
    }
    return map
  }

  // ACWR計算
  function calcAcwr(name: string) {
    const history = allData.map(d => d.players.find(x => x.name === name)?.distance ?? 0)
    const i = history.length - 1
    const s7 = Math.max(0, i - 6); const s28 = Math.max(0, i - 27)
    const acute = history.slice(s7).reduce((s,v) => s+v, 0) / Math.max(1, history.slice(s7).length)
    const chronic = history.slice(s28).reduce((s,v) => s+v, 0) / Math.max(1, history.slice(s28).length)
    return chronic > 0 ? +(acute / chronic).toFixed(2) : null
  }

  // ===== latest: 選手一覧 =====
  if (action === "latest") {
    const aggMap = aggregatePlayers(weekSheets)
    const players = Array.from(aggMap.values()).map(p => {
      const acwr = calcAcwr(p.name)
      return { ...p, acute: 0, chronic: 0, acwr, zone: acwrZone(acwr) }
    })
    return NextResponse.json({ dates, date: latestDate, weekDays: weekSheets.length, currentWeek, players })
  }

  // ===== acwr: 全選手 ACWR推移 =====
  if (action === "acwr") {
    const seriesMap: Record<string, { date: string; distance: number; acwr: number | null; zone: string }[]> = {}
    for (const d of allData) {
      for (const p of d.players) {
        if (!seriesMap[p.name]) seriesMap[p.name] = []
        seriesMap[p.name].push({ date: d.date, distance: p.distance, acwr: null, zone: "none" })
      }
    }
    for (const name of Object.keys(seriesMap)) {
      seriesMap[name].forEach((entry, i) => {
        const s7 = Math.max(0, i-6); const s28 = Math.max(0, i-27)
        const ser = seriesMap[name]
        const acute = ser.slice(s7, i+1).reduce((s,x) => s+x.distance,0) / Math.max(1, i-s7+1)
        const chronic = ser.slice(s28, i+1).reduce((s,x) => s+x.distance,0) / Math.max(1, i-s28+1)
        entry.acwr = chronic > 0 ? +(acute/chronic).toFixed(2) : null
        entry.zone = acwrZone(entry.acwr)
      })
    }
    return NextResponse.json({ dates, series: seriesMap })
  }

  // ===== player: 選手別詳細 (Day別/週別/過去平均) =====
  if (action === "player" && playerName) {
    // 以前のWeekのデータを週別に集約
    const weeklyData: {
      week: WeekTarget; days: { date: string; dayNum: number; data: PlayerData | null }[]
    }[] = []

    for (const wt of weekTargets) {
      const wtStart = dateToNum(wt.trStart)
      const wtEnd = dateToNum(wt.matchDate)
      const wtSheets = allData.filter(d => {
        const n = dateToNum(d.date)
        return n >= wtStart && n < wtEnd
      })
      if (wtSheets.length === 0) continue
      const days = wtSheets.map((s, i) => ({
        date: s.date,
        dayNum: i + 1,
        data: s.players.find(p => p.name === playerName) ?? null
      }))
      weeklyData.push({ week: wt, days })
    }

    // 週平均（現在週以外の週の1日当たり平均）
    const pastWeeks = weeklyData.filter(w => w.week.week !== (currentWeek?.week ?? -1))
    const metrics = ["distance", "siD", "hiD", "sprint", "accelZ3", "decelZ3"] as const
    const pastAvg: Record<string, number> = {}
    for (const m of metrics) {
      const vals = pastWeeks.flatMap(w => w.days.map(d => d.data?.[m] ?? null)).filter((v): v is number => v !== null)
      pastAvg[m] = vals.length > 0 ? Math.round(vals.reduce((s,v) => s+v, 0) / vals.length) : 0
    }

    // Day別詳細: 現在週のDay1/2/3/4データ
    const currentWeekData = weeklyData.find(w => w.week.week === currentWeek?.week)

    return NextResponse.json({
      playerName,
      currentWeek,
      currentWeekDays: currentWeekData?.days ?? [],
      weeklyData,
      pastAvg,
      dates,
    })
  }

  return NextResponse.json({ dates, allData, weekTargets })
}
