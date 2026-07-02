import { request } from './http'

export function getSubjects() {
  return request('/api/v1/subjects')
}

export function getQuestionPage(payload) {
  return request('/api/v1/questions/page', {
    method: 'POST',
    body: {
      data: payload,
    },
  })
}

export function getQuestionDetail(questionId, view = 'practice') {
  return request(`/api/v1/questions/${questionId}`, {
    query: { view },
  })
}
