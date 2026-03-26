import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const playerName = searchParams.get("playerName") ?? ""
  if (!playerName) return NextResponse.json([])

  try {
    const baseUrl = new URL(request.url).origin
    const statsRes = await fetch(`${baseUrl}/api/stats`, { cache: "no-store" })
    const statsData = await statsRes.json()
    const matches: any[] = statsData.matches ?? []

    const results = await Promise.all(
      matches.map(async (m: any) => {
        try {
          const playerRes = await fetch(
            `${baseUrl}/api/player-stats?date=${encodeURIComponent(m.date)}`,
            { cache: "no-store" }
          )
          const players: any[] = await playerRes.json()
          const player = players.find((p: any) =>
            p.name === playerName ||
            p.name?.replace(/\s/g, "") === playerName?.replace(/\s/g, "")
          )
          if (!player) return null

          const gf = m.goalsFor ?? 0
          const ga = m.goalsAgainst ?? 0
          const resultLabel = gf > ga ? "勝" : gf < ga ? "負" : "分"
          const isTM = !m.tournament || m.tournament.trim() === "" || m.tournament.toUpperCase() === "TM"
          const matchLabel = `vs ${m.opponent} (${isTM ? "TM" : m.tournament})`

          return {
            date: m.date,
            match: matchLabel,
            result: `${resultLabel} ${gf}-${ga}`,
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

    return NextResponse.json(results.filter(Boolean))
  } catch (e) {
    console.error(e)
    return NextResponse.json([])
  }
}
