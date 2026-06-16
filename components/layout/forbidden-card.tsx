import { Card, CardContent } from '@/components/ui/card'
import { ShieldAlert } from 'lucide-react'
import { Header } from './header'
import { PERMISSION_LABEL, type Permission } from '@/lib/permissions/keys'

export function ForbiddenCard({
  title,
  permission,
}: {
  title: string
  permission?: Permission
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title={title} />
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <ShieldAlert className="h-10 w-10 text-warning" />
            <p className="text-base font-semibold">접근 권한이 없습니다.</p>
            {permission && (
              <p className="text-xs text-muted-foreground">
                필요한 권한: <code className="font-mono">{PERMISSION_LABEL[permission]}</code>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              본사 운영팀에 권한 부여를 요청하세요.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
