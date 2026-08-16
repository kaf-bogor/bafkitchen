import { env } from 'cloudflare:workers'

export type Env = typeof env

export const db = () => env.DB as D1Database

export const json = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  })

export const noContent = () => new Response(null, { status: 204 })

export const now = () => new Date().toISOString()

export const uuid = () => crypto.randomUUID()

export const parseJson = <T,>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}