import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { ForbiddenCard } from '@/components/layout/forbidden-card'
import { getCurrentUser } from '@/lib/auth/server'
import { hasPermission } from '@/lib/permissions'
import { stationAdapter } from '@/lib/adapters/station'
import { NewAccountForm } from './new-account-form'

export default async function NewAccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!(await hasPermission(user, 'manage:accounts'))) {
    return <ForbiddenCard title="신규 계정 등록" permission="manage:accounts" />
  }

  const { items: stations } = await stationAdapter.listStations({ limit: 1000 })

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="신규 계정 등록" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl">
          <NewAccountForm
            stations={stations.map((s) => ({ id: s.id, name: s.name }))}
          />
        </div>
      </div>
    </div>
  )
}
