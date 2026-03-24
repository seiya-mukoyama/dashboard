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

// APT文字列 ":HH:MM:SS" を秒数に変換
function aptToSec(s: string): number {
  if (!s) return 0
  const p = s.replace(/^:/, '').split(':')
  if (p.length === 3) return (+p[0]) * 3600 + (+p[1]) * 60 + (+p[2])
  if (p.length === 2) return (+p[0]) * 60 + (+p[1])
  return 0
}

// 秒数を "MM:SS" 形式に変換
function secToMmSs(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = String(Math.floor(sec % 60)).padStart(2, '0')
  return m + ':' + s
}

export async function GET(request: Request) {
  const baseUrl = new URL(request.url).origin

  try {
    // 1) リーグ順位表から現在の実績（勝ち点・得点・失点）を取得
    const standingsRes = await fetch(baseUrl + '/api/league-standings', { next: { revalidate: 3600 } })
    const standingsData = await standingsRes.json()
    const myTeam = (standingsData.standings ?? []).find((s: { isOurTeam: boolean }) => s.isOurTeam)
    const currentPoints = myTeam?.points ?? null
    const currentGf = myTeam?.gf ?? null
    const currentGa = myTeam?.ga ?? null
    const matchCount = myTeam?.played ?? 0

    // 2) 公式戦スタッツから平均APTを計算
    const statsRes = await fetch(baseUrl + '/api/stats?type=official', { next: { revalidate: 3600 } })
    const statsData = await statsRes.json()
    const officialMatches = (statsData.matches ?? []) as Array<{ halves?: Array<{ half: string; apt?: string }> }>
    
    // 各試合の合計ハーフのaptを集めて平均計算
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

    // 3) スプレッドシートから目標値と観客動員数実績を取得
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${GOALS_SHEET_ID}/export?format=csv&gid=${GOALS_GID}`
    const sheetRes = await fetch(sheetUrl, { next: { revalidate: 3600 } })
    const sheetText = await sheetRes.text()
    const rows = parseCSV(sheetText)
    if (rows.length < 2) return NextResponse.json({ goals: [] })

    // 目標値を行名で取得
    const getTarget = (name: string) => rows.find(r => r[0]?.trim() === name)?.[1]?.trim() ?? null

    // 観客動員数の最新実績（スプレッドシートから）
    const attendanceRow = rows.find(r => r[0]?.trim() === '平均観客動員数')
    const attendanceActuals = (attendanceRow?.slice(2) ?? []).filter(v => v.trim())
    const latestAttendance = attendanceActuals.length > 0 ? attendanceActuals[attendanceActuals.length - 1].trim() : null

    // 目標値
    const tPoints = getTarget('勝ち点')
    const tGf = getTarget('得点')
    const tGa = getTarget('失点')
    const tApt = getTarget('平均APT')
    const tAttendance = getTarget('平均観客動員数')

    // ステータス判定
    const numStatus = (actual: number | null, target: string | null, lowerIsBetter = false) => {
      if (actual === null || !target) return 'neutral' as const
      const t = parseFloat(target.replace(',', ''))
      if (isNaN(t)) return 'neutral' as const
      if (lowerIsBetter) return actual <= t ? 'good' as const : 'bad' as const
      return actual >= t ? 'good' as const : 'bad' as const
    }

    const aptStatus = (() => {
      if (!avgAptStr || !tApt) return 'neutral' as const
      return aptToSec(avgAptStr) >= aptToSec(tApt) ? 'good' as const : 'bad' as const
    })()

    const attendanceStatus = (() => {
      if (!latestAttendance || !tAttendance) return 'neutral' as const
      const l = parseFloat(latestAttendance.replace(',', ''))
      const t = parseFloat(tAttendance.replace(',', ''))
      return (!isNaN(l) && !isNaN(t)) ? (l >= t ? 'good' as const : 'bad' as const) : 'neutral' as const
    })()

    const goals = [
      {
        name: '勝ち点',
        target: tPoints,
        latest: currentPoints !== null ? String(currentPoints) : null,
        matchCount,
        status: numStatus(currentPoints, tPoints),
      },
      {
        name: '得点',
        target: tGf,
        latest: currentGf !== null ? String(currentGf) : null,
        matchCount,
        status: numStatus(currentGf, tGf),
      },
      {
        name: '失点',
        target: tGa,
        latest: currentGa !== null ? String(currentGa) : null,
        matchCount,
        status: numStatus(currentGa, tGa, true),
      },
      {
        name: '平均APT',
        target: tApt,
        latest: avgAptStr,
        matchCount: aptValues.length,
        status: aptStatus,
      },
      {
        name: '平均観客動員数',
        target: tAttendance,
        latest: latestAttendance,
        matchCount: attendanceActuals.length,
        status: attendanceStatus,
      },
    ]

    return NextResponse.json({ goals, totalMatches: matchCount })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
