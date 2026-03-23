import { NextResponse } from 'next/server'

// JFL全試合スケジュールページからチーム別の直近試合を取得
// GET /api/opponent-stats?team=Ｙ.Ｓ.Ｃ.Ｃ.横浜&limit=5
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const team = searchParams.get('team') ?? ''
  const limit = parseInt(searchParams.get('limit') ?? '5')

  try {
    const url = 'http://www.jfl.or.jp/jfl-pc/view/s.php?a=2513&f=2026A008_spc.html'
    const res = await fetch(url, { next: { revalidate: 3600 } })
    const html = await res.text()

    // tableのtr行をパース
    const rowRegex = /<tr[^>]*>([sS]*?)</tr>/gi
    const tdRegex = /<td[^>]*>([sS]*?)</td>/gi
    const tagRegex = /<[^>]+>/g

    const clean = (s: string) => s.replace(tagRegex, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()

    const matches: { date: string; home: string; score: string | null; away: string; venue: string; hasResult: boolean }[] = []

    let rowMatch
    while ((rowMatch = rowRegex.exec(html)) !== null) {
      const cells: string[] = []
      let tdMatch
      const tdReg = /<td[^>]*>([sS]*?)</td>/gi
      tdReg.lastIndex = 0
      while ((tdMatch = tdReg.exec(rowMatch[1])) !== null) {
        cells.push(clean(tdMatch[1]))
      }
      // 日付 | 時間 | ホーム | スコア | アウェイ | 会場 の形式
      if (cells.length >= 6) {
        const score = cells[3]
        const hasResult = /\d+-\d+/.test(score)
        matches.push({
          date: cells[0],
          home: cells[2],
          score: hasResult ? score : null,
          away: cells[4],
          venue: cells[5],
          hasResult,
        })
      }
    }

    // チームフィルタ（空白・全角半角を無視して比較）
    const normalize = (s: string) => s.replace(/[\s　.．・]/g, '').toLowerCase()
    const targetNorm = normalize(team)

    const teamMatches = matches.filter(m => {
      if (!targetNorm) return true
      return normalize(m.home).includes(targetNorm.slice(0, 6)) ||
             normalize(m.away).includes(targetNorm.slice(0, 6)) ||
             targetNorm.includes(normalize(m.home).slice(0, 6)) ||
             targetNorm.includes(normalize(m.away).slice(0, 6))
    })

    // 結果がある試合のみ、最新limit件
    const pastMatches = teamMatches.filter(m => m.hasResult)
    const recent = pastMatches.slice(-limit)

    // チーム視点でW/D/Lを計算
    const form = recent.map(m => {
      if (!m.score) return 'D'
      const [hg, ag] = m.score.split('-').map(Number)
      const isHome = normalize(m.home).includes(targetNorm.slice(0, 6)) || targetNorm.includes(normalize(m.home).slice(0, 6))
      const goalsFor = isHome ? hg : ag
      const goalsAgainst = isHome ? ag : hg
      return goalsFor > goalsAgainst ? 'W' : goalsFor < goalsAgainst ? 'L' : 'D'
    })

    // 全試合（過去+未来）
    const upcoming = teamMatches.filter(m => !m.hasResult)

    return NextResponse.json({
      team,
      recentMatches: recent,
      form,
      upcoming: upcoming.slice(0, 5),
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
