"use client"

import { useEffect, useState } from "react"

type FeedbackRecord = {
  date: string
  from: string
  comment: string
  category: "technical" | "physical" | "mental" | "tactical"
}

type Props = {
  playerName: string
}

const categoryLabel: Record<string, string> = { technical: "技術", physical: "フィジカル", mental: "メンタル", tactical: "戦術" }
const categoryStyle: Record<string, string> = { technical: "bg-blue-500/15 text-blue-500", physical: "bg-green-500/15 text-green-500", mental: "bg-purple-500/15 text-purple-500", tactical: "bg-orange-500/15 text-orange-500" }

export function FeedbackHistory({ playerName }: Props) {
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!playerName) return
    setLoading(true)
    fetch(`/api/feedbacks?playerName=${encodeURIComponent(playerName)}`)
      .then(r => r.json())
      .then(data => setFeedbacks(Array.isArray(data) ? data : []))
      .catch(() => setFeedbacks([]))
      .finally(() => setLoading(false))
  }, [playerName])

  if (loading) return <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">読み込み中...</div>
  if (feedbacks.length === 0) return <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">フィードバックの記録はありません</div>

  return (
    <div className="space-y-2">
      {feedbacks.map((fb, i) => (
        <div key={i} className="rounded-lg p-3 bg-secondary/50 border border-border space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryStyle[fb.category] ?? "bg-secondary text-muted-foreground"}`}>
                {categoryLabel[fb.category] ?? fb.category}
              </span>
              <span className="text-sm font-medium text-card-foreground">{fb.from}</span>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{fb.date}</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{fb.comment}</p>
        </div>
      ))}
    </div>
  )
}
