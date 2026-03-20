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

type StatsHalf = {
  half: string  // '合計'|'前半'|'後半'|'3本目' など
  goalsFor: number; goalsAgainst: number
  packingRate: number; impact: number; boxEntries: number; goalAreaEntries: number
  lineBreak: number; lineBreakAC: number; crosses: number; shots: number
  corners: number; freeKicks: number
  opp_packingRate: number; opp_impact: number; opp_boxEntries: number; opp_goalAreaEntries: number
  opp_lineBreak: number; opp_lineBreakAC: number; opp_crosses: number; opp_shots: number
  opp_corners: number; opp_freeKicks: number
}

type Match = {
  date: string; tournament: string; opponent: string
  halves: StatsHalf[]
} & StatsHalf  // 後方互換のためトップレベルにも合計を展開

export async function GET() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${STATS_SHEET_ID}/export?format=csv&gid=${STATS_GID}`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return NextResponse.json({ matches: [] })
    const csv = await res.text()
    const rows = csv.split("\n").map(parseCSVLine)

    // 行インデックスを特定（ラベルで検索）
    const rowIdx: Record<string, number> = {}
    const labelMap: Record<string, string> = {
      'date': '2', 'tournament': '大会名', 'half': '5行目',
      'opponent': '対戦相手', 'goalsFor': '得点', 'goalsAgainst': '失点',
      'packingRate': 'パッキングレート', 'impact': 'インペクト',
      'boxEntries': 'ボックス侵入回数', 'goalAreaEntries': 'ゴールエリア侵入回数',
      'lineBreak': 'ラインブレイク', 'lineBreakAC': 'ラインブレイクAC',
      'crosses': 'クロス', 'shots': 'シュート', 'corners': 'CK数', 'freeKicks': 'FK数',
      'opp_packingRate': '相手パッキングレート', 'opp_impact': '相手インペクト',
      'opp_boxEntries': '相手ボックス侵入回数', 'opp_goalAreaEntries': '相手ゴールエリア侵入回数',
      'opp_lineBreak': '相手ラインブレイク', 'opp_lineBreakAC': '相手ラインブレイクAC',
      'opp_crosses': '相手クロス', 'opp_shots': '相手シュート',
      'opp_corners': '相手CK数', 'opp_freeKicks': '相手FK数',
    }

    rows.forEach((row, i) => {
      const label = row[1]?.trim()
      if (!label) return
      if (i === 1) rowIdx['date'] = i
      if (i === 4) rowIdx['tournament'] = i
      if (i === 4) rowIdx['halfLabel'] = i  // 行4が大会名, 行5が前半/後半
      if (label === '対戦相手') rowIdx['opponent'] = i
      if (label === '得点') rowIdx['goalsFor'] = i
      if (label === '失点') rowIdx['goalsAgainst'] = i
      if (label === 'パッキングレート') rowIdx['packingRate'] = i
      if (label === 'インペクト') rowIdx['impact'] = i
      if (label === 'ボックス侵入回数') rowIdx['boxEntries'] = i
      if (label === 'ゴールエリア侵入回数') rowIdx['goalAreaEntries'] = i
      if (label === 'ラインブレイク') rowIdx['lineBreak'] = i
      if (label === 'ラインブレイクAC') rowIdx['lineBreakAC'] = i
      if (label === 'クロス') rowIdx['crosses'] = i
      if (label === 'シュート') rowIdx['shots'] = i
      if (label === 'CK数') rowIdx['corners'] = i
      if (label === 'FK数') rowIdx['freeKicks'] = i
      if (label === '相手パッキングレート') rowIdx['opp_packingRate'] = i
      if (label === '相手インペクト') rowIdx['opp_impact'] = i
      if (label === '相手ボックス侵入回数') rowIdx['opp_boxEntries'] = i
      if (label === '相手ゴールエリア侵入回数') rowIdx['opp_goalAreaEntries'] = i
      if (label === '相手ラインブレイク') rowIdx['opp_lineBreak'] = i
      if (label === '相手ラインブレイクAC') rowIdx['opp_lineBreakAC'] = i
      if (label === '相手クロス') rowIdx['opp_crosses'] = i
      if (label === '相手シュート') rowIdx['opp_shots'] = i
      if (label === '相手CK数') rowIdx['opp_corners'] = i
      if (label === '相手FK数') rowIdx['opp_freeKicks'] = i
    })

    // 行5（index 4）が大会名、行5（index 4）の次が前半/後半ラベル
    // 実際には: 行2=日付, 行4=大会名, 行5=前半後半, 行6=対戦相手
    const halfLabelRow = rows[4] ?? []  // index 4 = 行5（前半/後半/3本目）

    const dateRow     = rows[1] ?? []
    const tournRow    = rows[3] ?? []
    const halfRow     = rows[4] ?? []  // 前半/後半/3本目
    const oppRow      = rows[rowIdx['opponent'] ?? 5] ?? []

    const g = (key: string, col: number) => toNum((rows[rowIdx[key] ?? -1] ?? [])[col])

    function buildHalf(col: number, halfLabel: string): StatsHalf {
      return {
        half: halfLabel,
        goalsFor:      g('goalsFor', col),
        goalsAgainst:  g('goalsAgainst', col),
        packingRate:   g('packingRate', col),
        impact:        g('impact', col),
        boxEntries:    g('boxEntries', col),
        goalAreaEntries: g('goalAreaEntries', col),
        lineBreak:     g('lineBreak', col),
        lineBreakAC:   g('lineBreakAC', col),
        crosses:       g('crosses', col),
        shots:         g('shots', col),
        corners:       g('corners', col),
        freeKicks:     g('freeKicks', col),
        opp_packingRate:    g('opp_packingRate', col),
        opp_impact:         g('opp_impact', col),
        opp_boxEntries:     g('opp_boxEntries', col),
        opp_goalAreaEntries: g('opp_goalAreaEntries', col),
        opp_lineBreak:      g('opp_lineBreak', col),
        opp_lineBreakAC:    g('opp_lineBreakAC', col),
        opp_crosses:        g('opp_crosses', col),
        opp_shots:          g('opp_shots', col),
        opp_corners:        g('opp_corners', col),
        opp_freeKicks:      g('opp_freeKicks', col),
      }
    }

    // 列をグループ化: 同じ日付・対戦相手をまとめて前半/後半/3本目に分ける
    type ColGroup = { date: string; tournament: string; opponent: string; cols: { col: number; half: string }[] }
    const groups: ColGroup[] = []
    const SKIP_COLS = new Set([0, 1])  // A,B列はラベル列

    let col = 2
    while (col < (dateRow.length)) {
      const date = dateRow[col]?.trim()
      if (!date || date === '平均') { col++; continue }

      const tournament = tournRow[col]?.trim() ?? 'TM'
      const opponent   = oppRow[col]?.trim() ?? ''
      const halfLabel  = halfRow[col]?.trim() || ''

      if (!opponent) { col++; continue }

      // 既存グループに追加するか新しいグループを作るか
      // 前半/後半/3本目のいずれかのラベルがある場合は同一試合として扱う
      const existingGroup = halfLabel
        ? groups.find(g => g.date === date && g.opponent === opponent)
        : null

      if (existingGroup) {
        existingGroup.cols.push({ col, half: halfLabel })
      } else {
        // 空ラベル = 合計列、または新しい試合
        if (!halfLabel) {
          groups.push({ date, tournament, opponent, cols: [{ col, half: '合計' }] })
        }
        // halfLabelがあるが既存グループがない = 前半が先頭のケース
        else {
          groups.push({ date, tournament, opponent, cols: [{ col, half: halfLabel }] })
        }
      }
      col++
    }

    // 各グループをMatchに変換
    const matches: Match[] = groups
      .filter(g => g.cols.length > 0)
      .map(group => {
        const halves = group.cols.map(({ col, half }) => buildHalf(col, half))

        // 合計があればそれ、なければ最初のhalf
        const total = halves.find(h => h.half === '合計') ?? halves[0]

        return {
          date: group.date,
          tournament: group.tournament,
          opponent: group.opponent,
          halves,
          // 後方互換: トップレベルに合計を展開
          half: '合計',
          ...total,
        } as Match
      })
      .filter(m => m.date && m.opponent)

    return NextResponse.json({ matches })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ matches: [] })
  }
}