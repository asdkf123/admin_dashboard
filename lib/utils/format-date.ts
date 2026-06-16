/**
 * 서버 측에서 한국 포맷으로 일관되게 변환. Hydration mismatch 방지를 위해
 * client에서는 절대 호출하지 말고, server component에서 string으로 변환 후 전달할 것.
 */
export function formatKoreanDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const h = d.getHours()
  const min = d.getMinutes().toString().padStart(2, '0')
  const sec = d.getSeconds().toString().padStart(2, '0')
  const period = h < 12 ? '오전' : '오후'
  const hh = (h % 12 === 0 ? 12 : h % 12).toString().padStart(2, '0')
  return `${y}.${m}.${day} ${period} ${hh}:${min}:${sec}`
}

export function formatKoreanDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}.${m}.${day}`
}
