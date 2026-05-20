export interface PaginatedResponse<T> {
  tickets: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiError {
  error: string
}
