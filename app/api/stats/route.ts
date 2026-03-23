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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const typeFilter = searchParams.get("type") // "TM" or "official" or null (all)
  try {
    const url = `https://docs.google.com/spreadsheets/d/${STATS_SHEET_ID}/export?format=csv&gid=${STATS_GID}`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return NextResponse.json({ matches: [] })
    const csv = await res.text()
    const rows = csv.split("\n").map(parseCSVLine)

    // 行インデックスを特定
    // 構造:
    //   行2 = 日付, 行4 = 大会名, 行5 = 前半/後半/3本目, 行6 = 対戦相手
    //   行7 = 得点, 行8 = 失点
    //   行13〜22 = VONDS市原スタッツ (B列ラベル: パッキングレート〜FK数)
    //   行24 = "相手チーム" セクションヘッダ
    //   行25〜34 = 相手チームスタッツ (同じ順番)
    
    // B列ラベルでrow indexを検索
    // 「相手チーム」の後ろに来る同ラベルを相手スタッツとして扱う
    const STAT_KEYS = ['packingRate','impact','boxEntries','goalAreaEntries',
                       'lineBreak','lineBreakAC','crosses','shots','corners','freeKicks']
    const STAT_LABELS = ['パッキングレート','インペクト','ボックス侵入回数','ゴールエリア侵入回数',
                         'ラインブレイク','ラインブレイクAC','クロス','シュート','CK数','FK数']

    const rowIdx: Record<string, number> = {}
    let oppSection = false  // 「相手チーム」行を超えたか

    rows.forEach((row, i) => {
      const label = row[1]?.trim()
      if (!label) return

      if (label === '対戦相手') rowIdx['opponent'] = i
      if (label === 'APT(90分換算)') rowIdx['apt'] = i
      if (label === '得点')     rowIdx['goalsFor'] = i
      if (label === '失点')     rowIdx['goalsAgainst'] = i

      // 「相手チーム」セクション区切り
      if (label === '相手チーム') { oppSection = true; return }

      const statIdx = STAT_LABELS.indexOf(label)
      if (statIdx >= 0) {
        const key = STAT_KEYS[statIdx]
        if (!oppSection) {
          rowIdx[key] = i          // VONDS側（最初に出てくるもの）
        } else {
          rowIdx['opp_' + key] = i // 相手側（相手チーム以降に出てくるもの）
        }
      }
    })

    const dateRow  = rows[1] ?? []
    const venueRow  = rows[2] ?? []  // 3行目: HOME/AWAY
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
      apt:              (rows[rowIdx['apt'] ?? -1] ?? [])[col]?.trim() || '',
      opp_packingRate:      g('opp_packingRate', col),
      opp_impact:           g('opp_impact', col),
      opp_boxEntries:       g('opp_boxEntries', col),
      opp_goalAreaEntries:  g('opp_goalAreaEntries', col),
      opp_lineBreak:        g('opp_lineBreak', col),
      opp_lineBreakAC:      g('opp_lineBreakAC', col),
      opp_crosses:          g('opp_crosses', col),
      opp_shots:            g('opp_shots', col),
      opp_corners:          g('opp_corners', col),
      opp_freeKicks:        g('opp_freeKicks', col),
    })

    // グループ化: 同じhalf重複はスキップ
    const HALF_ORDER = ['合計', '前半', '後半', '3本目', '4本目']
    const matchMap = new Map<string, {
      date: string; tournament: string; venue: string; opponent: string
      halves: ReturnType<typeof buildStats>[]
      seenHalves: Set<string>
    }>()
    const matchOrder: string[] = []

    for (let col = 2; col < dateRow.length; col++) {
      const date     = dateRow[col]?.trim()
      const opponent = oppRow[col]?.trim()
      if (!date || !opponent || date === '平均') continue

      const tournament = tournRow[col]?.trim() || 'TM'
      const venue = venueRow[col]?.trim() || ''
      const halfLabel  = halfRow[col]?.trim()
      const half       = halfLabel || '合計'

      const key = date + '|' + opponent
      if (!matchMap.has(key)) {
        matchMap.set(key, { date, tournament, venue, opponent, halves: [], seenHalves: new Set() })
        matchOrder.push(key)
      }
      const group = matchMap.get(key)!
      if (group.seenHalves.has(half)) continue
      group.seenHalves.add(half)
      group.halves.push(buildStats(col, half))
    }

    // 数値キー一覧（合計計算用）
    const NUM_KEYS = ['goalsFor','goalsAgainst','packingRate','impact','boxEntries','goalAreaEntries',
                      'lineBreak','lineBreakAC','crosses','shots','corners','freeKicks',
                      'opp_packingRate','opp_impact','opp_boxEntries','opp_goalAreaEntries',
                      'opp_lineBreak','opp_lineBreakAC','opp_crosses','opp_shots','opp_corners','opp_freeKicks'] as const

    const matches = matchOrder.map(key => {
      const m = matchMap.get(key)!
      const sortedHalves = [...m.halves].sort((a, b) => {
        const ai = HALF_ORDER.indexOf(a.half); const bi = HALF_ORDER.indexOf(b.half)
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
      })

      // 既存の合計列があればそれを使い、なければ前半+後半+3本目を合算
      const existingTotal = sortedHalves.find(h => h.half === '合計')
      const total = existingTotal ?? (() => {
        const sum: Record<string, number> = { goalsFor: 0, goalsAgainst: 0 }
        NUM_KEYS.forEach(k => {
          sum[k] = sortedHalves.reduce((acc, h) => acc + (((h as unknown) as Record<string, number>)[k] ?? 0), 0)
        })
        // APTは各ハーフを秒数で合算して MM:SS 形式に変換
        const aptRaws = sortedHalves.map(h => ((h as unknown) as Record<string,string>)['apt']).filter(Boolean)
        let aptTotal = ''
        if (aptRaws.length > 0) {
          const totalSec = aptRaws.reduce((acc, raw) => {
            const s = raw.replace(/^:/, '')
            const parts = s.split(':')
            if (parts.length === 3) {
              return acc + (parseInt(parts[0]) || 0) * 3600 + (parseInt(parts[1]) || 0) * 60 + (parseInt(parts[2]) || 0)
            }
            if (parts.length === 2) {
              return acc + (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0)
            }
            return acc
          }, 0)
          const totalMin = Math.floor(totalSec / 60)
          const remSec = String(totalSec % 60).padStart(2, '0')
          aptTotal = totalMin + ':' + remSec
        }
        return { half: '合計', ...sum, apt: aptTotal } as ReturnType<typeof buildStats>
      })()

      // 合計をhalvesの先頭に追加（まだない場合）
      const halvesWithTotal = existingTotal
        ? sortedHalves
        : [total, ...sortedHalves]

      return {
        date: m.date, tournament: m.tournament, venue: m.venue, opponent: m.opponent,
        halves: halvesWithTotal,
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

    // typeフィルタ: "TM"→TMのみ、"official"→TM以外(JFL/JFL CUP/天皇杯etc)
  const filtered = typeFilter === 'TM'
    ? matches.filter(m => m.tournament?.trim().toUpperCase() === 'TM')
    : typeFilter === 'official'
    ? matches.filter(m => m.tournament?.trim().toUpperCase() !== 'TM')
    : matches

  return NextResponse.json({ matches: filtered })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ matches: [] })
  }
}
