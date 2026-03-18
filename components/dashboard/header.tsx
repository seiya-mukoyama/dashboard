"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        <Select defaultValue="2025-26">
          <SelectTrigger className="w-[140px] h-9 bg-secondary border-border">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="シーズン選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025-26">2025-26</SelectItem>
            <SelectItem value="2024-25">2024-25</SelectItem>
            <SelectItem value="2023-24">2023-24</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
        </Button>
      </div>
    </header>
  )
}
