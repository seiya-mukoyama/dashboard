import { NextResponse } from "next/server"

const JFL_URL = "http://www.jfl.or.jp/jfl-pc/view/s.php?a=2514"

export async function GET() {
  try {
    const res = await fetch(JFL_URL, { cache: "no-store" })
    if (!res.ok) return NextResponse.json({ standings: [] })
    const html = await res.text()

    const standings: {
      rank: number; team: string; points: number; played: number
      won: number; pkWon: number; pkLost: number; lost: number
      gd: string; gf: number; ga: number; isOurTeam: boolean
    }[] = []

    // 1つ目のtableを抽出して解析
    const tableMatch = html.match(/<table[\s\S]*?<\/table>/i)
    if (!tableMatch) return NextResponse.json({ standings: [] })

    const rows = tableMatch[0].match(/<tr[\s\S]*?<\/tr>/gi) ?? []
    rows.forEach((row, i) => {
      if (i === 0) return // ヘッダー行スキップ
      const cells = (row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) ?? [])
        .map(cell => cell.replace(/<[^>]+>/g, '').trim())
        .filter(t => t !== '')
      if (cells.length < 9) return

      const rank = parseInt(cells[0]) || (i)
      const team = cells[1]
      const points = parseInt(cells[2]) || 0
      const played = parseInt(cells[3]) || 0
      const won = parseInt(cells[4]) || 0
      const pkWon = parseInt(cells[5]) || 0
      const pkLost = parseInt(cells[6]) || 0
      const lost = parseInt(cells[7]) || 0
      const gd = cells[8] || '0'
      const gf = parseInt(cells[9]) || 0
      const ga = parseInt(cells[10]) || 0
      const isOurTeam = team.includes('ボンズ') || team.includes('VONDS') || team.includes('Ｖ市原')

      if (team) standings.push({ rank, team, points, played, won, pkWon, pkLost, lost, gd, gf, ga, isOurTeam })
    })

    return NextResponse.json({ standings })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ standings: [] })
  }
}
