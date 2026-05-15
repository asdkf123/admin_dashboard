import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Construction } from 'lucide-react'

export default function StationGroupsPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="충전소그룹 관리" />
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-sm shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Construction className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">준비 중인 페이지입니다.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
