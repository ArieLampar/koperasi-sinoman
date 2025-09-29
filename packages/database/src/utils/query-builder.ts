import type { Database } from '../types'

/**
 * Query builder utility for constructing complex database queries
 */
export class QueryBuilder<T extends keyof Database['public']['Tables']> {
  private table: T
  private selectFields: string = '*'
  private whereConditions: string[] = []
  private orderByClause: string[] = []
  private limitClause?: number
  private offsetClause?: number
  private joinClauses: string[] = []

  constructor(table: T) {
    this.table = table
  }

  /**
   * Select specific fields
   */
  select(fields: string): QueryBuilder<T> {
    this.selectFields = fields
    return this
  }

  /**
   * Add WHERE condition
   */
  where(condition: string): QueryBuilder<T> {
    this.whereConditions.push(condition)
    return this
  }

  /**
   * Add WHERE condition with parameter
   */
  whereEq(column: string, value: any): QueryBuilder<T> {
    this.whereConditions.push(`${column}.eq.${value}`)
    return this
  }

  /**
   * Add WHERE IN condition
   */
  whereIn(column: string, values: any[]): QueryBuilder<T> {
    this.whereConditions.push(`${column}.in.(${values.join(',')})`)
    return this
  }

  /**
   * Add WHERE LIKE condition
   */
  whereLike(column: string, pattern: string): QueryBuilder<T> {
    this.whereConditions.push(`${column}.like.${pattern}`)
    return this
  }

  /**
   * Add WHERE IS NULL condition
   */
  whereNull(column: string): QueryBuilder<T> {
    this.whereConditions.push(`${column}.is.null`)
    return this
  }

  /**
   * Add WHERE IS NOT NULL condition
   */
  whereNotNull(column: string): QueryBuilder<T> {
    this.whereConditions.push(`${column}.not.is.null`)
    return this
  }

  /**
   * Add WHERE greater than condition
   */
  whereGt(column: string, value: any): QueryBuilder<T> {
    this.whereConditions.push(`${column}.gt.${value}`)
    return this
  }

  /**
   * Add WHERE less than condition
   */
  whereLt(column: string, value: any): QueryBuilder<T> {
    this.whereConditions.push(`${column}.lt.${value}`)
    return this
  }

  /**
   * Add WHERE greater than or equal condition
   */
  whereGte(column: string, value: any): QueryBuilder<T> {
    this.whereConditions.push(`${column}.gte.${value}`)
    return this
  }

  /**
   * Add WHERE less than or equal condition
   */
  whereLte(column: string, value: any): QueryBuilder<T> {
    this.whereConditions.push(`${column}.lte.${value}`)
    return this
  }

  /**
   * Add date range condition
   */
  whereDateRange(column: string, from: string, to: string): QueryBuilder<T> {
    this.whereConditions.push(`${column}.gte.${from}`, `${column}.lte.${to}`)
    return this
  }

  /**
   * Add full-text search condition
   */
  whereTextSearch(column: string, query: string): QueryBuilder<T> {
    this.whereConditions.push(`${column}.fts.${query}`)
    return this
  }

  /**
   * Add ORDER BY clause
   */
  orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): QueryBuilder<T> {
    this.orderByClause.push(`${column}.${direction}`)
    return this
  }

  /**
   * Add LIMIT clause
   */
  limit(count: number): QueryBuilder<T> {
    this.limitClause = count
    return this
  }

  /**
   * Add OFFSET clause
   */
  offset(count: number): QueryBuilder<T> {
    this.offsetClause = count
    return this
  }

  /**
   * Add pagination
   */
  paginate(page: number, perPage: number): QueryBuilder<T> {
    this.limitClause = perPage
    this.offsetClause = (page - 1) * perPage
    return this
  }

  /**
   * Add JOIN clause
   */
  join(table: string, condition: string): QueryBuilder<T> {
    this.joinClauses.push(`${table}(${condition})`)
    return this
  }

  /**
   * Add LEFT JOIN clause
   */
  leftJoin(table: string, condition: string): QueryBuilder<T> {
    this.joinClauses.push(`${table}!left(${condition})`)
    return this
  }

  /**
   * Add INNER JOIN clause
   */
  innerJoin(table: string, condition: string): QueryBuilder<T> {
    this.joinClauses.push(`${table}!inner(${condition})`)
    return this
  }

  /**
   * Build the final query options
   */
  build(): {
    table: T
    select: string
    filters: Record<string, any>
    orderBy?: { column: string; ascending: boolean }[]
    limit?: number
    offset?: number
  } {
    let select = this.selectFields

    // Add joins to select
    if (this.joinClauses.length > 0) {
      select = `${this.selectFields}, ${this.joinClauses.join(', ')}`
    }

    // Build filters object from WHERE conditions
    const filters: Record<string, any> = {}
    this.whereConditions.forEach((condition) => {
      const parts = condition.split('.')
      if (parts.length >= 3) {
        const column = parts[0]
        const operator = parts[1]
        const value = parts.slice(2).join('.')

        if (operator === 'eq') {
          filters[column] = value
        } else if (operator === 'in') {
          const values = value.replace('(', '').replace(')', '').split(',')
          filters[column] = values
        } else if (operator === 'like') {
          filters[`${column}__like`] = value
        } else if (operator === 'gt') {
          filters[`${column}__gt`] = value
        } else if (operator === 'lt') {
          filters[`${column}__lt`] = value
        } else if (operator === 'gte') {
          filters[`${column}__gte`] = value
        } else if (operator === 'lte') {
          filters[`${column}__lte`] = value
        }
      }
    })

    // Build order by
    const orderBy = this.orderByClause.map((clause) => {
      const [column, direction] = clause.split('.')
      return {
        column,
        ascending: direction === 'asc',
      }
    })

    return {
      table: this.table,
      select,
      filters,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
      limit: this.limitClause,
      offset: this.offsetClause,
    }
  }

  /**
   * Reset the query builder
   */
  reset(): QueryBuilder<T> {
    this.selectFields = '*'
    this.whereConditions = []
    this.orderByClause = []
    this.limitClause = undefined
    this.offsetClause = undefined
    this.joinClauses = []
    return this
  }

  /**
   * Clone the query builder
   */
  clone(): QueryBuilder<T> {
    const clone = new QueryBuilder(this.table)
    clone.selectFields = this.selectFields
    clone.whereConditions = [...this.whereConditions]
    clone.orderByClause = [...this.orderByClause]
    clone.limitClause = this.limitClause
    clone.offsetClause = this.offsetClause
    clone.joinClauses = [...this.joinClauses]
    return clone
  }
}

/**
 * Factory function to create a query builder
 */
export function queryBuilder<T extends keyof Database['public']['Tables']>(
  table: T
): QueryBuilder<T> {
  return new QueryBuilder(table)
}

/**
 * Common query patterns
 */
export const commonQueries = {
  /**
   * Get active members
   */
  activeMembers: () =>
    queryBuilder('members')
      .whereEq('membership_status', 'active')
      .orderBy('created_at', 'desc'),

  /**
   * Get pending transactions
   */
  pendingTransactions: () =>
    queryBuilder('transactions')
      .whereEq('payment_status', 'pending')
      .orderBy('created_at', 'asc'),

  /**
   * Get member savings summary
   */
  memberSavings: (memberId: string) =>
    queryBuilder('savings_accounts')
      .whereEq('member_id', memberId)
      .whereEq('status', 'active')
      .join('savings_types', '*')
      .orderBy('created_at', 'asc'),

  /**
   * Get recent transactions for member
   */
  memberTransactions: (memberId: string, limit: number = 10) =>
    queryBuilder('transactions')
      .whereEq('member_id', memberId)
      .join('transaction_types', 'name, category')
      .orderBy('created_at', 'desc')
      .limit(limit),

  /**
   * Get featured products
   */
  featuredProducts: () =>
    queryBuilder('products')
      .whereEq('is_featured', true)
      .whereEq('status', 'active')
      .join('product_categories', 'name, slug')
      .join('sellers', 'business_name')
      .orderBy('created_at', 'desc'),

  /**
   * Search products by category
   */
  productsByCategory: (categoryId: string) =>
    queryBuilder('products')
      .whereEq('category_id', categoryId)
      .whereEq('status', 'active')
      .join('sellers', 'business_name, status')
      .orderBy('name', 'asc'),

  /**
   * Get pending orders
   */
  pendingOrders: () =>
    queryBuilder('orders')
      .whereIn('status', ['pending', 'confirmed'])
      .join('members', 'full_name, member_number, email')
      .orderBy('created_at', 'asc'),

  /**
   * Get member's orders
   */
  memberOrders: (memberId: string) =>
    queryBuilder('orders')
      .whereEq('member_id', memberId)
      .orderBy('created_at', 'desc'),
}