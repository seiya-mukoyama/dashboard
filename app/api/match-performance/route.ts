import { NextResponse } from "next/server"

const TRACKING_SHEET_ID = "1FNxTC76yGGXbswZa5TTXTVDoSBvzh8gWiCsS-c7lvn4"

// TRACKINGシートのsigを取得（シートが存在するか確認用）
async function getTrackingSig(sheetName?: string): Promise<string> {
  try {
    const url = sheetName
      ? `https://docs.google.com/spreadsheets/d/${TRACKING_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`
      : `https://docs.google.com/spreadsheets/d/${TRACKING_SHEET_ID}/gviz/tq?tqx=out:json`
    const res = await fetch(url, { cache: "no-store" })
    const text = await res.text()
    const json = JSON.parse(text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, ''))
    return json.sig ?? ''
  } catch { return '' }
}

// 候補日付リストを生成（1月〜12月）
function generateDateCandidates(): string[] {
  const dates: string[] = []
  const monthDays = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= monthDays[m - 1]; d++) {
      dates.push(`${m}月${d}日`)
    }
  }
  return dates
}

// TRACKINGシートに存在する日付を全スキャン
async function scanTrackingDates(): Promise<string[]> {
  const defaultSig = await getTrackingSig()
  const candidates = generateDateCandidates()
  
  // 並列チェック（バッチ処理で負荷軽減）
  const BATCH = 20
  const existing: string[] = []
  for (let i = 0; i < candidates.length; i += BATCH) {
    const batch = candidates.slice(i, i + BATCH)
    const results = await Promise.all(
      batch.map(async date => {
        const sig = await getTrackingSig(date)
        return { date, exists: sig && sig !== defaultSig }
      })
    )
    results.forEach(r => { if (r.exists) existing.push(r.date) })
  }
  return existing
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const playerName = searchParams.get("playerName") ?? ""
  if (!playerName) return NextResponse.json([])

  try {
    const baseUrl = new URL(request.url).origin

    // 1. /api/stats から試合リストを取得（パッキングデータあり）
    const statsRes = await fetch(`${baseUrl}/api/stats`, { cache: "no-store" })
    const statsData = await statsRes.json()
    const statsDates = new Set<string>((statsData.matches ?? []).map((m: any) => m.date as string))
    const statsMatchMap = new Map<string, any>(
      (statsData.matches ?? []).map((m: any) => [m.date, m])
    )

    // 2. TRACKINGシートに存在する日付をスキャン
    const trackingDates = await scanTrackingDates()

    // 3. 全日付を合算（重複除去）
    const allDates = [...new Set([...statsDates, ...trackingDates])]

    // 4. 各日付の選手スタッツを並列取得
    const results = await Promise.all(
      allDates.map(async (date) => {
        try {
          const playerRes = await fetch(
            `${baseUrl}/api/player-stats?date=${encodeURIComponent(date)}`,
            { cache: "no-store" }
          )
          const players: any[] = await playerRes.json()
          const player = players.find((p: any) =>
            p.name === playerName ||
            p.name?.replace(/\s/g, "") === playerName?.replace(/\s/g, "")
          )
          if (!player) return null

          // 試合情報（stats APIにある場合はそちらを使用、ない場合はトラッキングのみ）
          const matchInfo = statsMatchMap.get(date)
          const gf = matchInfo?.goalsFor ?? 0
          const ga = matchInfo?.goalsAgainst ?? 0
          const resultLabel = gf > ga ? "勝" : gf < ga ? "負" : (matchInfo ? "分" : "-")
          const isTM = !matchInfo?.tournament || matchInfo.tournament.trim() === "" || matchInfo.tournament.toUpperCase() === "TM"
          const opponent = matchInfo?.opponent ?? ""
          const matchLabel = opponent
            ? `vs ${opponent} (${isTM ? "TM" : matchInfo.tournament})`
            : "(トレーニング)"
          const resultStr = matchInfo ? `${resultLabel} ${gf}-${ga}` : "-"

          return {
            date,
            match: matchLabel,
            result: resultStr,
            goals: player.goals ?? 0,
            assists: player.assists ?? 0,
            preAssists: player.preAssists ?? 0,
            minutes: player.time ? parseInt(player.time) : 0,
            packing: player.packing ?? 0,
            packingReceive: player.packingR ?? 0,
            impact: player.impact ?? 0,
            impactReceive: player.impactR ?? 0,
            hi: player.hi ?? 0,
            maxSpeed: player.maxSpeed ?? 0,
            distance: player.distance ?? 0,
            lineBreak: player.lineBreak ?? 0,
            sprint: player.sprint ?? 0,
          }
        } catch {
          return null
        }
      })
    )

    // null除去・日付順ソート
    const filtered = results
      .filter(Boolean)
      .sort((a: any, b: any) => {
        // 月日でソート
        const parseDate = (d: string) => {
          const m = d.match(/(\d+)月(\d+)日/)
          return m ? parseInt(m[1]) * 100 + parseInt(m[2]) : 0
        }
        return parseDate(a.date) - parseDate(b.date)
      })

    return NextResponse.json(filtered)
  } catch (e) {
    console.error(e)
    return NextResponse.json([])
  }
}
