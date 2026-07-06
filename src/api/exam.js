import { request } from './http'

export function createExamPaper(payload = {}) {
  return request('/api/v1/exams/papers', {
    method: 'POST',
    body: {
      data: payload,
    },
  })
}

export function submitExamRecord(payload) {
  return request('/api/v1/exams/records', {
    method: 'POST',
    body: {
      data: payload,
    },
  })
}

export function getExamRecords() {
  return request('/api/v1/exams/records')
}

export function getExamRecordDetail(recordId) {
  return request(`/api/v1/exams/records/${recordId}`)
}
