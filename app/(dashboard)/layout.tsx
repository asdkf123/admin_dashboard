import { Sidebar } from '@/components/layout/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole="main_admin" />
      <main className="flex flex-1 flex-col overflow-hidden bg-muted/30">
        {children}
      </main>
    </div>
  )
}
