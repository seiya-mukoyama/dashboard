"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"

type Player = {
  number: string
  name: string
  nameEn: string
  position: string
  image: string
  profileUrl: string
}

const positionOrder = ["GK", "DF", "MF", "FW"]

const positionColors: Record<string, string> = {
  GK: "bg-yellow-100 text-yellow-800 border-yellow-300",
  DF: "bg-blue-100 text-blue-800 border-blue-300",
  MF: "bg-green-100 text-green-800 border-green-300",
  FW: "bg-red-100 text-red-800 border-red-300",
}

export function PlayerCardsGrid() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activePos, setActivePos] = useState("ALL")

  useEffect(() => {
    fetch("/api/players")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setPlayers(data)
        else setError("データの取得に失敗しました")
      })
      .catch(() => setError("データの取得に失敗しました"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      <div className="text-sm">選手データを読み込み中...</div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center py-20 text-destructive">
      <div className="text-sm">{error}</div>
    </div>
  )

  const positions = ["ALL", ...positionOrder.filter(p => players.some(pl => pl.position === p))]
  const filtered = activePos === "ALL" ? players : players.filter(p => p.position === activePos)

  // ポジション別にグループ化
  const grouped = positionOrder.reduce((acc, pos) => {
    const list = filtered.filter(p => p.position === pos)
    if (list.length > 0) acc[pos] = list
    return acc
  }, {} as Record<string, Player[]>)

  return (
    <div className="space-y-6">
      {/* ポジションフィルター */}
      <div className="flex gap-2 flex-wrap">
        {positions.map(pos => (
          <button
            key={pos}
            onClick={() => setActivePos(pos)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
              ${activePos === pos
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
          >
            {pos === "ALL" ? "全員" : pos}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground self-center">
          {filtered.length}選手
        </span>
      </div>

      {/* 選手カード（ポジション別） */}
      {Object.entries(grouped).map(([pos, list]) => (
        <div key={pos}>
          {activePos === "ALL" && (
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${positionColors[pos]}`}>{pos}</span>
              {list.length}名
            </h3>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {list.map(player => (
              <Link
                key={player.number}
                href={player.profileUrl || "#"}
                target={player.profileUrl ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden group">
                  <div className="relative bg-gradient-to-b from-[hsl(142,72%,90%)] to-[hsl(142,72%,95%)] aspect-square">
                    {player.image ? (
                      <Image
                        src={player.image}
                        alt={player.name}
                        fill
                        className="object-contain object-bottom group-hover:scale-105 transition-transform"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-3xl font-bold text-primary/30">
                        {player.number}
                      </div>
                    )}
                    <div className="absolute top-1.5 left-1.5">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${positionColors[player.position] || "bg-gray-100 text-gray-700 border-gray-300"}`}>
                        {player.position}
                      </span>
                    </div>
                    <div className="absolute top-1.5 right-1.5 text-lg font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {player.number}
                    </div>
                  </div>
                  <CardContent className="p-2 text-center">
                    <p className="text-sm font-semibold text-foreground leading-tight truncate">{player.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{player.nameEn}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
