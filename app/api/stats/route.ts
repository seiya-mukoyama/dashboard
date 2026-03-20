import { NextResponse } from "next/server"

const STATS_SHEET_ID = "1Y_im99vGkmEc-6GgwXqXQC2Lz6yriRGqy-xV5wlm48g"
const STATS_GID = "1979610514"

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

function toNum(s: string | undefined): number {
  if (!s) return 0
  const n = parseFloat(s.replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

export async function GET() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${STATS_SHEET_ID}/export?format=csv&gid=${STATS_GID}`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return NextResponse.json({ matches: [] })
    const csv = await res.text()
    const rows = csv.split("\n").map(parseCSVLine)

    // 行インデックスを特定
    const rowIdx: Record<string, number> = {}
    rows.forEach((row, i) => {
      const label = row[1]?.trim()
      if (!label) return
      if (label === '対戦相手')          rowIdx['opponent'] = i
      if (label === '得点')              rowIdx['goalsFor'] = i
      if (label === '失点')              rowIdx['goalsAgainst'] = i
      if (label === 'パッキングレート')   rowIdx['packingRate'] = i
      if (label === 'インペクト')         rowIdx['impact'] = i
      if (label === 'ボックス侵入回数')   rowIdx['boxEntries'] = i
      if (label === 'ゴールエリア侵入回数') rowIdx['goalAreaEntries'] = i
      if (label === 'ラインブレイク')     rowIdx['lineBreak'] = i
      if (label === 'ラインブレイクAC')   rowIdx['lineBreakAC'] = i
      if (label === 'クロス')            rowIdx['crosses'] = i
      if (label === 'シュート')          rowIdx['shots'] = i
      if (label === 'CK数')              rowIdx['corners'] = i
      if (label === 'FK数')              rowIdx['freeKicks'] = i
      if (label === '相手パッキングレート')    rowIdx['opp_packingRate'] = i
      if (label === '相手インペクト')          rowIdx['opp_impact'] = i
      if (label === '相手ボックス侵入回数')    rowIdx['opp_boxEntries'] = i
      if (label === '相手ゴールエリア侵入回数') rowIdx['opp_goalAreaEntries'] = i
      if (label === '相手ラインブレイク')      rowIdx['opp_lineBreak'] = i
      if (label === '相手ラインブレイクAC')    rowIdx['opp_lineBreakAC'] = i
      if (label === '相手クロス')             rowIdx['opp_crosses'] = i
      if (label === '相手シュート')           rowIdx['opp_shots'] = i
      if (label === '相手CK数')              rowIdx['opp_corners'] = i
      if (label === '相手FK数')              rowIdx['opp_freeKicks'] = i
    })

    const dateRow   = rows[1]  ?? []  // 行2: 日付
    const tournRow  = rows[3]  ?? []  // 行4: 大会名
    const halfRow   = rows[4]  ?? []  // 行5: 前半/後半/3本目
    const oppRow    = rows[rowIdx['opponent'] ?? 5] ?? []

    const g = (key: string, col: number) =>
      toNum((rows[rowIdx[key] ?? -1] ?? [])[col])

    const buildStats = (col: number, half: string) => ({
      half,
      goalsFor:          g('goalsFor', col),
      goalsAgainst:      g('goalsAgainst', col),
      packingRate:       g('packingRate', col),
      impact:            g('impact', col),
      boxEntries:        g('boxEntries', col),
      goalAreaEntries:   g('goalAreaEntries', col),
      lineBreak:         g('lineBreak', col),
      lineBreakAC:       g('lineBreakAC', col),
      crosses:           g('crosses', col),
      shots:             g('shots', col),
      corners:           g('corners', col),
      freeKicks:         g('freeKicks', col),
      opp_packingRate:        g('opp_packingRate', col),
      opp_impact:             g('opp_impact', col),
      opp_boxEntries:         g('opp_boxEntries', col),
      opp_goalAreaEntries:    g('opp_goalAreaEntries', col),
      opp_lineBreak:          g('opp_lineBreak', col),
      opp_lineBreakAC:        g('opp_lineBreakAC', col),
      opp_crosses:            g('opp_crosses', col),
      opp_shots:              g('opp_shots', col),
      opp_corners:            g('opp_corners', col),
      opp_freeKicks:          g('opp_freeKicks', col),
    })

    // 列をスキャンして試合ごとにグループ化
    // 日付+対戦相手が同じ列を同一試合として扱い、前半/後半/3本目をhalves配列にまとめる
    const matchMap = new Map<string, {
      date: string; tournament: string; opponent: string
      halves: ReturnType<typeof buildStats>[]
    }>()
    const matchOrder: string[] = []

    for (let col = 2; col < dateRow.length; col++) {
      const date     = dateRow[col]?.trim()
      const opponent = oppRow[col]?.trim()
      if (!date || !opponent || date === '平均') continue

      const tournament = tournRow[col]?.trim() || 'TM'
      const halfLabel  = halfRow[col]?.trim() || '合計'

      const key = date + '|' + opponent
      if (!matchMap.has(key)) {
        matchMap.set(key, { date, tournament, opponent, halves: [] })
        matchOrder.push(key)
      }
      matchMap.get(key)!.halves.push(buildStats(col, halfLabel))
    }

    const matches = matchOrder.map(key => {
      const m = matchMap.get(key)!
      // 合計が最初に来るよう並び替え: 合計 → 前半 → 後半 → 3本目
      const order = ['合計', '前半', '後半', '3本目', '4本目']
      const sortedHalves = [...m.halves].sort((a, b) => {
        const ai = order.indexOf(a.half) >= 0 ? order.indexOf(a.half) : 99
        const bi = order.indexOf(b.half) >= 0 ? order.indexOf(b.half) : 99
        return ai - bi
      })
      // 後方互換: トップレベルに合計（または最初のハーフ）を展開
      const total = sortedHalves[0]
      return {
        date: m.date, tournament: m.tournament, opponent: m.opponent,
        halves: sortedHalves,
        // 後方互換フィールド
        goalsFor: total.goalsFor, goalsAgainst: total.goalsAgainst,
        packingRate: total.packingRate, impact: total.impact,
        boxEntries: total.boxEntries, goalAreaEntries: total.goalAreaEntries,
        lineBreak: total.lineBreak, lineBreakAC: total.lineBreakAC,
        crosses: total.crosses, shots: total.shots,
        corners: total.corners, freeKicks: total.freeKicks,
        opp_packingRate: total.opp_packingRate, opp_impact: total.opp_impact,
        opp_boxEntries: total.opp_boxEntries, opp_goalAreaEntries: total.opp_goalAreaEntries,
        opp_lineBreak: total.opp_lineBreak, opp_lineBreakAC: total.opp_lineBreakAC,
        opp_crosses: total.opp_crosses, opp_shots: total.opp_shots,
        opp_corners: total.opp_corners, opp_freeKicks: total.opp_freeKicks,
      }
    })

    return NextResponse.json({ matches })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ matches: [] })
  }
}