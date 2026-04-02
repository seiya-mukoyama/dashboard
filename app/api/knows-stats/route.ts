import { NextResponse } from "next/server"

const API_BASE = "https://members-api.know-s.com/webapp"
const LOGIN_URL = `${API_BASE}/login`
const STATS_URL = `${API_BASE}/team/acwr`

// 直近30日の日付範囲を生成
function getDateRange() {
  const now = new Date()
  const ed = now.toISOString().split('T')[0]
  const st = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  return { stdate: st, eddate: ed }
}

export async function GET() {
  const email = process.env.KNOWS_EMAIL
  const password = process.env.KNOWS_PASSWORD

  if (!email || !password) {
    return NextResponse.json({ error: "KNOWS credentials not set" }, { status: 500 })
  }

  try {
    // 1. ログイン
    const loginRes = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!loginRes.ok) {
      return NextResponse.json({ error: "Login failed" }, { status: 401 })
    }

    // Set-Cookie ヘッダーからセッションCookieを取得
    const cookies = loginRes.headers.get("set-cookie") ?? ""
    const sessionCookie = cookies.split(";")[0] // 最初のCookie値

    // 2. スタッツ取得
    const { stdate, eddate } = getDateRange()
    const params = new URLSearchParams()
    params.set("stdate", stdate)
    params.set("eddate", eddate)
    // 6項目
    const columns = ["dist", "sprt", "hi_rate", "accel_all", "decel_all", "dist_per_min"]
    columns.forEach(c => params.append("columns[]", c))

    const statsRes = await fetch(`${STATS_URL}?${params.toString()}`, {
      headers: { Cookie: sessionCookie },
    })

    if (!statsRes.ok) {
      return NextResponse.json({ error: "Stats fetch failed", status: statsRes.status }, { status: 502 })
    }

    const data = await statsRes.json()

    // 最新日のデータを抽出してシンプルに返す
    // dataはACWRの時系列。最新の平均値 or 直近のラウンド値を返す
    return NextResponse.json({ raw: data, stdate, eddate })

  } catch (e) {
    console.error("knows-stats error:", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
