import { NextResponse } from "next/server"

const LOGIN_URL = "https://members-api.know-s.com/webapp/login"
const STATS_URL = "https://members-api.know-s.com/webapp/team/acwr"

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
    // 1. ログイン → Cookie + JWT トークン両方取得
    const loginRes = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      redirect: "follow",
    })
    if (!loginRes.ok) {
      return NextResponse.json({ error: "Login failed", status: loginRes.status }, { status: 401 })
    }

    // Cookie を取得（セッション維持に必要）
    const rawCookie = loginRes.headers.get("set-cookie") ?? ""
    // 複数cookieをまとめる（カンマで複数来る場合がある）
    const cookies = rawCookie
      .split(/,(?=[^ ])/)
      .map(c => c.split(";")[0].trim())
      .filter(Boolean)
      .join("; ")

    // JWTトークン
    const loginBody = await loginRes.json()
    const token = loginBody?.result?.token ?? ""

    // 2. スタッツ取得（Cookie + Bearer 両方送る）
    const { stdate, eddate } = getDateRange()
    const columns = ["dist", "sprt", "hi_rate", "accel_all", "decel_all", "dist_per_min"]
    const params = new URLSearchParams({ stdate, eddate })
    columns.forEach(c => params.append("columns[]", c))

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (token) headers["Authorization"] = `Bearer ${token}`
    if (cookies) headers["Cookie"] = cookies

    const statsRes = await fetch(`${STATS_URL}?${params.toString()}`, { headers })

    if (!statsRes.ok) {
      const errText = await statsRes.text().catch(() => "")
      return NextResponse.json({
        error: "Stats fetch failed",
        status: statsRes.status,
        detail: errText.substring(0, 200),
        usedCookie: !!cookies,
        usedToken: !!token,
        url: `${STATS_URL}?${params.toString()}`,
      }, { status: 502 })
    }

    const data = await statsRes.json()

    // データ構造を確認（生データも返してデバッグ）
    const rows: Record<string, number | string>[] =
      data?.data ?? data?.rows ?? (Array.isArray(data) ? data : [])
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
