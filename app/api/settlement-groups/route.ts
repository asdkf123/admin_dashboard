import { NextRequest, NextResponse } from 'next/server'

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL ?? ''

export async function GET() {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: 'APPS_SCRIPT_URL not configured' }, { status: 503 })
  }
  try {
    const url = `${APPS_SCRIPT_URL}?sheet=${encodeURIComponent('정산 그룹 관리')}`
    const res = await fetch(url, { redirect: 'follow', cache: 'no-store' })
    if (!res.ok) throw new Error(`upstream ${res.status}`)
    const json = await res.json()
    return NextResponse.json(json)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'fetch failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export async function POST(req: NextRequest) {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: 'APPS_SCRIPT_URL not configured' }, { status: 503 })
  }
  try {
    const body = await req.json()
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`upstream ${res.status}`)
    const json = await res.json()
    return NextResponse.json(json)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'fetch failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
