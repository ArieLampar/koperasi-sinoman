/**
 * Search utilities
 */

export interface SearchOptions {
  query: string
  fields: string[]
  fuzzy?: boolean
  caseSensitive?: boolean
  exactMatch?: boolean
  minLength?: number
}

export interface SearchFilter {
  column: string
  operator: 'eq' | 'like' | 'ilike' | 'in' | 'gte' | 'lte' | 'fts'
  value: any
}

/**
 * Build search filters based on query
 */
export function buildSearchFilters(options: SearchOptions): SearchFilter[] {
  const { query, fields, fuzzy = true, caseSensitive = false, exactMatch = false, minLength = 2 } = options

  if (!query || query.length < minLength) {
    return []
  }

  const filters: SearchFilter[] = []
  const searchValue = exactMatch ? query : `%${query}%`
  const operator = exactMatch ? 'eq' : caseSensitive ? 'like' : 'ilike'

  // Add filters for each field
  fields.forEach(field => {
    filters.push({
      column: field,
      operator,
      value: searchValue,
    })
  })

  // Add full-text search if fuzzy is enabled
  if (fuzzy && !exactMatch) {
    fields.forEach(field => {
      filters.push({
        column: field,
        operator: 'fts',
        value: query.split(' ').join(' & '), // PostgreSQL FTS syntax
      })
    })
  }

  return filters
}

/**
 * Highlight search terms in text
 */
export function highlightSearchTerms(text: string, query: string, highlightClass: string = 'highlight'): string {
  if (!query || !text) return text

  const terms = query.split(' ').filter(term => term.length > 0)
  let highlightedText = text

  terms.forEach(term => {
    const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi')
    highlightedText = highlightedText.replace(regex, `<span class="${highlightClass}">$1</span>`)
  })

  return highlightedText
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Extract search suggestions from query
 */
export function getSearchSuggestions(query: string, suggestions: string[]): string[] {
  if (!query || query.length < 2) return []

  const lowercaseQuery = query.toLowerCase()

  return suggestions
    .filter(suggestion =>
      suggestion.toLowerCase().includes(lowercaseQuery)
    )
    .sort((a, b) => {
      const aIndex = a.toLowerCase().indexOf(lowercaseQuery)
      const bIndex = b.toLowerCase().indexOf(lowercaseQuery)

      // Prioritize matches at the beginning
      if (aIndex !== bIndex) {
        return aIndex - bIndex
      }

      // Then by length (shorter first)
      return a.length - b.length
    })
    .slice(0, 10) // Limit to 10 suggestions
}

/**
 * Parse search query into terms and filters
 */
export function parseSearchQuery(query: string): {
  terms: string[]
  filters: Record<string, string>
} {
  const terms: string[] = []
  const filters: Record<string, string> = {}

  // Split by spaces but preserve quoted strings
  const parts = query.match(/(?:[^\s"]+|"[^"]*")+/g) || []

  parts.forEach(part => {
    // Check if it's a filter (key:value)
    const filterMatch = part.match(/^(\w+):(.+)$/)

    if (filterMatch) {
      const [, key, value] = filterMatch
      filters[key] = value.replace(/"/g, '') // Remove quotes
    } else {
      // It's a search term
      terms.push(part.replace(/"/g, '')) // Remove quotes
    }
  })

  return { terms, filters }
}

/**
 * Create search ranking score
 */
export function calculateSearchScore(text: string, query: string): number {
  if (!query || !text) return 0

  const lowercaseText = text.toLowerCase()
  const lowercaseQuery = query.toLowerCase()
  const terms = lowercaseQuery.split(' ').filter(term => term.length > 0)

  let score = 0

  terms.forEach(term => {
    // Exact match at beginning gets highest score
    if (lowercaseText.startsWith(term)) {
      score += 100
    }
    // Word boundary match gets high score
    else if (lowercaseText.includes(` ${term}`)) {
      score += 50
    }
    // Any match gets base score
    else if (lowercaseText.includes(term)) {
      score += 10
    }

    // Bonus for exact query match
    if (lowercaseText.includes(lowercaseQuery)) {
      score += 25
    }
  })

  // Penalty for length difference
  const lengthDiff = Math.abs(text.length - query.length)
  score -= lengthDiff * 0.1

  return Math.max(0, score)
}

/**
 * Fuzzy search implementation
 */
export function fuzzySearch(items: string[], query: string, threshold: number = 0.6): string[] {
  if (!query) return items

  const results = items
    .map(item => ({
      item,
      score: calculateLevenshteinDistance(item.toLowerCase(), query.toLowerCase()),
    }))
    .filter(result => {
      const maxLength = Math.max(result.item.length, query.length)
      const similarity = (maxLength - result.score) / maxLength
      return similarity >= threshold
    })
    .sort((a, b) => a.score - b.score)
    .map(result => result.item)

  return results
}

/**
 * Calculate Levenshtein distance between two strings
 */
function calculateLevenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Create search index for faster searching
 */
export class SearchIndex {
  private index: Map<string, Set<number>> = new Map()
  private items: any[] = []

  constructor(items: any[], fields: string[]) {
    this.items = items
    this.buildIndex(fields)
  }

  private buildIndex(fields: string[]) {
    this.items.forEach((item, index) => {
      fields.forEach(field => {
        const value = this.getNestedValue(item, field)
        if (value) {
          const words = this.tokenize(String(value))
          words.forEach(word => {
            if (!this.index.has(word)) {
              this.index.set(word, new Set())
            }
            this.index.get(word)!.add(index)
          })
        }
      })
    })
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 1) // Filter short words
  }

  search(query: string): any[] {
    const words = this.tokenize(query)
    if (words.length === 0) return []

    let resultIndices: Set<number> | null = null

    words.forEach(word => {
      const wordIndices = this.index.get(word) || new Set()

      if (resultIndices === null) {
        resultIndices = new Set(wordIndices)
      } else {
        // Intersection for AND search
        resultIndices = new Set([...resultIndices].filter(index => wordIndices.has(index)))
      }
    })

    return resultIndices ? [...resultIndices].map(index => this.items[index]) : []
  }
}

export default {
  buildSearchFilters,
  highlightSearchTerms,
  getSearchSuggestions,
  parseSearchQuery,
  calculateSearchScore,
  fuzzySearch,
  SearchIndex,
}