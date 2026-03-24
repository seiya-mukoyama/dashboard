import { NextResponse } from "next/server"

const JFL_URL = "http://www.jfl.or.jp/jfl-pc/view/s.php?a=2513&f=2026A008_spc.html"
const OUR_TEAM = "ボンズ市原"

function toHalf(s: string) {
  return s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).trim()
}

function parseDate(s: string) {
  const m = s.match(/(\d+)月(\d+)日/)
  return m ? `${parseInt(m[1])}月${parseInt(m[2])}日` : s
}

export async function GET() {
  try {
    const res = await fetch(JFL_URL, { cache: "no-store" })
    if (!res.ok) return NextResponse.json({ past: [], upcoming: [] })
    const html = await res.text()

    type Match = {
      date: string; time: string; round: string
      opponent: string; score: string | null
      goalsFor: number | null; goalsAgainst: number | null
      isHome: boolean; venue: string; hasResult: boolean
    }

    const matches: Match[] = []
    let currentRound = ''

    // tableの各trを抽出して解析
    const trPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
    let trMatch: RegExpExecArray | null

    while ((trMatch = trPattern.exec(html)) !== null) {
      const row = trMatch[1]
      // tdの中身を取得（タグを除去）
      const cells = (row.match(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi) ?? [])
        .map(td => td.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim())

      if (cells.length === 0) continue

      // 節ヘッダー行: "第N節節詳細" を含む
      const roundLine = cells.join(' ')
      const roundMatch = roundLine.match(/第(\d+)節/)
      if (roundMatch && roundLine.includes('節詳細')) {
        currentRound = `第${roundMatch[1]}節`
        continue
      }

      // 試合行: 日付(MM月DD日)を含む列がある
      const dateCell = cells.find(c => /\d+月\d+日/.test(c))
      if (!dateCell) continue

      // ボンズ市原が含まれる行のみ
      const rowText = cells.join(' ')
      if (!rowText.includes(OUR_TEAM)) continue

      const dateStr = parseDate(dateCell)
      const timeCell = cells.find(c => /^\d{2}:\d{2}$/.test(c)) ?? ''

      // スコア列を探す: "X-Y" or "X-X (PK X-X)"
      const scoreCell = cells.find(c => /^\d+-\d+/.test(c) || /^\d+.*PK/.test(c))
      const dashCell = cells.find(c => c === '-')
      const hasResult = !!scoreCell

      let goalsFor: number | null = null
      let goalsAgainst: number | null = null
      let score: string | null = null

      // チーム名列を特定（日付・時刻・スコア・会場以外）
      const teamCells = cells.filter(c =>
        !/\d+月\d+日/.test(c) &&
        !/^\d{2}:\d{2}$/.test(c) &&
        !/^\d+-\d+/.test(c) &&
        c !== '-' &&
        !c.includes('詳細') &&
        !c.includes('公式記録') &&
        !c.includes('節詳細') &&
        c.length > 0
      )

      // ボンズ市原のインデックスで HOME/AWAY を判定
      // teamCells の中でボンズ市原が最初に来ればホーム
      const vondsIdx = teamCells.findIndex(c => c.includes(OUR_TEAM))
      const isHome = vondsIdx === 0

      // 対戦相手（ボンズ市原でない最初のチーム名らしき文字列）
      const opponent = teamCells.find(c => !c.includes(OUR_TEAM) && c.length > 1 && !/^[\(\)0-9]/.test(c)) ?? ''

      // スタジアム（最後のチーム名でない短めの文字列）
      const venue = toHalf(teamCells[teamCells.length - 1] === opponent || teamCells[teamCells.length - 1]?.includes(OUR_TEAM) ? '' : teamCells[teamCells.length - 1] ?? '')

      if (hasResult && scoreCell) {
        const sm = scoreCell.match(/(\d+)-(\d+)/)
        if (sm) {
          const home = parseInt(sm[1])
          const away = parseInt(sm[2])
          goalsFor = isHome ? home : away
          goalsAgainst = isHome ? away : home
          score = `${goalsFor}-${goalsAgainst}`
        }
      }

      if (!opponent) continue

      matches.push({
        date: dateStr,
        time: timeCell,
        round: currentRound,
        opponent: opponent.replace(/\s+/g, ''),
        score,
        goalsFor,
        goalsAgainst,
        isHome,
        venue,
        hasResult,
      })
    }

    const past = matches.filter(m => m.hasResult).reverse()
    const upcoming = matches.filter(m => !m.hasResult)

    return NextResponse.json({ past, upcoming })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ past: [], upcoming: [] })
  }
}
