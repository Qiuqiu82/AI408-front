import { request } from './http'

export function getPracticeScopes(type = 'paper') {
  return request('/api/v1/practice/scopes', {
    query: { type },
  })
}

export function createPracticeSession(payload) {
  return request('/api/v1/practice/sessions', {
    method: 'POST',
    body: {
      data: payload,
    },
  })
}

export function getPracticeSession(sessionId) {
  return request(`/api/v1/practice/sessions/${sessionId}`)
}

export function submitPracticeAnswer(sessionId, payload) {
  return request(`/api/v1/practice/sessions/${sessionId}/answers`, {
    method: 'POST',
    body: {
      data: payload,
    },
  })
}

export function updateEssaySteps(sessionId, payload) {
  return request(`/api/v1/practice/sessions/${sessionId}/essay-steps`, {
    method: 'PATCH',
    body: {
      data: payload,
    },
  })
}

export function finishPracticeSession(sessionId) {
  return request(`/api/v1/practice/sessions/${sessionId}/finish`, {
    method: 'POST',
  })
}

export function getPracticeReview(sessionId) {
  return request(`/api/v1/practice/sessions/${sessionId}/review`)
}
