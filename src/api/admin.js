import { request } from './http'

export function getImportTemplate() {
  return request('/api/v1/admin/questions/template')
}

export function importQuestions(file, importType = 'append') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('importType', importType)
  return request('/api/v1/admin/questions/import', {
    method: 'POST',
    body: formData,
  })
}

export function getImportJob(jobId) {
  return request(`/api/v1/admin/questions/imports/${jobId}`)
}
