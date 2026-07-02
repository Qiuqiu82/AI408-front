import { reactive } from 'vue'
import { API_BASE_URL } from '../api/config'
import { ApiError } from '../api/errors'
import { readPayload } from '../api/response'

const STORAGE_KEY = 'ai408-auth-session-v1'

function loadStoredSession() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persistSession(session) {
  if (typeof window === 'undefined') {
    return
  }

  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export const authStore = reactive({
  ready: false,
  accessToken: '',
  refreshToken: '',
  expiresIn: 0,
  user: null,
  refreshPending: null,
})

const storedSession = loadStoredSession()
if (storedSession) {
  authStore.accessToken = storedSession.accessToken || ''
  authStore.refreshToken = storedSession.refreshToken || ''
  authStore.expiresIn = storedSession.expiresIn || 0
  authStore.user = storedSession.user || null
}

export function setAuthSession(session) {
  authStore.accessToken = session?.accessToken || ''
  authStore.refreshToken = session?.refreshToken || ''
  authStore.expiresIn = session?.expiresIn || 0
  authStore.user = session?.user || null
  persistSession({
    accessToken: authStore.accessToken,
    refreshToken: authStore.refreshToken,
    expiresIn: authStore.expiresIn,
    user: authStore.user,
  })
}

export function updateAuthUser(user) {
  authStore.user = user ? { ...user } : null
  persistSession({
    accessToken: authStore.accessToken,
    refreshToken: authStore.refreshToken,
    expiresIn: authStore.expiresIn,
    user: authStore.user,
  })
}

export function clearAuthSession() {
  authStore.accessToken = ''
  authStore.refreshToken = ''
  authStore.expiresIn = 0
  authStore.user = null
  persistSession(null)
}

export function logout({ redirect = true } = {}) {
  clearAuthSession()
  if (redirect && typeof window !== 'undefined' && window.location.hash !== '#/login') {
    window.location.hash = '#/login'
  }
}

export function bootstrapAuth() {
  authStore.ready = true
  return authStore
}

export async function refreshAuthSession() {
  if (!authStore.refreshToken) {
    throw new ApiError('请先登录', '40100', 401)
  }

  if (authStore.refreshPending) {
    return authStore.refreshPending
  }

  authStore.refreshPending = (async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        data: {
          refreshToken: authStore.refreshToken,
        },
      }),
    })
    const payload = await readPayload(response)
    if (!response.ok || !payload || payload.code !== '200') {
      clearAuthSession()
      throw new ApiError(payload?.message || '登录已过期', payload?.code || String(response.status), response.status, payload?.data ?? null)
    }
    setAuthSession(payload.data)
    return authStore
  })()

  try {
    return await authStore.refreshPending
  } finally {
    authStore.refreshPending = null
  }
}
