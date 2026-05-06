import type { ApiEnvelope } from '../types'

/**
 * Generic API caller.
 * Handles both bare responses and the `{ statusCode, message, data }` envelope
 * the backend uses.
 */
export async function callApi<T = unknown>(
  base: string,
  path: string,
  opts: RequestInit = {}
): Promise<{ data: T; msg: string | null }> {
  const token = localStorage.getItem('nets_token')

  const res = await fetch(base + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  })

  let raw: unknown = null
  const text = await res.text()
  if (text) {
    try {
      raw = JSON.parse(text)
    } catch {
      raw = text
    }
  }

  if (!res.ok) {
    const msg =
      raw &&
      typeof raw === 'object' &&
      'message' in raw &&
      typeof (raw as Record<string, unknown>).message === 'string'
        ? (raw as Record<string, unknown>).message as string
        : `HTTP ${res.status}`
    throw new Error(msg)
  }

  const isEnvelope =
    raw &&
    typeof raw === 'object' &&
    'statusCode' in raw

  if (isEnvelope) {
    const env = raw as ApiEnvelope<T>
    return { data: env.data, msg: env.message }
  }

  return { data: raw as T, msg: null }
}
