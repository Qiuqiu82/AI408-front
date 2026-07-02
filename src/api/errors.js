export class ApiError extends Error {
  constructor(message, code = '999', status = 0, data = null) {
    super(message)
    this.name = 'ApiError'
    this.code = String(code)
    this.status = status
    this.data = data
  }
}
