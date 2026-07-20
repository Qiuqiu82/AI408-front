import { request } from './http'

export function getCurrentUser() {
  return request('/api/v1/users/me')
}

export function updateCurrentUser(payload) {
  return request('/api/v1/users/me', {
    method: 'PATCH',
    body: {
      data: payload,
    },
  })
}

export function updateCurrentUserPassword(payload) {
  return request('/api/v1/users/me/password', {
    method: 'PATCH',
    body: {
      data: payload,
    },
  })
}

export function getStudySummary() {
  return request('/api/v1/users/me/study-summary')
}
