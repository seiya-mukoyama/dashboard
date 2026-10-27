import { NextResponse } from "next/server"

export const revalidate = 300

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const playerName = searchParams.get("playerName") ?? ""
  if (!playerName) return NextResponse.json([])

  try {
    const baseUrl = new URL(request.url).origin

    // 1. /api/stats から試合リスト取得
    const statsRes = await fetch(`${baseUrl}/api/stats`, { cache: "no-store" })
    const statsData = await statsRes.json()
    const statsMatchMap = new Map<string, any>(
      (statsData.matches ?? []).map((m: any) => [m.date, m])
    )
    const statsDates = [...statsMatchMap.keys()]

    // 2. stats日付のみをplayer-statsに投げる（安定性のため候補を絞る）
    const allDates = statsDates

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
            p.name?.replace(/s/g, "") === playerName?.replace(/s/g, "")
          )
          if (!player) return null

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
            shoot: player.shoot ?? 0,
            xG: player.xG ?? null,
          }
        } catch { return null }
      })
    )

    const filtered = (results.filter(Boolean) as any[])
      .sort((a, b) => {
        const p = (d: string) => {
          const m = d.match(/(\d+)月(\d+)日/)
          return m ? +m[1] * 100 + +m[2] : 0
        }
        return p(a.date) - p(b.date)
      })

    return NextResponse.json(filtered)
  } catch (e) {
    console.error(e)
    return NextResponse.json([])
  }
}
