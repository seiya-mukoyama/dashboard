import Link from "next/link"
import Image from "next/image"
import { LayoutDashboard, Users, Medal, Dumbbell, Activity } from "lucide-react"

const navItems = [
  { id: "overview",         label: "チーム",               href: "/",                       icon: LayoutDashboard },
  { id: "players",          label: "選手",               href: "/?section=players",           icon: Users },
  { id: "official-matches", label: "公式戦",             href: "/?section=official-matches",  icon: Medal },
  { id: "training-matches", label: "トレーニングマッチ", href: "/?section=training-matches",  icon: Dumbbell },
  { id: "condition",        label: "コンディション",         href: "/condition",                  icon: Activity },
]

export default function ConditionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* サイドバー - app/page.tsxと同じスタイル */}
      <div className="w-[200px] flex-shrink-0 flex flex-col h-full border-r border-border bg-[hsl(var(--sidebar-background))]">
        {/* ロゴエりア */}
        <div className="flex items-center border-b border-border gap-3 px-4 py-3">
          <div className="relative w-9 h-9 flex-shrink-0">
            <Image src="/apple-icon.png" alt="VONDS" fill className="object-contain rounded-md" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight text-[hsl(var(--sidebar-foreground))] truncate">VONDS市原</p>
            <p className="text-[10px] text-muted-foreground">2025-26 シーズン</p>
          </div>
        </div>

        {/* ナビゲーション */}
        <div className="flex-1 overflow-y-auto py-3">
          <p className="px-4 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">メインメニュー</p>
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = item.id === "condition"
            return (
              <Link key={item.id} href={item.href}
                className={`flex w-full items-center gap-3 py-2 text-sm transition-colors px-4
                  ${isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}>
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
