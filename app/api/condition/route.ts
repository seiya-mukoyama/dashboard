import { NextResponse } from "next/server"

const SHEET_ID = "1Cf9UCMrJDu6upu2n6LObRqfo8HxCCjtaikyHXssyvao"

// シーズン最高速度比ペーステージ
const SPD_TARGET = 95  // 週に1回は95%以上目標

// CSVパース
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n").map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim())
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.replace(/"/g, "").trim())
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = vals[i] ?? "" })
    return obj
  })
}

// 全シート名を取得（フィードバックシートの指紌 = 最初のシート名と同じ内容のシートを除外）
async function getDateSheets(): Promise<{ name: string; gid: string }[]> {
  // gviz APIで全シート一覧を取得
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=使い方`
  const refRes = await fetch(url, { cache: "no-store" })
  const refCSV = refRes.ok ? await refRes.text() : ""

  // 日付シートの一覧（YYYYMMDD 形式のシートのみ対象）
  // gvizはシート名をURLに含めることで取得可能
  // 複数シート名を探索するため、実際に8桁数字のシートを列挙
  // gidはスプレッドシートの履歴から取得するのが理想だが
  // 代替手段：sheet=名前でデータ取得を試み，内容がエラーなら除外
  return [{ name: "20260828", gid: "1011047146" }]
}

// シート名からCSV取得
async function fetchSheetCSV(sheetName: string): Promise<Record<string, string>[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return []
  const text = await res.text()
  return parseCSV(text)
}

// 全日付シートをスキャンして選手データを整理
async function getAllSessionData() {
  // 全シート名をgvizで抢える: 確認済みシートを順に試行
  const candidates: string[] = []
  // プロトコル: 複数シートの送信を並列化して結果をまとめる
  // まず最初のシート(使い方)CSVを取得し、それ以外のシート名を欲する
  // gvizは存在しないシート名を要求すると最初のシートを返す
  
  const firstUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=0`
  const firstRes = await fetch(firstUrl, { cache: "no-store" })
  const firstCSV = firstRes.ok ? await firstRes.text() : ""

  // YYYYMMDD形式のシート名を探索 (実際に複数年分を探索)
  const now = new Date()
  const year = now.getFullYear()
  // 2025年から現在までの年から日付シートを探索
  for (let y = 2025; y <= year + 1; y++) {
    for (let m = 1; m <= 12; m++) {
      // 月ごとにおおよその日数を探索
      for (let d = 1; d <= 31; d++) {
        const mm = String(m).padStart(2, '0')
        const dd = String(d).padStart(2, '0')
        candidates.push(`${y}${mm}${dd}`)
      }
    }
  }
  return { firstCSV, candidates }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const playerName = searchParams.get("player")

  try {
    // 実際に存在する日付シートを探索
    // 最初のシート(gid=0)の内容を基準CSVとして保存
    const firstUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=0`
    const firstRes = await fetch(firstUrl, { cache: "no-store" })
    const firstCSV = firstRes.ok ? await firstRes.text() : ""

    // YYYYMMDD形式のシートを探索
    // 最近の日付から順に探索し、データがあるシートを収集
    const now = new Date()
    const sessions: { date: string; players: Record<string, string>[] }[] = []

    // 過去3ヶ月分の日付を探索 (90日分)
    const promises: Promise<void>[] = []
    for (let daysAgo = 0; daysAgo < 90; daysAgo++) {
      const d = new Date(now)
      d.setDate(d.getDate() - daysAgo)
      const dateStr = d.getFullYear().toString() +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0')
      
      promises.push((async () => {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${dateStr}`
        const res = await fetch(url, { cache: "no-store" })
        if (!res.ok) return
        const csv = await res.text()
        // firstCSVと同じならシートが存在しない
        if (csv === firstCSV || !csv.trim()) return
        const rows = parseCSV(csv)
        if (rows.length === 0) return
        // Number列が数値かどうかでデータシートか判定
        if (!rows[0]["Number"] || isNaN(Number(rows[0]["Number"]))) return
        sessions.push({ date: dateStr, players: rows })
      })())
    }
    await Promise.all(promises)

    // 日付順にソート
    sessions.sort((a, b) => a.date.localeCompare(b.date))

    // ACWR計算: 各選手の負荷メトリクス（Distanceを使用）の推移を計算
    // 選手マップ: name -> [{date, distance, ...}]
    const playerHistory: Record<string, { date: string; distance: number; hi: number; si: number; sprint: number; accel: number; decel: number; spdRatio: number; hrMax: number; hrMid: number }[]> = {}
    
    for (const session of sessions) {
      for (const row of session.players) {
        const name = row["Name"]?.trim()
        if (!name) continue
        if (!playerHistory[name]) playerHistory[name] = []
        playerHistory[name].push({
          date: session.date,
          distance: parseFloat(row["Distance"]) || 0,
          hi: parseFloat(row["HI_D"]) || 0,
          si: parseFloat(row["SI_D"]) || 0,
          sprint: parseFloat(row["Sprint"]) || 0,
          accel: parseFloat(row["Accel_Z3"]) || 0,
          decel: parseFloat(row["Decel_Z3"]) || 0,
          spdRatio: parseFloat(row["SPD MX RATIO"]) || 0,
          hrMax: parseFloat(row["HR MAX"]) || 0,
          hrMid: parseFloat(row["HR MID"]) || 0,
        })
      }
    }

    // ACWR = 7日平均 / 28日平均
    function calcACWR(history: { date: string; distance: number }[], targetDate: string) {
      const idx = history.findIndex(h => h.date === targetDate)
      if (idx < 0) return null
      const slice7  = history.slice(Math.max(0, idx - 6), idx + 1)
      const slice28 = history.slice(Math.max(0, idx - 27), idx + 1)
      const acute   = slice7.reduce((s, h) => s + h.distance, 0) / 7
      const chronic = slice28.reduce((s, h) => s + h.distance, 0) / 28
      if (chronic === 0) return null
      return Math.round((acute / chronic) * 100) / 100
    }

    function acwrZone(acwr: number | null): string {
      if (acwr === null) return "unknown"
      if (acwr >= 1.5) return "over"
      if (acwr >= 1.3) return "caution"
      if (acwr >= 0.8) return "sweet"
      return "under"
    }

    // 最新セッションの選手一覧（信号機表示用）
    const latestSession = sessions[sessions.length - 1]
    const latestDate = latestSession?.date ?? ""

    const playerList = latestSession?.players.map(row => {
      const name = row["Name"]?.trim() ?? ""
      const history = playerHistory[name] ?? []
      const acwr = calcACWR(history.map(h => ({ date: h.date, distance: h.distance })), latestDate)
      const today = history.find(h => h.date === latestDate)
      return {
        number: row["Number"],
        name,
        date: latestDate,
        distance: today?.distance ?? 0,
        si: today?.si ?? 0,
        hi: today?.hi ?? 0,
        sprint: today?.sprint ?? 0,
        accel: today?.accel ?? 0,
        decel: today?.decel ?? 0,
        spdRatio: today?.spdRatio ?? 0,
        hrMax: today?.hrMax ?? 0,
        hrMid: today?.hrMid ?? 0,
        acwr,
        acwrZone: acwrZone(acwr),
      }
    }) ?? []

    // 各選手のACWR時系列
    const acwrTimeline: Record<string, { date: string; acwr: number | null; zone: string }[]> = {}
    for (const [name, history] of Object.entries(playerHistory)) {
      acwrTimeline[name] = history.map(h => {
        const acwr = calcACWR(history.map(x => ({ date: x.date, distance: x.distance })), h.date)
        return { date: h.date, acwr, zone: acwrZone(acwr) }
      })
    }

    return NextResponse.json({
      latestDate,
      sessions: sessions.map(s => s.date),
      players: playerList,
      acwrTimeline,
      spdTarget: SPD_TARGET,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ latestDate: "", sessions: [], players: [], acwrTimeline: {}, spdTarget: SPD_TARGET })
  }
}
