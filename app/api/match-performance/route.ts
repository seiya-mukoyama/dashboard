import { NextResponse } from "next/server"

const PACKING_SHEET_ID = "1i1PmWTCT_x73GlDHTes9lN-e956gKPfapdY_P_nK11g"

async function getPackingSig(sheetName?: string): Promise<string> {
  try {
    const url = sheetName
      ? `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`
      : `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/gviz/tq?tqx=out:json`
    const res = await fetch(url, { cache: "no-store" })
    const t = await res.text()
    const json = JSON.parse(t.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, ''))
    return json.sig ?? ''
  } catch { return '' }
}

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

    // 2. PACKINGシートのdefaultSigを取得
    const defaultSig = await getPackingSig()

    // 3. stats日付のうち前半シートが存在するものを確認（並列）
    // + stats にない日付を見つけるため「stats日×2」程度の追加候補をスキャン
    // 追加候補: stats日付の前後含む今シーズン全体
    // → stats日付のみを並列チェックして「前半シートあり=パッキングデータあり」
    //   さらに stats にない日付は PACKINGシートをスキャン
    //   スキャン範囲は stats 日付の最小月〜最大月の全日付に限定
    
    // stats日付から月の範囲を求める
    const months = new Set<number>()
    statsDates.forEach(date => {
      const m = date.match(/^(\d+)月/)
      if (m) months.add(parseInt(m[1]))
    })
    // 月範囲をカバーする全日付候補（+前後1ヶ月）
    const monthArr = [...months].sort((a, b) => a - b)
    const minMonth = Math.max(1, (monthArr[0] ?? 1) - 1)
    const maxMonth = Math.min(12, (monthArr[monthArr.length - 1] ?? 3) + 1)
    const additionalCandidates: string[] = []
    const monthDays = [31,29,31,30,31,30,31,31,30,31,30,31]
    for (let m = minMonth; m <= maxMonth; m++) {
      for (let d = 1; d <= monthDays[m-1]; d++) {
        const date = `${m}月${d}日`
        if (!statsMatchMap.has(date)) additionalCandidates.push(date)
      }
    }

    // 4. stats日付 + 追加候補を並列sigチェック（バッチ20件）
    const allCandidates = [...statsDates, ...additionalCandidates]
    const existingDates: string[] = []
    const BATCH = 20
    for (let i = 0; i < allCandidates.length; i += BATCH) {
      const batch = allCandidates.slice(i, i + BATCH)
      const results = await Promise.all(
        batch.map(async date => {
          const sig = await getPackingSig(`${date}前半`)
          return { date, exists: !!sig && sig !== defaultSig }
        })
      )
      results.forEach(r => { if (r.exists) existingDates.push(r.date) })
    }

    // 5. 各日付の選手スタッツを並列取得
    const results = await Promise.all(
      existingDates.map(async (date) => {
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
        } catch { return null }
      })
    )

    const filtered = (results.filter(Boolean) as any[])
      .sort((a, b) => {
        const p = (d: string) => { const m = d.match(/(\d+)月(\d+)日/); return m ? +m[1]*100 + +m[2] : 0 }
        return p(a.date) - p(b.date)
      })

    return NextResponse.json(filtered)
  } catch (e) {
    console.error(e)
    return NextResponse.json([])
  }
}
