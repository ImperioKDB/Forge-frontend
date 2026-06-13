/**
 * FORGE -- apiFetch
 * Hardened: wraps res.json() in try/catch for non-JSON error responses
 * (502 HTML gateway pages, Render cold-start HTML).
 * Reads Retry-After on 429. Throws structured ApiError.
 */

import { createBrowserClient } from '@supabase/ssr'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

class ApiError extends Error {
  constructor(message, code, details, status, retryAfter) {
    super(message)
    this.name       = 'ApiError'
    this.code       = code || 'UNKNOWN'
    this.details    = details || null
    this.status     = status
    this.retryAfter = retryAfter || null
  }
}

async function getToken() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

export async function apiFetch(endpoint, options = {}) {
  const token = await getToken()
  const url   = `${API_BASE}${endpoint}`

  const headers = {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const res = await fetch(url, { ...options, headers })

  // Parse body safely -- gateway errors return HTML, not JSON
  let body = null
  const contentType = res.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    try {
      body = await res.json()
    } catch {
      body = { error: 'Failed to parse server response', code: 'PARSE_ERROR' }
    }
  } else {
    const text = await res.text().catch(() => '')
    body = {
      error: text.slice(0, 120) || `HTTP ${res.status}`,
      code:  'NON_JSON_RESPONSE',
    }
  }

  if (!res.ok) {
    const retryAfter = res.headers.get('Retry-After')
      ? parseInt(res.headers.get('Retry-After'), 10)
      : null

    throw new ApiError(
      body?.error   || `Request failed with status ${res.status}`,
      body?.code    || 'REQUEST_FAILED',
      body?.details || null,
      res.status,
      retryAfter
    )
  }

  return body
}

export { ApiError }
