import { API_BASE_URL } from './config'
import { ApiError } from './errors'
import { readPayload, unwrapEnvelope } from './response'
import { authStore, refreshAuthSession, logout } from '../stores/auth'

function buildUrl(path, query) {
  const url = new URL(path, API_BASE_URL)
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return
      }
      url.searchParams.set(key, String(value))
    })
  }
  return url.toString()
}

function createHeaders(headers, body, auth) {
  const result = new Headers(headers || {})
  result.set('Accept', result.get('Accept') || 'application/json')

  if (auth && authStore.accessToken) {
    result.set('Authorization', `Bearer ${authStore.accessToken}`)
  }

  if (!(body instanceof FormData) && body !== undefined && body !== null && !result.has('Content-Type')) {
    result.set('Content-Type', 'application/json')
  }

  return result
}

function normalizeBody(body) {
  if (body === undefined || body === null) {
    return undefined
  }
  if (body instanceof FormData || body instanceof Blob || typeof body === 'string') {
    return body
  }
  return JSON.stringify(body)
}

async function fetchWithAuth(path, options) {
  const { query, headers, body, method = 'GET', auth = true, signal } = options || {}
  const response = await fetch(buildUrl(path, query), {
    method,
    headers: createHeaders(headers, body, auth),
    body: normalizeBody(body),
    signal,
  })
  return response
}

async function handleEnvelopeResponse(response) {
  const payload = await readPayload(response)
  return unwrapEnvelope(response, payload)
}

export async function request(path, options = {}) {
  const { auth = true, retry = true } = options
  let retried = false

  while (true) {
    const response = await fetchWithAuth(path, options)
    if (response.status === 401 && auth && retry && !retried && authStore.refreshToken) {
      retried = true
      try {
        await refreshAuthSession()
      } catch {
        logout({ redirect: true })
        throw new ApiError('登录已过期', '40101', 401)
      }
      continue
    }

    return handleEnvelopeResponse(response)
  }
}

export async function streamRequest(path, options = {}) {
  const { auth = true, retry = true } = options
  let retried = false

  while (true) {
    const response = await fetchWithAuth(path, options)
    if (response.status === 401 && auth && retry && !retried && authStore.refreshToken) {
      retried = true
      try {
        await refreshAuthSession()
      } catch {
        logout({ redirect: true })
        throw new ApiError('登录已过期', '40101', 401)
      }
      continue
    }

    if (!response.ok) {
      const payload = await readPayload(response)
      throw new ApiError(
        payload && typeof payload === 'object' && 'message' in payload ? payload.message : response.statusText,
        payload && typeof payload === 'object' && 'code' in payload ? payload.code : String(response.status),
        response.status,
        payload && typeof payload === 'object' ? payload.data ?? null : payload
      )
    }

    return response
  }
}
