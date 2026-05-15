import { NextResponse } from 'next/server'

// Apps Script 웹 앱 배포 후 아래 URL을 교체하세요
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_CHARGING_HISTORY_URL ?? ''

export async function GET() {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: 'APPS_SCRIPT_CHARGING_HISTORY_URL not configured' }, { status: 503 })
  }

  try {
    // Apps Script는 302 리다이렉트를 반환하므로 follow 설정
    const res = await fetch(APPS_SCRIPT_URL, {
      redirect: 'follow',
      next: { revalidate: 60 },
    })
    if (!res.ok) throw new Error(`upstream ${res.status}`)
    const json = await res.json()
    return NextResponse.json(json)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'fetch failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
