import { NextResponse } from "next/server"

const PACKING_SHEET_ID = "1i1PmWTCT_x73GlDHTes9lN-e956gKPfapdY_P_nK11g"

function parseCSVLine(line: string): string[] {
  const cols: string[] = []; let cur = ""; let inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = "" }
    else { cur += ch }
  }
  cols.push(cur.trim())
  return cols
}

function toMinutes(t: string): number | null {
  const s = t.replace(/"/g, '').trim()
  if (!s) return null
  const parts = s.split(':')
  if (parts.length >= 2) return parseInt(parts[0]) + parseInt(parts[1]) / 60
  return null
}

function extractNum(s: string): number {
  const m = s.match(/[\d.]+/)
  return m ? parseFloat(m[0]) : 0
}

// htmlviewからgid一覧を取得（サーバー側はCookie不要でアクセス可能）
async function getGidsFromHtmlView(): Promise<string[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/htmlview`
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0" }
    })
    if (!res.ok) return []
    const html = await res.text()
    // gid=NUMBERパターンを全て抽出（重複除去）
    const matches = [...new Set(
      [...html.matchAll(/[?&]gid=(\d+)/g)].map(m => m[1])
    )]
    return matches
  } catch {
    return []
  }
}

// gidのCSVを取得してシート名（日付+前後半）を判定
// シート名はCSV内のA1セル（前半/後半）とシート外部から判断できないが、
// htmlviewから取得できたgidを全部試して日付にマッチするものを探す
async function fetchByGid(
  gid: string, offset: number,
  vP: number[], vI: number[], oP: number[], oI: number[]
): Promise<{ hasData: boolean; half: string }> {
  const url = `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/export?format=csv&gid=${gid}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return { hasData: false, half: '' }
  const csv = await res.text()
  if (!csv.trim()) return { hasData: false, half: '' }

  const allRows = csv.split("\n").map(parseCSVLine)
  const a1 = allRows[0]?.[0]?.trim() ?? ''
  const half = a1 === '後半' ? '後半' : a1 === '前半' ? '前半' : ''
  if (!half) return { hasData: false, half: '' }

  const rows = allRows.slice(1)
  let hasData = false

  rows.forEach(cols => {
    const cat   = cols[1]?.trim()
    const click = cols[3]?.trim()
    if (!cat || !click) return
    const min = toMinutes(click)
    if (min === null) return
    const isOpp = cat === '相手'
    const lb = Math.floor(min / 5)
    if (lb < 0 || lb >= 9) return
    const bucket = lb + offset
    hasData = true
    for (let i = 6; i < cols.length; i++) {
      const d = cols[i]?.trim()
      if (!d) continue
      if (/^P [\d.]+/.test(d) || /^Packing [\d.]+/.test(d)) {
        const pts = extractNum(d)
        if (isOpp) oP[bucket] += pts; else vP[bucket] += pts
      }
      if (/^I [\d.]+/.test(d) || /^Impect [\d.]+/.test(d)) {
        const pts = extractNum(d)
        if (isOpp) oI[bucket] += pts; else vI[bucket] += pts
      }
    }
  })
  return { hasData, half }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date") ?? ""

  if (!date) {
    return NextResponse.json({ labels: [], vonds: { packing: [], impact: [] }, opp: { packing: [], impact: [] }, noData: true })
  }

  try {
    const BUCKETS = 18
    const vPacking = new Array(BUCKETS).fill(0)
    const vImpact  = new Array(BUCKETS).fill(0)
    const oPacking = new Array(BUCKETS).fill(0)
    const oImpact  = new Array(BUCKETS).fill(0)

    // gvizのシート名指定でシート名前方一致を利用
    // ただし最初のシートと同じ行数の場合の問題を回避するため
    // htmlviewからgidリストを取得してexport?format=csv&gid=Xで取得する方式に変更

    const gids = await getGidsFromHtmlView()

    // gid=0も追加（htmlviewに含まれない場合のため）
    const allGids = [...new Set(['0', ...gids])]

    let hasFirst = false
    let hasSecond = false

    // 各gidのシートを確認してdateにマッチするものだけ集計
    // ただし同じ日付のシートが複数ある場合は前半・後半で振り分け
    // → 問題: gidだけではシート名（日付）がわからない
    // → 解決: htmlviewのHTMLにシート名とgidの対応が含まれているはず
    //   それが取得できなかった場合は全シートを試して
    //   「前半」or「後半」のシートのうち、行数がデフォルトと異なるものを選ぶ
    
    // htmlviewからgidとシート名のマッピングを取得する試み
    let gidNameMap: Record<string, string> = {}
    try {
      const htmlRes = await fetch(
        `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/htmlview`,
        { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0" } }
      )
      if (htmlRes.ok) {
        const html = await htmlRes.text()
        // パターン1: id="sheet-button-{gid}" の直後のテキスト
        const re1 = /id="sheet-button-(\d+)"[^>]*>\s*([^<]+)</g
        let m
        while ((m = re1.exec(html)) !== null) {
          gidNameMap[m[1]] = m[2].trim()
        }
        // パターン2: #gid={gid} の近くのシート名
        if (Object.keys(gidNameMap).length === 0) {
          const re2 = /#gid=(\d+)[^"]*"[^>]*>([^<]+月[^<]+)</g
          while ((m = re2.exec(html)) !== null) {
            gidNameMap[m[1]] = m[2].trim()
          }
        }
      }
    } catch {
      // htmlview取得失敗は無視
    }

    if (Object.keys(gidNameMap).length > 0) {
      // gidとシート名のマッピングが取得できた場合
      for (const [gid, name] of Object.entries(gidNameMap)) {
        if (!name.startsWith(date)) continue
        const isFirst = name.includes('前半')
        const isSecond = name.includes('後半')
        if (!isFirst && !isSecond) continue
        const offset = isSecond ? 9 : 0
        const { hasData } = await fetchByGid(gid, offset, vPacking, vImpact, oPacking, oImpact)
        if (hasData) {
          if (isFirst) hasFirst = true
          else hasSecond = true
        }
      }
    } else {
      // フォールバック: gvizシート名指定 + 行数比較
      const gvizDefault = await fetch(
        `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/gviz/tq?tqx=out:csv`,
        { cache: "no-store" }
      ).then(r => r.text()).catch(() => '')
      const defaultRows = gvizDefault.split('\n').length

      for (const half of ['前半', '後半'] as const) {
        const sheetName = `${date}${half}`
        const csv = await fetch(
          `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`,
          { cache: "no-store" }
        ).then(r => r.text()).catch(() => '')

        if (!csv.trim()) continue

        const offset = half === '後半' ? 9 : 0
        const csvRows = csv.split('\n').length

        // 行数がデフォルトと異なる → 別のシート（存在する）
        // 行数がデフォルトと同じ → 最初のシートと同じ可能性
        //   → でも「前半が最初のシート」の場合はこれが正しいデータ
        //   → A1が「前半」かつdateに対応するシートが最初のシートである場合を処理
        if (csvRows !== defaultRows) {
          // 明らかに別のシート
          const rows = csv.split('\n').slice(1).map(parseCSVLine)
          let hasData = false
          rows.forEach(cols => {
            const cat = cols[1]?.trim(); const click = cols[3]?.trim()
            if (!cat || !click) return
            const min = toMinutes(click); if (min === null) return
            const isOpp = cat === '相手'
            const lb = Math.floor(min / 5); if (lb < 0 || lb >= 9) return
            const bucket = lb + offset; hasData = true
            for (let i = 6; i < cols.length; i++) {
              const d = cols[i]?.trim(); if (!d) continue
              if (/^P [\d.]+/.test(d) || /^Packing [\d.]+/.test(d)) { const pts = extractNum(d); if (isOpp) oPacking[bucket] += pts; else vPacking[bucket] += pts }
              if (/^I [\d.]+/.test(d) || /^Impect [\d.]+/.test(d)) { const pts = extractNum(d); if (isOpp) oImpact[bucket] += pts; else vImpact[bucket] += pts }
            }
          })
          if (hasData) { if (half === '前半') hasFirst = true; else hasSecond = true }
        } else if (half === '前半') {
          // 前半がデフォルトと同じ行数 = 前半が最初のシートの可能性
          // gvizのデフォルト = gvizの前半 = 最初のシート = 前半データ → そのまま使う
          const rows = csv.split('\n').slice(1).map(parseCSVLine)
          // 実際にdateに関連するデータか確認（シートのA1が「前半」か）
          const a1 = csv.split('\n')[0]?.split(',')[0]?.replace(/"/g, '').trim()
          if (a1 === '前半') {
            let hasData = false
            rows.forEach(cols => {
              const cat = cols[1]?.trim(); const click = cols[3]?.trim()
              if (!cat || !click) return
              const min = toMinutes(click); if (min === null) return
              const isOpp = cat === '相手'
              const lb = Math.floor(min / 5); if (lb < 0 || lb >= 9) return
              hasData = true
              for (let i = 6; i < cols.length; i++) {
                const d = cols[i]?.trim(); if (!d) continue
                if (/^P [\d.]+/.test(d) || /^Packing [\d.]+/.test(d)) { const pts = extractNum(d); if (isOpp) oPacking[lb] += pts; else vPacking[lb] += pts }
                if (/^I [\d.]+/.test(d) || /^Impect [\d.]+/.test(d)) { const pts = extractNum(d); if (isOpp) oImpact[lb] += pts; else vImpact[lb] += pts }
              }
            })
            if (hasData) hasFirst = true
          }
        }
      }
    }

    if (!hasFirst && !hasSecond) {
      return NextResponse.json({ labels: [], vonds: { packing: [], impact: [] }, opp: { packing: [], impact: [] }, noData: true })
    }

    const cumSum = (arr: number[]) => {
      let acc = 0
      return arr.map(v => { acc += v; return Math.round(acc * 10) / 10 })
    }

    const lastBucket = Math.max(
      vPacking.findLastIndex(v => v > 0),
      oPacking.findLastIndex(v => v > 0)
    )
    if (lastBucket < 0) return NextResponse.json({ labels: [], vonds: { packing: [], impact: [] }, opp: { packing: [], impact: [] }, noData: true })

    const maxBucket = Math.min(lastBucket + 1, BUCKETS)
    const cumV  = cumSum(vPacking).slice(0, maxBucket)
    const cumVI = cumSum(vImpact).slice(0, maxBucket)
    const cumO  = cumSum(oPacking).slice(0, maxBucket)
    const cumOI = cumSum(oImpact).slice(0, maxBucket)

    const labels: string[] = Array.from({ length: maxBucket }, (_, i) => `${i * 5}-${(i + 1) * 5}`)
    const exLabel = hasSecond ? "90-EX" : "45-EX"
    labels.push(exLabel)
    cumV.push(cumV[cumV.length - 1] ?? 0)
    cumVI.push(cumVI[cumVI.length - 1] ?? 0)
    cumO.push(cumO[cumO.length - 1] ?? 0)
    cumOI.push(cumOI[cumOI.length - 1] ?? 0)

    return NextResponse.json({ labels, vonds: { packing: cumV, impact: cumVI }, opp: { packing: cumO, impact: cumOI } })
  } catch {
    return NextResponse.json({ error: "error" }, { status: 500 })
  }
}