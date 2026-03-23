import { NextResponse } from "next/server"

const PACKING_SHEET_ID = "1i1PmWTCT_x73GlDHTes9lN-e956gKPfapdY_P_nK11g"
const PLAYERS_SHEET_ID = "1vnHF5iHJkirI6PhUzD3isKmdkz6Vani4aQfItMgL80k"
const TRACKING_SHEET_ID = "1FNxTC76yGGXbswZa5TTXTVDoSBvzh8gWiCsS-c7lvn4"
const POS_ORDER: Record<string, number> = { GK: 1, DF: 2, MF: 3, FW: 4 }

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

const SKIP_CATS = new Set(["相手","ボックス","被ボックス","クロス","被クロス",
  "エリア","被エリア","CK","被CK","FK","被FK"])

function extractNum(s: string): number {
  const m = s.match(/[\d.]+/)
  return m ? parseFloat(m[0]) : 0
}

function normName(s: string): string {
  return s.replace(/[\s\u3000]/g, "")
}

// gviz sigを取得（シート存在確認用）
async function getGvizSig(sheetId: string, sheetName?: string): Promise<string> {
  try {
    const url = sheetName
      ? `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`
      : `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`
    const res = await fetch(url, { cache: "no-store" })
    const text = await res.text()
    const json = JSON.parse(text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, ''))
    return json.sig ?? ''
  } catch { return '' }
}

// パッキングシートからデータ集計（gviz CSV方式、シート名指定）
async function fetchPackingBySheetName(
  sheetName: string,
  offset: number,
  defaultSig: string,
  stats: Record<string, PlayerStats>
): Promise<boolean> {
  const sig = await getGvizSig(PACKING_SHEET_ID, sheetName)
  if (!sig) return false

  let csvUrl: string
  if (sig !== defaultSig) {
    // 別シートが存在
    csvUrl = `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
  } else {
    // sigが一致 → 最初のシートと同じ可能性
    // 後半シートが存在するか確認して前半が最初のシートかどうか判断
    // ここでは offset=0（前半）の場合のみデフォルトCSVを使う
    if (offset === 0) {
      // 後半シートの存在を確認してから判断（呼び出し元で確認済みのはず）
      csvUrl = `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/gviz/tq?tqx=out:csv`
    } else {
      return false
    }
  }

  const res = await fetch(csvUrl, { cache: "no-store" })
  if (!res.ok) return false
  const csv = await res.text()
  if (!csv.trim()) return false

  const rows = csv.split("\n").slice(1).map(parseCSVLine)
  let hasData = false

  rows.forEach(cols => {
    const cat = cols[1]?.trim()
    if (!cat || SKIP_CATS.has(cat)) return
    const p = getOrCreate(cat, stats)
    hasData = true
    for (let i = 6; i < cols.length; i++) {
      const d = cols[i]?.trim(); if (!d) continue
      if (/^P [\d.]+/.test(d) || /^Packing [\d.]+/.test(d)) p.packing += extractNum(d)
      if (/^I [\d.]+/.test(d) || /^Impect [\d.]+/.test(d)) p.impact += extractNum(d)
      const resMatch = d.match(/^(.+?) Res$/)
      if (resMatch) {
        const rec = getOrCreate(resMatch[1].split(/[\s\u3000]/)[0], stats)
        for (let j = i + 1; j < Math.min(i + 4, cols.length); j++) {
          const next = cols[j]?.trim(); if (!next) continue
          if (/^Packing [\d.]+/.test(next)) rec.packingR += extractNum(next)
          if (/^Impect [\d.]+/.test(next)) rec.impactR += extractNum(next)
        }
      }
    }
  })
  return hasData
}

type PlayerStats = {
  lastName: string; fullName: string; pos: string
  packing: number; packingR: number; impact: number; impactR: number
  distance: number | null; maxSpeed: number | null; hi: number | null; sprint: number | null; time: string | null; lineBreak: number | null
}

let lastNameMapCache: Record<string, { fullName: string; pos: string }> | null = null

function getOrCreate(lastName: string, stats: Record<string, PlayerStats>): PlayerStats {
  if (!stats[lastName]) {
    const info = lastNameMapCache?.[lastName] ?? { fullName: lastName, pos: "-" }
    stats[lastName] = { lastName, fullName: info.fullName, pos: info.pos, packing: 0, packingR: 0, impact: 0, impactR: 0, distance: null, maxSpeed: null, hi: null, sprint: null, time: null, lineBreak: null }
  }
  return stats[lastName]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date") ?? ""

  try {
    // 選手一覧（姓→フルネーム・ポジション）
    const playersRes = await fetch(`https://docs.google.com/spreadsheets/d/${PLAYERS_SHEET_ID}/export?format=csv&gid=0`, { cache: "no-store" })
    const playersCsv = await playersRes.text()
    const lastNameMap: Record<string, { fullName: string; pos: string }> = {}
    playersCsv.split("\n").slice(1).forEach(line => {
      const cols = parseCSVLine(line)
      const fullName = cols[1]?.trim(); const pos = cols[3]?.trim()
      if (!fullName || !pos) return
      const lastName = fullName.split(/[\s\u3000]/)[0]
      if (lastName) lastNameMap[lastName] = { fullName, pos }
      lastNameMap[fullName] = { fullName, pos }
    })
    lastNameMapCache = lastNameMap

    const stats: Record<string, PlayerStats> = {}

    // パッキングデータ集計
    // dateが指定された場合: その試合日のシートを使う（timelineと同じgviz sig方式）
    // dateが未指定の場合: 全シート（フォールバック）
    if (date) {
      const defaultSig = await getGvizSig(PACKING_SHEET_ID)
      const firstHalfName  = `${date}前半`
      const secondHalfName = `${date}後半`

      // 後半シートの存在確認
      const secondSig = await getGvizSig(PACKING_SHEET_ID, secondHalfName)
      const hasSecondSheet = secondSig && secondSig !== defaultSig

      // 前半シートの処理
      const firstSig = await getGvizSig(PACKING_SHEET_ID, firstHalfName)
      if (firstSig && firstSig !== defaultSig) {
        // 別シートとして存在
        await fetchPackingBySheetName(firstHalfName, 0, defaultSig, stats)
      } else if (firstSig === defaultSig && hasSecondSheet) {
        // 前半が最初のシート（デフォルトと一致するが後半が存在するので有効）
        await fetchPackingBySheetName(firstHalfName, 0, defaultSig, stats)
      }

      // 後半シートの処理
      if (hasSecondSheet) {
        await fetchPackingBySheetName(secondHalfName, 0, defaultSig, stats) // offset=0（累積しない）
      }
    } else {
      // date未指定: 全選手の累積（従来通り最初の2シート）
      const defaultSig = await getGvizSig(PACKING_SHEET_ID)
      // gvizデフォルト（最初のシート）
      const csvUrl = `https://docs.google.com/spreadsheets/d/${PACKING_SHEET_ID}/gviz/tq?tqx=out:csv`
      const res = await fetch(csvUrl, { cache: "no-store" })
      if (res.ok) {
        const csv = await res.text()
        csv.split("\n").slice(1).map(parseCSVLine).forEach(cols => {
          const cat = cols[1]?.trim(); if (!cat || SKIP_CATS.has(cat)) return
          const p = getOrCreate(cat, stats)
          for (let i = 6; i < cols.length; i++) {
            const d = cols[i]?.trim(); if (!d) continue
            if (/^P [\d.]+/.test(d) || /^Packing [\d.]+/.test(d)) p.packing += extractNum(d)
            if (/^I [\d.]+/.test(d) || /^Impect [\d.]+/.test(d)) p.impact += extractNum(d)
            const resMatch = d.match(/^(.+?) Res$/)
            if (resMatch) {
              const rec = getOrCreate(resMatch[1].split(/[\s\u3000]/)[0], stats)
              for (let j = i + 1; j < Math.min(i + 4, cols.length); j++) {
                const next = cols[j]?.trim(); if (!next) continue
                if (/^Packing [\d.]+/.test(next)) rec.packingR += extractNum(next)
                if (/^Impect [\d.]+/.test(next)) rec.impactR += extractNum(next)
              }
            }
          }
        })
      }
    }

    // トラッキングデータ（試合日が指定されている場合のみ）
    if (date) {
      try {
        // シート名でgviz CSV取得を試みる
        // 失敗したら gid で export CSV にフォールバック
        const sheetCsvUrl = `https://docs.google.com/spreadsheets/d/${TRACKING_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(date)}`
        let csvText = ''
        const r1 = await fetch(sheetCsvUrl, { cache: "no-store" })
        if (r1.ok) {
          const t = await r1.text()
          // gvizが正しいシートを返しているか確認（ヘッダー行にNAMEが含まれる）
          if (t.toLowerCase().includes('name')) {
            csvText = t
          }
        }
        if (!csvText) {
          // フォールバック：export CSV でシートGIDを直接指定
          // TRACKING_SHEET_IDに対して、gidをシート名から検索
          // まずgviz jsonでシートのgidを取得
          const gvizJsonUrl = `https://docs.google.com/spreadsheets/d/${TRACKING_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(date)}&tq=SELECT+1+LIMIT+0`
          const jr = await fetch(gvizJsonUrl, { cache: "no-store" })
          const jt = await jr.text()
          const gidMatch = jt.match(/"gid":"?(d+)"?/)
          const gid = gidMatch?.[1]
          if (gid) {
            const exportUrl = `https://docs.google.com/spreadsheets/d/${TRACKING_SHEET_ID}/export?format=csv&gid=${gid}`
            const r2 = await fetch(exportUrl, { cache: "no-store" })
            if (r2.ok) csvText = await r2.text()
          }
        }
        if (csvText) {
          const rows = csvText.split("\n").map(parseCSVLine)
          const header = rows[0].map(h => h.toLowerCase().replace(/[_\s]/g, ''))
          const idxName    = header.findIndex(h => h === 'name')
          const idxDist    = header.findIndex(h => h.includes('distance') || h === 'dist')
          const idxSpeed   = header.findIndex(h => h.includes('spdmx'))
          const idxHI      = header.findIndex(h => h.includes('hi') && h.includes('%'))
          const idxSprint  = header.findIndex(h => h === 'sprint')
          const idxTime    = header.findIndex(h => h === 'time')
          const idxLineBreak = header.findIndex(h => h === 'linebreak' || h === 'lb')

          rows.slice(1).forEach(cols => {
            const rawName = cols[idxName]?.trim(); if (!rawName) return
            const normRaw = normName(rawName)
            const matched = Object.values(stats).find(s => normName(s.fullName) === normRaw)
            if (!matched) return
            if (idxDist >= 0) matched.distance = Math.round(parseFloat(cols[idxDist]) || 0) || null
            if (idxSpeed >= 0) matched.maxSpeed = parseFloat(cols[idxSpeed]) || null
            if (idxHI >= 0) matched.hi = parseFloat(cols[idxHI]) || null
            if (idxSprint >= 0) {
              const sv = cols[idxSprint]?.trim()
              matched.sprint = (sv !== "" && sv != null) ? (parseInt(sv) ?? null) : null
            }
            if (idxTime >= 0) {
              const tv = cols[idxTime]?.trim()
              matched.time = (tv && tv !== "") ? tv : null
            }
              if (idxLineBreak >= 0) {
                const lv = cols[idxLineBreak]?.trim()
                matched.lineBreak = (lv && lv !== "") ? (parseInt(lv) ?? null) : null
              }
          })
        }
      } catch { /* ignore */ }
    }

    const round1 = (v: number) => Math.round(v * 10) / 10
    const result = Object.values(stats)
      .map(s => ({
        name: s.fullName, pos: s.pos,
        packing: round1(s.packing), packingR: round1(s.packingR),
        impact: round1(s.impact), impactR: round1(s.impactR),
        distance: s.distance, maxSpeed: s.maxSpeed, hi: s.hi, sprint: s.sprint, time: s.time, lineBreak: s.lineBreak,
      }))
      .sort((a, b) => {
        const pa = POS_ORDER[a.pos] ?? 9, pb = POS_ORDER[b.pos] ?? 9
        return pa !== pb ? pa - pb : b.packing - a.packing
      })

    return NextResponse.json(result)
  } catch (e) {
    console.error(e)
    return NextResponse.json([])
  }
}
