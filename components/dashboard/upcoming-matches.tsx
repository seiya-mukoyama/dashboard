"use client" // height fix

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin } from "lucide-react"

type Match = {
  date: string; time: string; round: string; competition: string
  home: string; away: string; score: string | null
  isHome: boolean; venue: string; hasResult: boolean
}

export function UpcomingMatches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/schedule')
      .then(r => r.json())
      .then(d => setMatches((d.upcoming ?? []).slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-card-foreground">今後5試合の予定</CardTitle>
      </CardHeader>
      <CardContent className="pb-[34px]">
        {loading ? (
          <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">読み込み中...</div>
        ) : matches.length === 0 ? (
          <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">予定データがありません</div>
        ) : (
          <div className="space-y-2">
            {matches.map((match, index) => {
              const opponent = (match as any).opponent ?? (match.isHome ? match.away : match.home) ?? ''
              return (
                <div key={index}
                  className={`flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-2.5 ${index === 0 ? 'ring-2 ring-primary/30' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-secondary">
                      <span className="text-xs font-bold text-muted-foreground leading-tight text-center">
                        {match.round.replace('第', '').replace('節', '')}節
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-card-foreground">vs {opponent}</p>
                        <Badge variant={match.isHome ? "default" : "outline"} className="text-xs">
                          {match.isHome ? "H" : "A"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{match.date} {match.time}</span>
                        </div>
                        {match.venue && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{match.venue}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    {match.competition}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
