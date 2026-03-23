import { NextResponse } from 'next/server' // v3

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const team = searchParams.get('team') ?? ''
  const limit = parseInt(searchParams.get('limit') ?? '5')

  try {
    const url = 'http://www.jfl.or.jp/jfl-pc/view/s.php?a=2513&f=2026A008_spc.html'
    const res = await fetch(url, { next: { revalidate: 3600 } })
    const html = await res.text()

    // td タグの内容を抽出するヘルパー（正規表現なし）
    const extractTds = (row: string): string[] => {
      const cells: string[] = []
      let rest = row
      while (rest.includes('<td')) {
        const start = rest.indexOf('<td')
        if (start === -1) break
        const open = rest.indexOf('>', start)
        if (open === -1) break
        const close = rest.indexOf('</td>', open)
        if (close === -1) break
        const inner = rest.substring(open + 1, close)
        // タグを除去して空白を正規化
        const text = inner.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/[ \t\n\r]+/g, ' ').trim()
        cells.push(text)
        rest = rest.substring(close + 5)
      }
      return cells
    }

    // tr タグを分割して各行を処理
    const rows = html.split('<tr')
    const matches: { date: string; home: string; score: string | null; away: string; hasResult: boolean }[] = []

    for (const row of rows) {
      const cells = extractTds(row)
      if (cells.length >= 5) {
        const score = cells[3]
        const hasResult = score.includes('-') && /[0-9]/.test(score)
        matches.push({
          date: cells[0],
          home: cells[2],
          score: hasResult ? score : null,
          away: cells[4],
          hasResult,
        })
      }
    }

    // チームフィルタ
    const norm = (s: string) => s.replace(/\s/g, '').replace(/[\u3000\u30fb\uff65.]/g, '')
    const t = norm(team).slice(0, 6)

    const teamMatches = team
      ? matches.filter(m => norm(m.home).includes(t) || norm(m.away).includes(t) || t.includes(norm(m.home).slice(0, 4)) || t.includes(norm(m.away).slice(0, 4)))
      : matches

    const past = teamMatches.filter(m => m.hasResult)
    const recent = past.slice(-limit)

    const form = recent.map(m => {
      if (!m.score) return 'D'
      const parts = m.score.split('-')
      const hg = parseInt(parts[0]) || 0
      const ag = parseInt(parts[1]) || 0
      const isHome = norm(m.home).includes(t) || t.includes(norm(m.home).slice(0, 4))
      const gf = isHome ? hg : ag
      const ga = isHome ? ag : hg
      return gf > ga ? 'W' : gf < ga ? 'L' : 'D'
    })

    return NextResponse.json({ team, recentMatches: recent, form })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
