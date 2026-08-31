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
      if (cells.length < 10) continue
      const rank = parseInt(cells[0])
      if (isNaN(rank)) continue
      const team = cells[1]?.replace(/\s+/g, '') ?? ''
      if (!team) continue

      // cols: [0]=順位 [1]=チーム [2]=勝点 [3]=試合数
      // [4]=勝H [5]=勝A [6]=引H [7]=引A [8]=敖H [9]=敖A
      // [10]=得失 [11]=得点 [12]=失点
      const points = parseInt(cells[2]) || 0
      const played = parseInt(cells[3]) || 0
      const won = (parseInt(cells[4]) || 0) + (parseInt(cells[5]) || 0)
      const drawn = (parseInt(cells[6]) || 0) + (parseInt(cells[7]) || 0)
      const lost = (parseInt(cells[8]) || 0) + (parseInt(cells[9]) || 0)
      const gd = cells[10] || '0'
      const gf = parseInt(cells[11]) || 0
      const ga = parseInt(cells[12]) || 0

      const isOurTeam = team.includes('ボンズ') || team.includes('VONDS') ||
        team.includes('Ｖ市原')

      standings.push({ rank, team, points, played, won, drawn, lost, gd, gf, ga, isOurTeam })
    }

    const titleMatch = html.match(/第[^<]*日本フットボールリーグ[^<]*/)
    const title = titleMatch ? titleMatch[0].trim() : '2026-2027 JFL'

    return NextResponse.json({ standings, title })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ standings: [] })
  }
}
