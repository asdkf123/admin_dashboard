'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react'

interface ChargingRecord {
  주문번호: string
  주문유형: string
  충전소명: string
  충전소ID: string
  충전기번호: string
  충전기유형: string
  로밍사업자: string
  충전시작일시: string
  충전종료일시: string
  충전시간: string
  충전량: string
  매출인식금액: string
  충전금액: string
  결제수단: string
}

const COLUMNS: { key: keyof ChargingRecord; label: string; className?: string }[] = [
  { key: '주문번호', label: '주문번호', className: 'min-w-[140px] font-mono' },
  { key: '주문유형', label: '주문유형', className: 'min-w-[80px]' },
  { key: '충전소명', label: '충전소명', className: 'min-w-[130px]' },
  { key: '충전소ID', label: '충전소ID', className: 'min-w-[100px] font-mono' },
  { key: '충전기번호', label: '충전기번호', className: 'min-w-[80px] text-right' },
  { key: '충전기유형', label: '충전기유형', className: 'min-w-[80px]' },
  { key: '로밍사업자', label: '로밍사업자', className: 'min-w-[100px]' },
  { key: '충전시작일시', label: '충전시작일시', className: 'min-w-[150px]' },
  { key: '충전종료일시', label: '충전종료일시', className: 'min-w-[150px]' },
  { key: '충전시간', label: '충전시간', className: 'min-w-[80px] text-right' },
  { key: '충전량', label: '충전량', className: 'min-w-[80px] text-right' },
  { key: '매출인식금액', label: '매출인식금액', className: 'min-w-[110px] text-right' },
  { key: '충전금액', label: '충전금액', className: 'min-w-[100px] text-right' },
  { key: '결제수단', label: '결제수단', className: 'min-w-[100px]' },
]

const PAGE_SIZE = 20

export default function ChargingHistoryPage() {
  const [records, setRecords] = useState<ChargingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetch('/api/charging-history')
      .then((res) => {
        if (!res.ok) throw new Error(`서버 오류 (${res.status})`)
        return res.json()
      })
      .then((json) => {
        setRecords(json.data ?? [])
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '데이터를 불러올 수 없습니다.')
      })
      .finally(() => setLoading(false))
  }, [])

  const totalPages = Math.ceil(records.length / PAGE_SIZE)
  const pageRecords = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="충전 이력" />

      <div className="flex flex-1 flex-col overflow-hidden p-6 gap-3">
        {/* 요약 */}
        {!loading && !error && (
          <p className="text-xs text-muted-foreground">
            전체 <span className="font-medium text-foreground">{records.length.toLocaleString()}</span>건
          </p>
        )}

        {/* 테이블 카드 */}
        <Card className="flex flex-1 flex-col overflow-hidden shadow-sm">
          <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
            {loading && (
              <div className="flex flex-1 items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                데이터를 불러오는 중...
              </div>
            )}

            {error && (
              <div className="flex flex-1 items-center justify-center gap-2 py-20 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {!loading && !error && (
              <>
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {COLUMNS.map((col) => (
                          <TableHead key={col.key} className={col.className}>
                            {col.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageRecords.map((row, i) => (
                        <TableRow key={row.주문번호 || i}>
                          {COLUMNS.map((col) => (
                            <TableCell key={col.key} className={col.className}>
                              {String(row[col.key] ?? '')}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* 페이지네이션 */}
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    {((page - 1) * PAGE_SIZE + 1).toLocaleString()}–
                    {Math.min(page * PAGE_SIZE, records.length).toLocaleString()} /
                    {' '}{records.length.toLocaleString()}건
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="min-w-[80px] text-center text-xs text-muted-foreground">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
