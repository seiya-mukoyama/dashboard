"use client"
import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
type InjuryRecord = { date: string; type: string; duration: string; status: "recovering" | "recovered" }
type Props = { playerName: string }
export function InjuryHistory({ playerName }: Props) {
  const [injuries, setInjuries] = useState<InjuryRecord[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!playerName) return
    setLoading(true)
    fetch(`/api/injuries?playerName=${encodeURIComponent(playerName)}`)
      .then(r => r.json()).then(data => setInjuries(Array.isArray(data) ? data : []))
      .catch(() => setInjuries([])).finally(() => setLoading(false))
  }, [playerName])
  if (loading) return <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">読み込み中...</div>
  if (injuries.length === 0) return <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">怪我の記録はありません</div>
  return (
    <div className="space-y-2">
      {injuries.map((injury, i) => (
        <div key={i} className={`flex items-start justify-between rounded-lg p-3 gap-3 ${injury.status === "recovering" ? "bg-destructive/10 border border-destructive/20" : "bg-secondary/50 border border-border"}`}>
          <div className="flex items-start gap-2">
            <div className={`mt-0.5 rounded-full p-1 ${injury.status === "recovering" ? "bg-destructive/20" : "bg-primary/10"}`}>
              <AlertTriangle className={`h-3 w-3 ${injury.status === "recovering" ? "text-destructive" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-card-foreground">{injury.type}</p>
              <p className="text-xs text-muted-foreground">{injury.date} · {injury.duration}</p>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${injury.status === "recovering" ? "bg-destructive/20 text-destructive" : "bg-primary/10 text-primary"}`}>
            {injury.status === "recovering" ? "回復中" : "完治"}
          </span>
        </div>
      ))}
    </div>
  )
}