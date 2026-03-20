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

    const rowIdx: Record<string, number> = {}
    rows.forEach((row, i) => {
      const label = row[1]?.trim()
      if (!label) return
      if (label === '対戦相手')               rowIdx['opponent'] = i
      if (label === '得点')                   rowIdx['goalsFor'] = i
      if (label === '失点')                   rowIdx['goalsAgainst'] = i
      if (label === 'パッキングレート')         rowIdx['packingRate'] = i
      if (label === 'インペクト')              rowIdx['impact'] = i
      if (label === 'ボックス侵入回数')         rowIdx['boxEntries'] = i
      if (label === 'ゴールエリア侵入回数')     rowIdx['goalAreaEntries'] = i
      if (label === 'ラインブレイク')           rowIdx['lineBreak'] = i
      if (label === 'ラインブレイクAC')         rowIdx['lineBreakAC'] = i
      if (label === 'クロス')                 rowIdx['crosses'] = i
      if (label === 'シュート')               rowIdx['shots'] = i
      if (label === 'CK数')                  rowIdx['corners'] = i
      if (label === 'FK数')                  rowIdx['freeKicks'] = i
      if (label === '相手パッキングレート')      rowIdx['opp_packingRate'] = i
      if (label === '相手インペクト')           rowIdx['opp_impact'] = i
      if (label === '相手ボックス侵入回数')      rowIdx['opp_boxEntries'] = i
      if (label === '相手ゴールエリア侵入回数')  rowIdx['opp_goalAreaEntries'] = i
      if (label === '相手ラインブレイク')        rowIdx['opp_lineBreak'] = i
      if (label === '相手ラインブレイクAC')      rowIdx['opp_lineBreakAC'] = i
      if (label === '相手クロス')              rowIdx['opp_crosses'] = i
      if (label === '相手シュート')            rowIdx['opp_shots'] = i
      if (label === '相手CK数')               rowIdx['opp_corners'] = i
      if (label === '相手FK数')               rowIdx['opp_freeKicks'] = i
    })

    const dateRow = rows[1] ?? []
    const tournRow = rows[3] ?? []
    const halfRow  = rows[4] ?? []
    const oppRow   = rows[rowIdx['opponent'] ?? 5] ?? []

    const g = (key: string, col: number) =>
      toNum((rows[rowIdx[key] ?? -1] ?? [])[col])

    const buildStats = (col: number, half: string) => ({
      half,
      goalsFor:         g('goalsFor', col),
      goalsAgainst:     g('goalsAgainst', col),
      packingRate:      g('packingRate', col),
      impact:           g('impact', col),
      boxEntries:       g('boxEntries', col),
      goalAreaEntries:  g('goalAreaEntries', col),
      lineBreak:        g('lineBreak', col),
      lineBreakAC:      g('lineBreakAC', col),
      crosses:          g('crosses', col),
      shots:            g('shots', col),
      corners:          g('corners', col),
      freeKicks:        g('freeKicks', col),
      opp_packingRate:       g('opp_packingRate', col),
      opp_impact:            g('opp_impact', col),
      opp_boxEntries:        g('opp_boxEntries', col),
      opp_goalAreaEntries:   g('opp_goalAreaEntries', col),
      opp_lineBreak:         g('opp_lineBreak', col),
      opp_lineBreakAC:       g('opp_lineBreakAC', col),
      opp_crosses:           g('opp_crosses', col),
      opp_shots:             g('opp_shots', col),
      opp_corners:           g('opp_corners', col),
      opp_freeKicks:         g('opp_freeKicks', col),
    })

    // グループ化: 日付+対戦相手でまとめ、同一half重複はスキップ
    // 前半/後半/3本目のみの試合と合計のみの試合を区別する
    const VALID_HALVES = new Set(['前半', '後半', '3本目', '4本目'])
    const matchMap = new Map<string, {
      date: string; tournament: string; opponent: string
      halves: ReturnType<typeof buildStats>[]
      seenHalves: Set<string>
    }>()
    const matchOrder: string[] = []

    for (let col = 2; col < dateRow.length; col++) {
      const date     = dateRow[col]?.trim()
      const opponent = oppRow[col]?.trim()
      if (!date || !opponent || date === '平均') continue

      const tournament = tournRow[col]?.trim() || 'TM'
      // 行5: 前半/後半/3本目 → 記載あり。空欄 → 合計
      const halfLabel = halfRow[col]?.trim()
      const half = halfLabel || '合計'

      const key = date + '|' + opponent
      if (!matchMap.has(key)) {
        matchMap.set(key, { date, tournament, opponent, halves: [], seenHalves: new Set() })
        matchOrder.push(key)
      }
      const group = matchMap.get(key)!

      // 同じhalf（前半/後半/3本目/合計）が既に登録済みならスキップ（重複防止）
      if (group.seenHalves.has(half)) continue
      group.seenHalves.add(half)
      group.halves.push(buildStats(col, half))
    }

    // 並び替え: 合計 → 前半 → 後半 → 3本目
    const HALF_ORDER = ['合計', '前半', '後半', '3本目', '4本目']
    const matches = matchOrder.map(key => {
      const m = matchMap.get(key)!
      const sortedHalves = [...m.halves].sort((a, b) => {
        const ai = HALF_ORDER.indexOf(a.half); const bi = HALF_ORDER.indexOf(b.half)
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
      })
      const total = sortedHalves[0]
      return {
        date: m.date, tournament: m.tournament, opponent: m.opponent,
        halves: sortedHalves,
        // 後方互換フィールド (合計or前半のデータ)
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
    }).filter(m => m.date && m.opponent)

    return NextResponse.json({ matches })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ matches: [] })
  }
}