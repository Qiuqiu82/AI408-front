import { ApiError } from './errors'

export async function readPayload(response) {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export function unwrapEnvelope(response, payload) {
  if (payload && typeof payload === 'object' && 'code' in payload && 'message' in payload) {
    if (response.ok && String(payload.code) === '200') {
      return payload.data
    }
    throw new ApiError(payload.message || response.statusText, payload.code || String(response.status), response.status, payload.data ?? null)
  }

  if (response.ok) {
    return payload
  }

  throw new ApiError(typeof payload === 'string' ? payload : response.statusText, String(response.status), response.status, payload)
}
