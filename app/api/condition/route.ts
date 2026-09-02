// @ts-nocheck
import { NextResponse } from "next/server"

const SHEET_ID = "1Cf9UCMrJDu6upu2n6LObRqfo8HxCCjtaikyHXssyvao"
const WEEK_GID = "510630760"

// 練習日シートは週目標値シートから自動生成—手動管理不要

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

async function fetchCSVByGid(gid: string): Promise<string | null> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`
  try {
    const res = await fetch(url, { cache: "no-store" })
    return res.ok ? await res.text() : null
  } catch { return null }
}

async function fetchCSVByName(sheetName: string): Promise<string | null> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    const text = await res.text()
    // Numberヘッダーがなければ別シートが返ってきた（存在しないシート名の場合）
    const firstLine = text.split("\n")[0] ?? ""
    const headers = parseCSVLine(firstLine).map(h => h.replace(/"/g, '').trim())
    if (!headers.includes("Number")) return null
    return text
  } catch { return null }
}

type PlayerData = {
  number: number; name: string
  distance: number; spdMx: number; seasonSpdMx: number; spdMxRatio: number
  siD: number; hiD: number; sprint: number
  hrMax: number; hrMid: number; accelZ3: number; decelZ3: number
}

type WeekTarget = {
  week: number
  day1: string; day2: string; day3: string; day4: string; game: string; recovery: string
  distance: number; siD: number; hiD: number; sprint: number; accelZ3: number; decelZ3: number
}

async function fetchWeekTargets(): Promise<WeekTarget[]> {
  const csv = await fetchCSVByGid(WEEK_GID)
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
      day1: cols[idx("Day1")] ?? "", day2: cols[idx("Day2")] ?? "",
      day3: cols[idx("Day3")] ?? "", day4: cols[idx("Day4")] ?? "",
      game: cols[idx("GAME")] ?? "", recovery: cols[idx("recovery & TRorGAME")] ?? "",
      distance: parseFloat(cols[idx("\u8ddd\u96e2\u76ee\u6a19")]) || 0,
      siD:      parseFloat(cols[idx("SI\u76ee\u6a19")]) || 0,
      hiD:      parseFloat(cols[idx("HI\u76ee\u6a19")]) || 0,
      sprint:   parseFloat(cols[idx("Sprint\u76ee\u6a19")]) || 0,
      accelZ3:  parseFloat(cols[idx("\u9ad8\u52a0\u901f\u76ee\u6a19")]) || 0,
      decelZ3:  parseFloat(cols[idx("\u9ad8\u6e1b\u901f\u76ee\u6a19")]) || 0,
    }]
  })
}

async function parseSheet(sheetName: string): Promise<PlayerData[]> {
  const csv = await fetchCSVByName(sheetName)
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

function dateToNum(s: string): number { return parseInt(s.replace(/-/g, '')) || 0 }

function findCurrentWeek(weeks: WeekTarget[], dateStr: string): WeekTarget | null {
  const d = dateToNum(dateStr)
  for (const w of weeks) {
    const start = dateToNum(w.day1)
    const end = dateToNum(w.recovery || w.game)
    if (start > 0 && d >= start && d <= end) return w
  }
  const past = weeks.filter(w => dateToNum(w.day1) <= d && dateToNum(w.day1) > 0)
  past.sort((a, b) => dateToNum(b.day1) - dateToNum(a.day1))
  return past[0] ?? null
}

function getDayType(date: string, wt: WeekTarget): "Day1"|"Day2"|"Day3"|"Day4"|"GAME"|"Recovery"|null {
  if (date === wt.day1) return "Day1"
  if (date === wt.day2) return "Day2"
  if (date === wt.day3) return "Day3"
  if (date === wt.day4) return "Day4"
  if (date === wt.game) return "GAME"
  if (date === wt.recovery) return "Recovery"
  return null
}

function acwrZone(v: number | null): "sweet"|"caution"|"danger"|"low"|"none" {
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

  // 週目標値を先に取得して日付リストを自動生成
  const weekTargets = await fetchWeekTargets()

  // 週目標値シートに存在する全日付を抽出（重複除去・ソート済み）
  const allDatesSet = new Set<string>()
  for (const wt of weekTargets) {
    for (const d of [wt.day1, wt.day2, wt.day3, wt.day4, wt.game, wt.recovery]) {
      if (d && /^\d{8}$/.test(d)) allDatesSet.add(d)
    }
  }
  const dateSheets = Array.from(allDatesSet).sort()

  // 全日程のCSVを取得（10件ずつ並列レート制限）
  const CHUNK = 10
  const sheetDataArr: PlayerData[][] = []
  for (let i = 0; i < dateSheets.length; i += CHUNK) {
    const chunk = dateSheets.slice(i, i + CHUNK)
    const results = await Promise.all(chunk.map(s => parseSheet(s)))
    sheetDataArr.push(...results)
  }

  const allData = dateSheets
    .map((s, i) => ({ date: s, players: sheetDataArr[i] }))
    .filter(d => d.players.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date))

  const dates = allData.map(d => d.date)
  const latestDate = allData[allData.length - 1]?.date ?? ""
  const currentWeek = findCurrentWeek(weekTargets, latestDate)

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
          ex.spdMx = Math.max(ex.spdMx, p.spdMx)
          ex.spdMxRatio = Math.max(ex.spdMxRatio, p.spdMxRatio)
          ex.days += 1
        }
      }
    }
    return map
  }

  function calcAcwr(name: string) {
    const history = allData.map(d => d.players.find(x => x.name === name)?.distance ?? 0)
    const i = history.length - 1
    const s7 = Math.max(0, i - 6); const s28 = Math.max(0, i - 27)
    const acute = history.slice(s7).reduce((s,v) => s+v, 0) / Math.max(1, history.slice(s7).length)
    const chronic = history.slice(s28).reduce((s,v) => s+v, 0) / Math.max(1, history.slice(s28).length)
    return chronic > 0 ? +(acute / chronic).toFixed(2) : null
  }

  if (action === "latest") {
    const requestedWeek = searchParams.get("week") ? parseInt(searchParams.get("week")) : null
    const targetWeek = requestedWeek
      ? weekTargets.find(w => w.week === requestedWeek) ?? currentWeek
      : currentWeek
    const targetSheets = targetWeek
      ? allData.filter(d => {
          const dt = getDayType(d.date, targetWeek)
          return dt === "Day1" || dt === "Day2" || dt === "Day3" || dt === "Day4"
        })
      : allData.slice(-4)

    const aggMap = aggregatePlayers(targetSheets)
    const pastWeekTargets = weekTargets.filter(w => w.week !== (targetWeek?.week ?? -1))
    const metrics = ["distance","siD","hiD","sprint","accelZ3","decelZ3"]
    const teamPastAvg: Record<string, number> = {}
    // チーム累計平均: 各週の全選手平均累計値の平均
    for (const m of metrics) {
      const weekAvgs: number[] = []
      for (const wt of pastWeekTargets) {
        const sheets = allData.filter(d => {
          const dt = getDayType(d.date, wt)
          return dt === "Day1" || dt === "Day2" || dt === "Day3" || dt === "Day4"
        })
        if (sheets.length === 0) continue
        // 各選手の週累計を計算して平均
        const playerNames = [...new Set(sheets.flatMap(s => s.players.map(p => p.name)))]
        const playerWeekTotals = playerNames.map(name => {
          return sheets.reduce((sum, sheet) => {
            const player = sheet.players.find(x => x.name === name)
            return sum + (player ? (player[m] || 0) : 0)
          }, 0)
        }).filter(v => v > 0)
        if (playerWeekTotals.length > 0) {
          weekAvgs.push(playerWeekTotals.reduce((s,v) => s+v, 0) / playerWeekTotals.length)
        }
      }
      teamPastAvg[m] = weekAvgs.length > 0 ? Math.round(weekAvgs.reduce((s,v) => s+v, 0) / weekAvgs.length) : 0
    }

    const players = Array.from(aggMap.values()).map(p => {
      const acwr = calcAcwr(p.name)
      // 週累計平均: 各週のDay1-4の合計値を計算し、その週平均
      const playerPastAvg: Record<string, number> = {}
      for (const m of metrics) {
        // 各週の累計値を集める
        const weekTotals: number[] = []
        for (const wt of pastWeekTargets) {
          const wtSheets = allData.filter(d => {
            const dt = getDayType(d.date, wt)
            return dt === "Day1" || dt === "Day2" || dt === "Day3" || dt === "Day4"
          })
          // その週に1日以上参加している場合のみ累計
          const days = wtSheets.filter(sheet => sheet.players.find(x => x.name === p.name))
          if (days.length > 0) {
            const weekTotal = days.reduce((sum, sheet) => {
              const player = sheet.players.find(x => x.name === p.name)
              return sum + (player ? (player[m] || 0) : 0)
            }, 0)
            weekTotals.push(weekTotal)
          }
        }
        playerPastAvg[m] = weekTotals.length > 0 ? Math.round(weekTotals.reduce((s,v) => s+v, 0) / weekTotals.length) : 0
      }
      return { ...p, acwr, zone: acwrZone(acwr), playerPastAvg }
    })

    return NextResponse.json({
      dates, date: latestDate, weekDays: targetSheets.length,
      currentWeek: targetWeek,
      allWeeks: weekTargets.sort((a,b) => b.week - a.week).map(w => ({ week: w.week, day1: w.day1, game: w.game })),
      teamPastAvg, players
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

  if (action === "player" && playerName) {
    const weeklyData: { week: WeekTarget; days: { date: string; dayType: string; data: PlayerData | null }[] }[] = []
    for (const wt of weekTargets.sort((a,b) => a.week - b.week)) {
      const dayDates = [wt.day1, wt.day2, wt.day3, wt.day4, wt.game, wt.recovery].filter(Boolean)
      const days = dayDates.map(date => ({
        date, dayType: getDayType(date, wt) ?? "Other",
        data: allData.find(d => d.date === date)?.players.find(p => p.name === playerName) ?? null
      }))
      if (days.some(d => d.data !== null)) weeklyData.push({ week: wt, days })
    }
    const pastWeeks = weeklyData.filter(w => w.week.week !== (currentWeek?.week ?? -1))
    const metrics = ["distance","siD","hiD","sprint","accelZ3","decelZ3"]
    const pastAvg: Record<string, number> = {}
    // 週累計平均: 各週のDay1-4の合計値を計算し、その週平均
    for (const m of metrics) {
      const weekTotals = pastWeeks.map(w => {
        const days = w.days.filter(d => ["Day1","Day2","Day3","Day4"].includes(d.dayType))
        if (days.length === 0) return null
        const total = days.reduce((s, d) => s + (d.data?.[m] ?? 0), 0)
        return total > 0 ? total : null
      }).filter(v => v !== null)
      pastAvg[m] = weekTotals.length > 0 ? Math.round(weekTotals.reduce((s,v) => s+v, 0) / weekTotals.length) : 0
    }
    const currentWeekData = weeklyData.find(w => w.week.week === currentWeek?.week)
    return NextResponse.json({ playerName, currentWeek, currentWeekDays: currentWeekData?.days ?? [], weeklyData, pastAvg, dates })
  }

  return NextResponse.json({ dates, allData, weekTargets })
}
