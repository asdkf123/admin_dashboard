import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

const SALT_BYTES = 16
const KEY_BYTES = 64

/**
 * 비밀번호 해싱 — scrypt (Node built-in, 의존성 없음).
 * 저장 형식: `<salt-hex>:<hash-hex>`
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString('hex')
  const hash = (await scryptAsync(password, salt, KEY_BYTES)) as Buffer
  return `${salt}:${hash.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(':')
  if (!salt || !hashHex) return false
  const hash = Buffer.from(hashHex, 'hex')
  const test = (await scryptAsync(password, salt, KEY_BYTES)) as Buffer
  return hash.length === test.length && timingSafeEqual(hash, test)
}

/**
 * 비밀번호 정책. 가입·변경 시 호출.
 */
export function validatePasswordStrength(password: string): { ok: boolean; reason?: string } {
  if (password.length < 10) return { ok: false, reason: '10자 이상이어야 합니다.' }
  if (!/[A-Za-z]/.test(password)) return { ok: false, reason: '영문이 포함되어야 합니다.' }
  if (!/[0-9]/.test(password)) return { ok: false, reason: '숫자가 포함되어야 합니다.' }
  if (!/[^A-Za-z0-9]/.test(password)) return { ok: false, reason: '특수문자가 포함되어야 합니다.' }
  return { ok: true }
}
