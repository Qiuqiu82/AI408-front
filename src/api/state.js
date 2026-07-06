import { request } from './http'

export function getWrongBookPage(payload) {
  return request('/api/v1/me/wrong-book/page', {
    method: 'POST',
    body: {
      data: payload,
    },
  })
}

export function getWrongBookStats() {
  return request('/api/v1/me/wrong-book/stats')
}

export function getFavoritesPage(payload) {
  return request('/api/v1/me/favorites/page', {
    method: 'POST',
    body: {
      data: payload,
    },
  })
}

export function patchQuestionState(questionId, payload) {
  return request(`/api/v1/me/question-states/${questionId}`, {
    method: 'PATCH',
    body: {
      data: payload,
    },
  })
}

export function clearWrongBook() {
  return request('/api/v1/me/wrong-book', {
    method: 'DELETE',
  })
}

export function clearFavorites() {
  return request('/api/v1/me/favorites', {
    method: 'DELETE',
  })
}
