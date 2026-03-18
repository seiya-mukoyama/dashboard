import { NextResponse } from 'next/server'

const SHEET_ID = '1Y_im99vGkmEc-6GgwXqXQC2Lz6yriRGqy-xV5wlm48g'
const GID = '1979610514'

function parseNum(val: string | undefined): number {
  if (!val || val.trim() === '') return 0
  const n = parseFloat(val.replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

function parseCSV(text: string): string[][] {
  return text.split('\n').map(row => {
    const cols: string[] = []; let cur = '', inQ = false
    for (const c of row) {
      if (c === '"') inQ = !inQ
      else if (c === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
      else cur += c
    }
    cols.push(cur.trim()); return cols
  })
}

export async function GET() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) throw new Error('Failed to fetch')
    const rows = parseCSV(await res.text())

    // チーム名行を探す
    const teamRowIdx = rows.findIndex(r => r.some(c => c.includes('VONDS') || c.includes('市原')))
    if (teamRowIdx === -1) throw new Error('Team row not found')

    const teamRow = rows[teamRowIdx]
    const teamCol = teamRow.findIndex(c => c.includes('VONDS') || c.includes('市原'))
    const teamName = teamRow[teamCol] || 'VONDS市原'
    const oppRow = rows[teamRowIdx + 1] || []

    // 日付列を特定
    const dateCols: number[] = []
    for (let c = teamCol + 1; c < teamRow.length; c++) {
      const v = teamRow[c]?.trim()
      if (!v || v.includes('平均')) break
      dateCols.push(c)
    }
    const avgCol = teamRow.findIndex((v, i) => i > teamCol && v.includes('平均'))

    // ラベルで行を検索
    const findRow = (label: string, after = 0) => {
      for (let i = after; i < rows.length; i++) {
        if (rows[i].some(c => c.trim() === label)) return i
      }
      return -1
    }

    const rGoals = findRow('得点')
    const rConceded = findRow('失点')
    const rPacking = findRow('パッキングレート')
    const rImpact = findRow('インペクト')
    const rBox = findRow('ボックス侵入回数')
    const rGoalArea = findRow('ゴールエリア侵入回数')
    const rLB = findRow('ラインブレイク')
    const rLBAC = findRow('ラインブレイクAC')
    const rCross = findRow('クロス')
    const rCK = findRow('CK数')
    const rFK = findRow('FK数')
    const rOppPacking = findRow('パッキングレート', rPacking + 1)
    const rOppBox = findRow('ボックス侵入回数', rBox + 1)

    const g = (r: number, c: number) => r >= 0 ? parseNum(rows[r]?.[c]) : 0

    const matches = dateCols.map((col, i) => ({
      date: rows[teamRowIdx]?.[col]?.trim() || `試合${i+1}`,
      opponent: oppRow?.[col]?.trim() || `相手${i+1}`,
      goalsFor: g(rGoals, col),
      goalsAgainst: g(rConceded, col),
      packingRate: g(rPacking, col),
      opp_packingRate: g(rOppPacking, col),
      impact: g(rImpact, col),
      boxEntries: g(rBox, col),
      opp_boxEntries: g(rOppBox, col),
      goalAreaEntries: g(rGoalArea, col),
      lineBreak: g(rLB, col),
      lineBreakAC: g(rLBAC, col),
      crosses: g(rCross, col),
      corners: g(rCK, col),
      freeKicks: g(rFK, col),
    })).filter(m => m.date && m.opponent)

    const averages = {
      goalsFor: avgCol > 0 ? g(rGoals, avgCol) : 0,
      goalsAgainst: avgCol > 0 ? g(rConceded, avgCol) : 0,
      packingRate: avgCol > 0 ? g(rPacking, avgCol) : 0,
      impact: avgCol > 0 ? g(rImpact, avgCol) : 0,
      boxEntries: avgCol > 0 ? g(rBox, avgCol) : 0,
    }

    const wins = matches.filter(m => m.goalsFor > m.goalsAgainst).length
    const draws = matches.filter(m => m.goalsFor === m.goalsAgainst).length
    const losses = matches.filter(m => m.goalsFor < m.goalsAgainst).length

    return NextResponse.json({ teamName, matches, averages, wins, draws, losses })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
