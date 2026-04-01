"use client"
import { useEffect, useState } from "react"
import { Play, X } from "lucide-react"

// 対応月一覧（将来的に追加するだけでタブが増える）
const MONTHS = ["2月"]

type FeedbackItem = {
  comment: string
  youtube: string
}

type Props = { playerName: string }

// YouTubeのURLからembedURLを生成
function toEmbedUrl(url: string): string | null {
  if (!url) return null
  // youtu.be/XXXX 形式
  const short = url.match(/youtu\.be\/([\w-]+)/)
  if (short) return `https://www.youtube.com/embed/${short[1]}`
  // watch?v=XXXX または &v=XXXX 形式
  const watch = url.match(/[?&]v=([\w-]+)/)
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`
  // /embed/ 形式はそのまま
  if (url.includes('/embed/')) return url
  return null
}

export function FeedbackHistory({ playerName }: Props) {
  const [activeMonth, setActiveMonth] = useState(MONTHS[0])
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ embedUrl: string } | null>(null)

  useEffect(() => {
    if (!playerName) return
    setLoading(true)
    // 全月を並列取得
    Promise.all(
      MONTHS.map(month =>
        fetch(`/api/feedback?playerName=${encodeURIComponent(playerName)}&month=${encodeURIComponent(month)}`)
          .then(r => r.json())
          .then((data: FeedbackItem[]) => ({ month, data: Array.isArray(data) ? data : [] }))
          .catch(() => ({ month, data: [] }))
      )
    ).then(results => {
      const map: Record<string, FeedbackItem[]> = {}
      results.forEach(({ month, data }) => { map[month] = data })
      setFeedbackMap(map)
    }).finally(() => setLoading(false))
  }, [playerName])

  if (loading) return (
    <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">読み込み中...</div>
  )

  const items = feedbackMap[activeMonth] ?? []

  return (
    <div className="space-y-3">
      {/* 月タブ */}
      {MONTHS.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          {MONTHS.map(m => (
            <button
              key={m}
              onClick={() => setActiveMonth(m)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                activeMonth === m
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {/* コメント一覧 */}
      {items.length === 0 ? (
        <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">
          フィードバックの記録はありません
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            const embedUrl = toEmbedUrl(item.youtube)
            return (
              <button
                key={i}
                onClick={() => embedUrl && setModal({ embedUrl })}
                className={`w-full text-left rounded-lg p-3 border transition-colors ${
                  embedUrl
                    ? 'bg-secondary/50 border-border hover:bg-secondary hover:border-primary/40 cursor-pointer'
                    : 'bg-secondary/50 border-border cursor-default'
                }`}
              >
                <div className="flex items-start gap-2">
                  {embedUrl && (
                    <div className="shrink-0 mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary">
                      <Play className="h-3 w-3 fill-current" />
                    </div>
                  )}
                  <p className="text-sm text-foreground leading-relaxed flex-1">
                    {item.comment || <span className="text-muted-foreground italic">（コメントなし）</span>}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* YouTubeモーダル */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setModal(null)}
        >
          <div
            className="relative w-full max-w-2xl mx-4 bg-black rounded-xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setModal(null)}
              className="absolute top-2 right-2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="aspect-video">
              <iframe
                src={modal.embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
