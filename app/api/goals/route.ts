import { NextResponse } from 'next/server'

const GOALS_SHEET_ID = '16A_MPoTdXx-gN8ty5yv9XXjfa3ts2Wjs0CMMjl5cM-o'
const GOALS_GID = '0'

function parseCSV(text: string): string[][] {
  return text.split('\n').map(line => {
    const cols: string[] = []
    let cur = ''; let inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
      else { cur += ch }
    }
    cols.push(cur.trim())
    return cols
  })
}

function aptToSec(s: string): number {
  if (!s) return 0
  const p = s.replace(/^:/, '').split(':')
  if (p.length === 3) return (+p[0]) * 3600 + (+p[1]) * 60 + (+p[2])
  if (p.length === 2) return (+p[0]) * 60 + (+p[1])
  return 0
}

function secToMmSs(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = String(Math.floor(sec % 60)).padStart(2, '0')
  return m + ':' + s
}

export async function GET(request: Request) {
  const baseUrl = new URL(request.url).origin

  try {
    // 1) リーグ順位表から実績
    const standingsRes = await fetch(baseUrl + '/api/league-standings', { cache: 'no-store' })
    const standingsData = await standingsRes.json()
    const myTeam = (standingsData.standings ?? []).find((s: { isOurTeam: boolean }) => s.isOurTeam)
    const currentPoints = myTeam?.points ?? null
    const currentGf = myTeam?.gf ?? null
    const currentGa = myTeam?.ga ?? null
    const matchCount = myTeam?.played ?? 0

    // 2) 公式戦スタッツから平均APT
    const statsRes = await fetch(baseUrl + '/api/stats?type=official', { cache: 'no-store' })
    const statsData = await statsRes.json()
    const officialMatches = (statsData.matches ?? []) as Array<{ halves?: Array<{ half: string; apt?: string }> }>
    const aptValues: number[] = []
    for (const m of officialMatches) {
      const totalHalf = m.halves?.find(h => h.half === '合計')
      if (totalHalf?.apt) {
        const sec = aptToSec(totalHalf.apt)
        if (sec > 0) aptValues.push(sec)
      }
    }
    const avgAptStr = aptValues.length > 0
      ? secToMmSs(Math.round(aptValues.reduce((a, b) => a + b, 0) / aptValues.length))
      : null

    // 3) スプレッドシートから目標値・節ごとペース・観客動員数実績
    // 構造: A=項目名, B=シーズン目標, C=1節ペース, D=2節ペース...（累積目標）
    // 観客動員数行は: B=シーズン目標, C以降=実数入場者数（ホーム戦のみ記載）
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${GOALS_SHEET_ID}/export?format=csv&gid=${GOALS_GID}`
    const sheetRes = await fetch(sheetUrl, { cache: 'no-store' })
    const sheetText = await sheetRes.text()
    const rows = parseCSV(sheetText)
    if (rows.length < 2) return NextResponse.json({ goals: [] })

    const getRow = (name: string) => rows.find(r => r[0]?.trim() === name)
    const getSeasonTarget = (name: string) => getRow(name)?.[1]?.trim() ?? null

    // 現時点ペース目標: matchCount節目のC列以降（C=1節=index2, D=2節=index3...）
    const paceColIdx = matchCount > 0 ? matchCount + 1 : 1
    const getPaceTarget = (name: string) => {
      const row = getRow(name)
      if (!row) return null
      return row[paceColIdx]?.trim() || getSeasonTarget(name)
    }

    // 観客動員数: 実数の平均
    const attendanceRow = getRow('平均観客動員数')
    const attendanceActuals = (attendanceRow?.slice(2) ?? []).map(v => v.trim()).filter(v => v !== '')
    const attendanceAvg = attendanceActuals.length > 0
      ? Math.round(attendanceActuals.reduce((sum, v) => sum + (parseFloat(v.replace(',', '')) || 0), 0) / attendanceActuals.length)
      : 0
    const attendanceAvgStr = String(attendanceAvg)

    // ステータス判定
    const numStatus = (actual: number | null, pace: string | null, lowerIsBetter = false) => {
      if (actual === null || !pace) return 'neutral' as const
      const t = parseFloat(pace.replace(',', ''))
      if (isNaN(t)) return 'neutral' as const
      return lowerIsBetter ? (actual <= t ? 'good' as const : 'bad' as const) : (actual >= t ? 'good' as const : 'bad' as const)
    }

    const pacePoints = getPaceTarget('勝ち点')
    const paceGf = getPaceTarget('得点')
    const paceGa = getPaceTarget('失点')
    const seasonApt = getSeasonTarget('平均APT')
    const seasonAttendance = getSeasonTarget('平均観客動員数')

    const aptStatus: 'good' | 'bad' | 'neutral' = (!avgAptStr || !seasonApt) ? 'neutral' : (aptToSec(avgAptStr) >= aptToSec(seasonApt) ? 'good' : 'bad')
    const attendanceStatus: 'good' | 'bad' | 'neutral' = (!seasonAttendance || attendanceActuals.length === 0) ? 'neutral' : (attendanceAvg >= (parseFloat(seasonAttendance.replace(',','')) || 0) ? 'good' : 'bad')

    const goals = [
      { name: '勝ち点', target: pacePoints, seasonTarget: getSeasonTarget('勝ち点'), latest: currentPoints !== null ? String(currentPoints) : null, matchCount, status: numStatus(currentPoints, pacePoints) },
      { name: '得点', target: paceGf, seasonTarget: getSeasonTarget('得点'), latest: currentGf !== null ? String(currentGf) : null, matchCount, status: numStatus(currentGf, paceGf) },
      { name: '失点', target: paceGa, seasonTarget: getSeasonTarget('失点'), latest: currentGa !== null ? String(currentGa) : null, matchCount, status: numStatus(currentGa, paceGa, true) },
      { name: '平均APT', target: seasonApt, seasonTarget: seasonApt, latest: avgAptStr, matchCount: aptValues.length, status: aptStatus },
      { name: '平均観客動員数', target: seasonAttendance, seasonTarget: seasonAttendance, latest: attendanceAvgStr, matchCount: attendanceActuals.length, status: attendanceStatus },
    ]

    return NextResponse.json({ goals, totalMatches: matchCount })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
