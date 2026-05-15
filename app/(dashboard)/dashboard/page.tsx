import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Zap,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Clock,
} from 'lucide-react'

const kpiCards = [
  {
    title: '총 충전소',
    value: '142',
    unit: '개소',
    change: '+3',
    changeType: 'positive' as const,
    icon: Zap,
    description: '전월 대비',
  },
  {
    title: '정상 운영',
    value: '128',
    unit: '개소',
    change: '90.1%',
    changeType: 'positive' as const,
    icon: CheckCircle2,
    description: '가동률',
  },
  {
    title: '고장/점검',
    value: '14',
    unit: '개소',
    change: '-2',
    changeType: 'negative' as const,
    icon: AlertTriangle,
    description: '전월 대비',
  },
  {
    title: '금월 충전량',
    value: '48,320',
    unit: 'kWh',
    change: '+12.4%',
    changeType: 'positive' as const,
    icon: TrendingUp,
    description: '전월 대비',
  },
]

const recentFaults = [
  { id: 'CS001', station: '강남 충전소', charger: '2번 충전기', status: '수리중', time: '2시간 전' },
  { id: 'CS047', station: '홍대 충전소', charger: '1번 충전기', status: '접수완료', time: '4시간 전' },
  { id: 'CS023', station: '신촌 충전소', charger: '3번 충전기', status: '처리완료', time: '1일 전' },
  { id: 'CS089', station: '잠실 충전소', charger: '1번 충전기', status: '수리중', time: '1일 전' },
]

const recentActivity = [
  { type: '충전 완료', station: '서초 충전소', user: 'user_2847', amount: '45.2 kWh', time: '5분 전' },
  { type: '충전 시작', station: '강남 충전소', user: 'user_1293', amount: '-', time: '8분 전' },
  { type: '고장 신고', station: '홍대 충전소', user: 'system', amount: '-', time: '2시간 전' },
  { type: '충전 완료', station: '신촌 충전소', user: 'user_5591', amount: '30.8 kWh', time: '2시간 전' },
]

const statusColor: Record<string, string> = {
  수리중: 'bg-yellow-100 text-yellow-800',
  접수완료: 'bg-blue-100 text-blue-800',
  처리완료: 'bg-green-100 text-green-800',
}

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="대시보드" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.title} className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className="rounded-md bg-primary/10 p-1.5">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{card.value}</span>
                    <span className="text-sm text-muted-foreground">{card.unit}</span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <span
                      className={
                        card.changeType === 'positive'
                          ? 'font-medium text-green-600'
                          : 'font-medium text-red-500'
                      }
                    >
                      {card.change}
                    </span>
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Recent Faults */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <CardTitle className="text-sm font-semibold">고장 신고 현황</CardTitle>
              <Badge variant="secondary" className="ml-auto text-xs">
                14건
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentFaults.map((fault) => (
                  <div
                    key={fault.id}
                    className="flex items-center justify-between px-6 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {fault.station}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fault.id} · {fault.charger}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[fault.status]}`}
                      >
                        {fault.status}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {fault.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Activity className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-sm font-semibold">최근 활동</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-6 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.station}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.type} · {activity.user}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                      {activity.amount !== '-' && (
                        <span className="text-xs font-medium text-primary">
                          {activity.amount}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Station Status Overview */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">충전소 상태 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: '정상', count: 128, color: 'bg-green-500' },
                { label: '고장', count: 8, color: 'bg-red-500' },
                { label: '점검중', count: 6, color: 'bg-yellow-500' },
                { label: '미연결', count: 0, color: 'bg-gray-400' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3"
                >
                  <div className={`h-2.5 w-2.5 rounded-full ${item.color} shrink-0`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-lg font-bold">{item.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
