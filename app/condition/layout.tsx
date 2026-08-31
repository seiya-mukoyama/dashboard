import Link from "next/link"
import Image from "next/image"
import { LayoutDashboard, Users, Medal, Dumbbell, Activity, Settings } from "lucide-react"

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
      {/* サイドバー - app/page.tsxと完全に同じ構造 */}
      <div style={{ width: 200 }} className="flex-shrink-0 flex flex-col h-full border-r border-border bg-[hsl(var(--sidebar-background))] transition-all duration-300">
        {/* ロゴエリア */}
        <div className="flex items-center border-b border-border gap-3 px-4 py-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-white border border-border">
            <Image src="/vonds-logo.png" alt="VONDS市原" width={44} height={44} className="object-contain" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight text-foreground truncate">VONDS市原</p>
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
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* 設定（下部） */}
        <div className="border-t border-border py-2">
          <Link href="/?section=settings"
            className="flex w-full items-center gap-3 py-2 text-sm transition-colors px-4 text-muted-foreground hover:bg-muted hover:text-foreground">
            <Settings className="h-4 w-4 shrink-0" />
            <span>設定</span>
          </Link>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
