import { NextResponse } from "next/server"

const JFL_URL = "https://www.jfl.or.jp/jfl-pc/view/s.php?a=2592"

function stripTags(str: string): string {
  return str.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
}

export async function GET() {
  try {
    const res = await fetch(JFL_URL, { cache: "no-store" })
    if (!res.ok) return NextResponse.json({ standings: [] })
    const html = await res.text()

    const standings: {
      rank: number; team: string; points: number; played: number
      won: number; drawn: number; lost: number; gd: string; gf: number; ga: number; isOurTeam: boolean
    }[] = []

    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
    let trMatch: RegExpExecArray | null
    while ((trMatch = trRegex.exec(html)) !== null) {
      const row = trMatch[1]
      const cells: string[] = []
      const tdRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi
      let tdMatch: RegExpExecArray | null
      while ((tdMatch = tdRegex.exec(row)) !== null) {
        cells.push(stripTags(tdMatch[1]))
      }
      // 列構成: [0]順位 [1]チーム [2]勝点 [3]試合数
      // [4]勝(bold) [5]勝H [6]勝A [7]引(bold) [8]引H [9]引A
      // [10]敖(bold) [11]敖H [12]敖A [13]得失(bold) [14]得点 [15]失点
      if (cells.length < 14) continue
      const rank = parseInt(cells[0])
      if (isNaN(rank)) continue
      const team = cells[1]?.replace(/\s+/g, '') ?? ''
      if (!team) continue

      const points = parseInt(cells[2]) || 0
      const played = parseInt(cells[3]) || 0
      const won = (parseInt(cells[5]) || 0) + (parseInt(cells[6]) || 0)
      const drawn = (parseInt(cells[8]) || 0) + (parseInt(cells[9]) || 0)
      const lost = (parseInt(cells[11]) || 0) + (parseInt(cells[12]) || 0)
      const gd = cells[13] || '0'
      const gf = parseInt(cells[14]) || 0
      const ga = parseInt(cells[15]) || 0

      const isOurTeam = team.includes('\u30dc\u30f3\u30ba') || team.includes('VONDS') ||
        team.includes('\uff36\u5e02\u539f')

      standings.push({ rank, team, points, played, won, drawn, lost, gd, gf, ga, isOurTeam })
    }

    const titleMatch = html.match(/\u7b2c[^\u003c]*\u65e5\u672c\u30d5\u30c3\u30c8\u30dc\u30fc\u30eb\u30ea\u30fc\u30b0[^\u003c]*/)
    const title = titleMatch ? titleMatch[0].trim() : '2026-2027 JFL'

    return NextResponse.json({ standings, title })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ standings: [] })
  }
}
