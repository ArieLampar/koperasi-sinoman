/**
 * Object utilities and manipulation functions
 */

// Deep clone object
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj) as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T
  if (typeof obj === 'object') {
    const cloned = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
  return obj
}

// Get nested value safely
export function get<T = any>(
  obj: any,
  path: string | string[],
  defaultValue?: T
): T {
  const pathArray = Array.isArray(path) ? path : path.split('.')

  let current = obj
  for (const key of pathArray) {
    if (current == null || typeof current !== 'object') {
      return defaultValue as T
    }
    current = current[key]
  }

  return current === undefined ? defaultValue as T : current
}

// Set nested value
export function set<T extends object>(
  obj: T,
  path: string | string[],
  value: any
): T {
  const pathArray = Array.isArray(path) ? path : path.split('.')
  const result = deepClone(obj)

  let current: any = result
  for (let i = 0; i < pathArray.length - 1; i++) {
    const key = pathArray[i]
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }

  current[pathArray[pathArray.length - 1]] = value
  return result
}

// Delete nested property
export function unset<T extends object>(
  obj: T,
  path: string | string[]
): T {
  const pathArray = Array.isArray(path) ? path : path.split('.')
  const result = deepClone(obj)

  let current: any = result
  for (let i = 0; i < pathArray.length - 1; i++) {
    const key = pathArray[i]
    if (!(key in current) || typeof current[key] !== 'object') {
      return result
    }
    current = current[key]
  }

  delete current[pathArray[pathArray.length - 1]]
  return result
}

// Check if object has nested property
export function has(obj: any, path: string | string[]): boolean {
  const pathArray = Array.isArray(path) ? path : path.split('.')

  let current = obj
  for (const key of pathArray) {
    if (current == null || typeof current !== 'object' || !(key in current)) {
      return false
    }
    current = current[key]
  }

  return true
}

// Merge objects deeply
export function merge<T extends object>(...objects: Partial<T>[]): T {
  const result = {} as T

  for (const obj of objects) {
    if (!obj || typeof obj !== 'object') continue

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key]

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          result[key] = merge(result[key] || {}, value) as T[Extract<keyof T, string>]
        } else {
          result[key] = value as T[Extract<keyof T, string>]
        }
      }
    }
  }

  return result
}

// Pick specific keys from object
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>

  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }

  return result
}

// Omit specific keys from object
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = {} as Omit<T, K>
  const keysToOmit = new Set(keys)

  for (const key in obj) {
    if (obj.hasOwnProperty(key) && !keysToOmit.has(key as K)) {
      ;(result as any)[key] = obj[key]
    }
  }

  return result
}

// Get object keys with type safety
export function keys<T extends object>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>
}

// Get object values with type safety
export function values<T extends object>(obj: T): Array<T[keyof T]> {
  return Object.values(obj)
}

// Get object entries with type safety
export function entries<T extends object>(obj: T): Array<[keyof T, T[keyof T]]> {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>
}

// Transform object values
export function mapValues<T extends object, U>(
  obj: T,
  mapper: (value: T[keyof T], key: keyof T) => U
): Record<keyof T, U> {
  const result = {} as Record<keyof T, U>

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = mapper(obj[key], key)
    }
  }

  return result
}

// Transform object keys
export function mapKeys<T extends object, K extends string | number | symbol>(
  obj: T,
  mapper: (key: keyof T, value: T[keyof T]) => K
): Record<K, T[keyof T]> {
  const result = {} as Record<K, T[keyof T]>

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = mapper(key, obj[key])
      result[newKey] = obj[key]
    }
  }

  return result
}

// Filter object by predicate
export function filter<T extends object>(
  obj: T,
  predicate: (value: T[keyof T], key: keyof T) => boolean
): Partial<T> {
  const result = {} as Partial<T>

  for (const key in obj) {
    if (obj.hasOwnProperty(key) && predicate(obj[key], key)) {
      result[key] = obj[key]
    }
  }

  return result
}

// Check if object is empty
export function isEmpty(obj: any): boolean {
  if (obj == null) return true
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0
  if (obj instanceof Map || obj instanceof Set) return obj.size === 0
  return Object.keys(obj).length === 0
}

// Check if value is object
export function isObject(value: any): value is object {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

// Check if value is plain object
export function isPlainObject(value: any): value is Record<string, any> {
  if (!isObject(value)) return false

  if (Object.getPrototypeOf(value) === null) return true

  let proto = value
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }

  return Object.getPrototypeOf(value) === proto
}

// Flatten nested object
export function flatten(
  obj: any,
  prefix: string = '',
  separator: string = '.'
): Record<string, any> {
  const result: Record<string, any> = {}

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}${separator}${key}` : key
      const value = obj[key]

      if (isPlainObject(value)) {
        Object.assign(result, flatten(value, newKey, separator))
      } else {
        result[newKey] = value
      }
    }
  }

  return result
}

// Unflatten object
export function unflatten(
  obj: Record<string, any>,
  separator: string = '.'
): any {
  const result: any = {}

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      set(result, key.split(separator), obj[key])
    }
  }

  return result
}

// Invert object (swap keys and values)
export function invert<T extends Record<string | number, string | number>>(
  obj: T
): Record<T[keyof T], keyof T> {
  const result = {} as Record<T[keyof T], keyof T>

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key]
      result[value] = key
    }
  }

  return result
}

// Group object entries by function result
export function groupBy<T extends object, K extends string | number>(
  obj: T,
  grouper: (value: T[keyof T], key: keyof T) => K
): Record<K, Array<[keyof T, T[keyof T]]>> {
  const result = {} as Record<K, Array<[keyof T, T[keyof T]]>>

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const group = grouper(obj[key], key)
      if (!result[group]) {
        result[group] = []
      }
      result[group].push([key, obj[key]])
    }
  }

  return result
}

// Deep comparison of objects
export function isEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true

  if (obj1 == null || obj2 == null) return false

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false
    return obj1.every((item, index) => isEqual(item, obj2[index]))
  }

  if (isPlainObject(obj1) && isPlainObject(obj2)) {
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    if (keys1.length !== keys2.length) return false

    return keys1.every(key => isEqual(obj1[key], obj2[key]))
  }

  return false
}

// Find differences between objects
export interface ObjectDiff {
  added: Record<string, any>
  removed: Record<string, any>
  changed: Record<string, { from: any; to: any }>
}

export function diff(obj1: any, obj2: any): ObjectDiff {
  const added: Record<string, any> = {}
  const removed: Record<string, any> = {}
  const changed: Record<string, { from: any; to: any }> = {}

  const flattened1 = flatten(obj1)
  const flattened2 = flatten(obj2)

  // Find added and changed
  for (const key in flattened2) {
    if (!(key in flattened1)) {
      added[key] = flattened2[key]
    } else if (!isEqual(flattened1[key], flattened2[key])) {
      changed[key] = { from: flattened1[key], to: flattened2[key] }
    }
  }

  // Find removed
  for (const key in flattened1) {
    if (!(key in flattened2)) {
      removed[key] = flattened1[key]
    }
  }

  return { added, removed, changed }
}

// Remove null and undefined values
export function compact<T extends object>(obj: T): Partial<T> {
  const result = {} as Partial<T>

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key]
      if (value !== null && value !== undefined) {
        result[key] = value
      }
    }
  }

  return result
}

// Remove null, undefined, and empty values
export function compactDeep<T extends object>(obj: T): Partial<T> {
  const result = {} as Partial<T>

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key]

      if (value === null || value === undefined) continue

      if (isPlainObject(value)) {
        const compacted = compactDeep(value)
        if (!isEmpty(compacted)) {
          result[key] = compacted as T[Extract<keyof T, string>]
        }
      } else if (Array.isArray(value)) {
        const filtered = value.filter(item => item !== null && item !== undefined)
        if (filtered.length > 0) {
          result[key] = filtered as T[Extract<keyof T, string>]
        }
      } else if (value !== '' && value !== false) {
        result[key] = value
      }
    }
  }

  return result
}

// Convert object to query string
export function toQueryString(obj: Record<string, any>): string {
  const params = new URLSearchParams()

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key]
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(item => params.append(key, String(item)))
        } else {
          params.set(key, String(value))
        }
      }
    }
  }

  return params.toString()
}

// Parse query string to object
export function fromQueryString(queryString: string): Record<string, any> {
  const params = new URLSearchParams(queryString)
  const result: Record<string, any> = {}

  for (const [key, value] of params) {
    if (key in result) {
      if (Array.isArray(result[key])) {
        result[key].push(value)
      } else {
        result[key] = [result[key], value]
      }
    } else {
      result[key] = value
    }
  }

  return result
}