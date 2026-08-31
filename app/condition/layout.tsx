import Link from "next/link"
import { LayoutDashboard, Users, Medal, Dumbbell, Activity } from "lucide-react"

const navItems = [
  { id: "overview",          label: "チーム",               href: "/",                icon: LayoutDashboard },
  { id: "players",           label: "選手",               href: "/?section=players",    icon: Users },
  { id: "official-matches",  label: "公式戦",             href: "/?section=official-matches", icon: Medal },
  { id: "training-matches",  label: "トレーニングマッチ", href: "/?section=training-matches", icon: Dumbbell },
  { id: "condition",         label: "コンディション",         href: "/condition",           icon: Activity },
]

export default function ConditionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      {/* サイドバー */}
      <aside className="w-[220px] flex-shrink-0 border-r border-border bg-card flex flex-col">
        {/* ロゴ */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">VONDS市原</p>
            <p className="text-[10px] text-muted-foreground">2025-26 シーズン</p>
          </div>
        </div>
        {/* ナビ */}
        <nav className="flex-1 py-2 px-2">
          <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">メインメニュー</p>
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = item.id === "condition"
            return (
              <Link key={item.id} href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5
                  ${isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}>
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-lg">コンディション管理</h2>
          <span className="text-sm text-muted-foreground">2025-26</span>
        </div>
        {children}
      </main>
    </div>
  )
}
