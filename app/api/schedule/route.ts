import { NextResponse } from "next/server"

const JFL_URL = "http://www.jfl.or.jp/jfl-pc/view/s.php?a=2513&f=2026A008_spc.html"
const OUR_TEAM = "ボンズ市原"

// 全角→半角変換
function normalize(s: string) {
  return s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).trim()
}

// "03月22日(日)" → "3月22日"
function parseDate(s: string) {
  const m = s.match(/(\d+)月(\d+)日/)
  if (!m) return s
  return `${parseInt(m[1])}月${parseInt(m[2])}日`
}

export async function GET() {
  try {
    const res = await fetch(JFL_URL, { cache: "no-store" })
    if (!res.ok) return NextResponse.json({ past: [], upcoming: [] })
    const html = await res.text()

    // テキストを行に分割して解析
    const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')
    
    type Match = {
      date: string; time: string; round: string; competition: string
      home: string; away: string; score: string | null
      isHome: boolean; venue: string; hasResult: boolean
    }
    
    const matches: Match[] = []
    let currentRound = ''

    // 節を正規表現で抽出
    const roundPattern = /第(\d+)節節詳細/g
    const rounds: { round: string; index: number }[] = []
    let rm: RegExpExecArray | null
    while ((rm = roundPattern.exec(text)) !== null) {
      rounds.push({ round: `第${rm[1]}節`, index: rm.index })
    }

    // 各試合行を抽出: "MM月DD日(曜) HH:MM チーム名 スコア チーム名 スタジアム"
    const matchPattern = /(\d{2}月\d{2}日\([月火水木金土日]\))\s+(\d{2}:\d{2})\s+([^\d]+?)\s+(\d+-\d+(?:\s*\(PK\s*\d+-\d+\))?|-)\s+([^\d]+?)\s+([^\d月]+?)(?=\s+\d{2}月|\s*$)/g

    // シンプルなアプローチ: 行ごとに処理
    const lines = text.split(/(?=\d{2}月\d{2}日)/)
    
    for (const line of lines) {
      // 節を更新
      const roundMatch = line.match(/第(\d+)節節詳細/)
      if (roundMatch) { currentRound = `第${roundMatch[1]}節`; continue }

      // 日付・時刻を含む試合行
      const dateMatch = line.match(/(\d{2}月\d{2}日)\([月火水木金土日]\)/)
      if (!dateMatch) continue

      const timeMatch = line.match(/(\d{2}:\d{2})/)
      if (!timeMatch) continue

      const parts = line.trim().split(/\s+/)
      // ボンズ市原が含まれる行だけ処理
      if (!line.includes(OUR_TEAM)) continue

      // スコアパターン: "X-Y" or "X-X (PK X-X)" or "-"（未定）
      const scoreMatch = line.match(/(\d+)-(\d+)(?:\s*\(PK\s*\d+-\d+\))?/)
      const hasResult = !!scoreMatch

      // チーム名とスコアを抽出
      // "03月22日(日) 13:00 いわてグルージャ盛岡 0-0 (PK 3-5) ボンズ市原 いわｽﾀＡ"
      // または "03月28日(土) 13:00 ボンズ市原 - Ｙ.Ｓ.Ｃ.Ｃ.横浜 ＺＡ市原"
      const dateStr = parseDate(dateMatch[1])
      const timeStr = timeMatch[1]

      // ホーム/アウェイ判定: ボンズ市原が前に来ていればホーム
      const vonds_idx = line.indexOf(OUR_TEAM)
      const score_idx = line.search(/(\d+-\d+|\s+-\s+)/)
      const isHome = score_idx < 0 ? vonds_idx < line.length / 2 : vonds_idx < score_idx

      // 対戦相手を抽出（ボンズ市原以外のチーム名）
      // 試合行の構造からスタジアムを最後のトークンとして取得
      const withoutDate = line.replace(dateMatch[0] + '(' + ['月','火','水','木','金','土','日'].find(d => line.includes(dateMatch[0]+'('+d)) + ')', '').replace(timeStr, '').trim()
      
      // スコアかダッシュで分割
      let opponent = ''
      let venue = ''
      if (hasResult && scoreMatch) {
        const scoreStr = scoreMatch[0]
        const [before, after] = withoutDate.split(scoreStr)
        // PKスコアも除去
        const afterClean = after?.replace(/\s*\(PK\s*\d+-\d+\)/, '').trim() ?? ''
        const tokens = afterClean.split(/\s+/).filter(Boolean)
        if (isHome) {
          // ボンズ市原 スコア 相手 スタジアム
          const beforeTokens = before?.trim().split(/\s+/).filter(Boolean) ?? []
          opponent = beforeTokens.filter(t => !t.includes(OUR_TEAM)).join('') || tokens[0] || ''
          venue = tokens[tokens.length - 1] || ''
        } else {
          opponent = before?.trim().replace(OUR_TEAM, '').trim().split(/\s+/).filter(Boolean).pop() ?? ''
          const venueTokens = tokens.filter(t => !t.includes(OUR_TEAM))
          venue = venueTokens[venueTokens.length - 1] || ''
        }
      } else {
        // 未来の試合: "ボンズ市原 - 相手 スタジアム" or "相手 - ボンズ市原 スタジアム"
        const dashIdx = withoutDate.indexOf(' - ')
        if (dashIdx >= 0) {
          const beforeDash = withoutDate.substring(0, dashIdx).trim()
          const afterDash = withoutDate.substring(dashIdx + 3).trim()
          const afterTokens = afterDash.split(/\s+/).filter(Boolean)
          if (isHome) {
            opponent = afterTokens.slice(0, -1).join(' ') || afterTokens[0] || ''
            venue = afterTokens[afterTokens.length - 1] || ''
          } else {
            const beforeTokens = beforeDash.split(/\s+/).filter(Boolean)
            opponent = beforeTokens.filter(t => !t.includes(OUR_TEAM)).join(' ') || beforeTokens[0] || ''
            venue = afterTokens[afterTokens.length - 1] || ''
          }
        }
      }

      matches.push({
        date: dateStr,
        time: timeStr,
        round: currentRound,
        competition: 'JFL CUP',
        home: isHome ? OUR_TEAM : opponent,
        away: isHome ? opponent : OUR_TEAM,
        score: hasResult && scoreMatch ? `${scoreMatch[1]}-${scoreMatch[2]}` : null,
        isHome,
        venue: normalize(venue),
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
