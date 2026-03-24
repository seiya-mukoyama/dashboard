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

export async function GET() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${GOALS_SHEET_ID}/export?format=csv&gid=${GOALS_GID}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    const text = await res.text()
    const rows = parseCSV(text)

    // 行0: ヘッダー（目標一覧, 目標値, 1節, 2節...）
    // 行1以降: データ
    if (rows.length < 2) return NextResponse.json({ goals: [] })

    const header = rows[0] // ['目標一覧', '目標値', '1節', '2節', ...]
    const totalMatches = header.slice(2).filter(h => h.trim()).length // 試合数

    const goals = rows.slice(1).filter(r => r[0]?.trim()).map(row => {
      const name = row[0]?.trim()
      const target = row[1]?.trim()
      
      // 最新の実績を取得（C列以降で値がある最後の列）
      const actuals = row.slice(2).filter(v => v.trim())
      const latest = actuals.length > 0 ? actuals[actuals.length - 1].trim() : null
      const matchCount = actuals.length

      // 数値比較（APTは時間なので別扱い）
      const isTime = name.includes('APT')
      let status: 'good' | 'bad' | 'neutral' = 'neutral'
      
      if (latest && target) {
        if (isTime) {
          // APTは目標値より高いほど良い（平均APT: 0:55:00 = 55分）
          // 比較は秒数で
          const toSec = (s: string) => {
            const p = s.replace(/^:/, '').split(':')
            if (p.length === 3) return +p[0]*3600 + +p[1]*60 + +p[2]
            if (p.length === 2) return +p[0]*60 + +p[1]
            return 0
          }
          status = toSec(latest) >= toSec(target) ? 'good' : 'bad'
        } else {
          const l = parseFloat(latest.replace(',', ''))
          const t = parseFloat(target.replace(',', ''))
          if (!isNaN(l) && !isNaN(t)) {
            // 失点は低いほど良い
            if (name.includes('失点')) {
              status = l <= t ? 'good' : 'bad'
            } else {
              status = l >= t ? 'good' : 'bad'
            }
          }
        }
      }

      return { name, target, latest, matchCount, status }
    })

    return NextResponse.json({ goals, totalMatches })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
