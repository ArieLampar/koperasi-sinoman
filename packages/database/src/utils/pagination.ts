/**
 * Pagination utilities
 */

export interface PaginationOptions {
  page?: number
  limit?: number
  defaultLimit?: number
  maxLimit?: number
}

export interface PaginationResult {
  page: number
  limit: number
  offset: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedData<T> {
  data: T[]
  pagination: PaginationResult & {
    total: number
  }
}

/**
 * Calculate pagination parameters
 */
export function calculatePagination(
  options: PaginationOptions,
  total: number
): PaginationResult {
  const {
    page = 1,
    limit = options.defaultLimit || 20,
    maxLimit = 100,
  } = options

  // Ensure valid values
  const currentPage = Math.max(1, page)
  const currentLimit = Math.min(Math.max(1, limit), maxLimit)
  const offset = (currentPage - 1) * currentLimit
  const totalPages = Math.ceil(total / currentLimit)

  return {
    page: currentPage,
    limit: currentLimit,
    offset,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  }
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  options: PaginationOptions
): PaginatedData<T> {
  const pagination = calculatePagination(options, total)

  return {
    data,
    pagination: {
      ...pagination,
      total,
    },
  }
}

/**
 * Get pagination info for UI
 */
export function getPaginationInfo(
  current: number,
  total: number,
  limit: number
): {
  start: number
  end: number
  total: number
  pages: number[]
  showPrevious: boolean
  showNext: boolean
} {
  const totalPages = Math.ceil(total / limit)
  const start = (current - 1) * limit + 1
  const end = Math.min(current * limit, total)

  // Generate page numbers to show (max 5 pages)
  const maxPages = 5
  let startPage = Math.max(1, current - Math.floor(maxPages / 2))
  let endPage = Math.min(totalPages, startPage + maxPages - 1)

  // Adjust start if we're near the end
  if (endPage - startPage < maxPages - 1) {
    startPage = Math.max(1, endPage - maxPages + 1)
  }

  const pages: number[] = []
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return {
    start,
    end,
    total,
    pages,
    showPrevious: current > 1,
    showNext: current < totalPages,
  }
}

/**
 * Parse pagination from query parameters
 */
export function parsePaginationParams(params: {
  page?: string | number
  limit?: string | number
  per_page?: string | number
}): PaginationOptions {
  const page = parseInt(String(params.page || 1))
  const limit = parseInt(String(params.limit || params.per_page || 20))

  return {
    page: isNaN(page) ? 1 : page,
    limit: isNaN(limit) ? 20 : limit,
  }
}

export default {
  calculatePagination,
  createPaginatedResponse,
  getPaginationInfo,
  parsePaginationParams,
}