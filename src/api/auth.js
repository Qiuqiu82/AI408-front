import { request } from './http'
import { setAuthSession } from '../stores/auth'

export function sendLoginCode(email) {
  return request('/api/v1/auth/send-code', {
    method: 'POST',
    auth: false,
    body: {
      data: {
        email,
        scene: 'login',
      },
    },
  })
}

export async function loginWithCode({ email, code, deviceId = 'web-001', clientType = 'web' }) {
  const data = await request('/api/v1/auth/login', {
    method: 'POST',
    auth: false,
    body: {
      data: {
        email,
        code,
        deviceId,
        clientType,
      },
    },
  })
  setAuthSession(data)
  return data
}

export async function loginWithPassword({ email, password, deviceId = 'web-001', clientType = 'web' }) {
  const data = await request('/api/v1/auth/password-login', {
    method: 'POST',
    auth: false,
    body: {
      data: {
        email,
        password,
        deviceId,
        clientType,
      },
    },
  })
  setAuthSession(data)
  return data
}
