import { request } from './http'
import { setAuthSession } from '../stores/auth'

export function sendLoginCode(mobile) {
  return request('/api/v1/auth/send-code', {
    method: 'POST',
    auth: false,
    body: {
      data: {
        mobile,
        scene: 'login',
      },
    },
  })
}

export async function loginWithCode({ mobile, code, deviceId = 'web-001', clientType = 'web' }) {
  const data = await request('/api/v1/auth/login', {
    method: 'POST',
    auth: false,
    body: {
      data: {
        mobile,
        code,
        deviceId,
        clientType,
      },
    },
  })
  setAuthSession(data)
  return data
}
