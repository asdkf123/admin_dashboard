'use client'

import { Bell, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-base font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -right-0.5 -top-0.5 h-4 w-4 items-center justify-center p-0 text-[10px]">
            3
          </Badge>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors outline-none">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              관
            </div>
            <span className="text-sm">관리자</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>내 프로필</DropdownMenuItem>
            <DropdownMenuItem>설정</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
