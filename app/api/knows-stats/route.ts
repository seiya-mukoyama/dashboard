import { NextResponse } from "next/server"

const LOGIN_URL = "https://members-api.know-s.com/webapp/login"
const STATS_URL = "https://members-api.know-s.com/webapp/team/acwr"

// 直近30日の日付範囲
function getDateRange() {
  const now = new Date()
  const ed = now.toISOString().slice(0, 10)
  const st = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  return { stdate: st, eddate: ed }
}

export async function GET() {
  const email    = process.env.KNOWS_EMAIL    ?? ""
  const password = process.env.KNOWS_PASSWORD ?? ""

  if (!email || !password) {
    return NextResponse.json({ error: "KNOWS credentials not set" }, { status: 500 })
  }

  try {
    // 1. ログイン → JWTトークン取得
    const loginRes = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!loginRes.ok) {
      return NextResponse.json({ error: "Login failed", status: loginRes.status }, { status: 401 })
    }
    const loginData = await loginRes.json()
    const token = loginData?.result?.token
    if (!token) {
      return NextResponse.json({ error: "Token not found in login response" }, { status: 401 })
    }

    // 2. スタッツ取得（Authorization: Bearer TOKEN）
    const { stdate, eddate } = getDateRange()
    const columns = ["dist", "sprt", "hi_rate", "accel_all", "decel_all", "dist_per_min"]
    const params = new URLSearchParams({ stdate, eddate })
    columns.forEach(c => params.append("columns[]", c))

    const statsRes = await fetch(`${STATS_URL}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    if (!statsRes.ok) {
      const errText = await statsRes.text().catch(() => "")
      return NextResponse.json({ error: "Stats fetch failed", status: statsRes.status, detail: errText }, { status: 502 })
    }

    const data = await statsRes.json()

    // 3. データ構造を確認してlatestを抽出
    // APIレスポンス形式を確認するため全体を返す
    const rows: Record<string, number | string>[] = data?.data ?? data?.rows ?? (Array.isArray(data) ? data : [])
    const latest = rows.length > 0 ? rows[rows.length - 1] : null

    return NextResponse.json({
      latest,
      rows,
      range: { stdate, eddate },
      _raw_keys: data ? Object.keys(data) : [],
    })
  } catch (e) {
    console.error("knows-stats error:", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
