/**
 * Array utilities and manipulation functions
 */

// Remove duplicates from array
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

// Remove duplicates by key
export function uniqueBy<T, K>(arr: T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>()
  return arr.filter(item => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// Chunk array into smaller arrays
export function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return []
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

// Flatten nested array
export function flatten<T>(arr: (T | T[])[]): T[] {
  return arr.reduce<T[]>((acc, item) => {
    return acc.concat(Array.isArray(item) ? flatten(item) : item)
  }, [])
}

// Group array by key
export function groupBy<T, K extends string | number>(
  arr: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return arr.reduce((groups, item) => {
    const key = keyFn(item)
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
    return groups
  }, {} as Record<K, T[]>)
}

// Sort array by multiple keys
export function sortBy<T>(
  arr: T[],
  ...sortFns: Array<(item: T) => any>
): T[] {
  return [...arr].sort((a, b) => {
    for (const sortFn of sortFns) {
      const aVal = sortFn(a)
      const bVal = sortFn(b)
      if (aVal < bVal) return -1
      if (aVal > bVal) return 1
    }
    return 0
  })
}

// Find index of item by predicate
export function findIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  return arr.findIndex(predicate)
}

// Find last index of item by predicate
export function findLastIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return i
  }
  return -1
}

// Remove items by predicate
export function remove<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  return arr.filter(item => !predicate(item))
}

// Remove item at index
export function removeAt<T>(arr: T[], index: number): T[] {
  if (index < 0 || index >= arr.length) return [...arr]
  return arr.slice(0, index).concat(arr.slice(index + 1))
}

// Insert item at index
export function insertAt<T>(arr: T[], index: number, item: T): T[] {
  if (index < 0) index = 0
  if (index > arr.length) index = arr.length
  return arr.slice(0, index).concat(item, arr.slice(index))
}

// Move item from one index to another
export function move<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || fromIndex >= arr.length) return [...arr]
  if (toIndex < 0) toIndex = 0
  if (toIndex >= arr.length) toIndex = arr.length - 1

  const result = [...arr]
  const [item] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, item)
  return result
}

// Shuffle array randomly
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Get random item from array
export function sample<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined
  return arr[Math.floor(Math.random() * arr.length)]
}

// Get multiple random items from array
export function sampleSize<T>(arr: T[], n: number): T[] {
  if (n <= 0) return []
  if (n >= arr.length) return shuffle(arr)

  const shuffled = shuffle(arr)
  return shuffled.slice(0, n)
}

// Partition array into two arrays based on predicate
export function partition<T>(
  arr: T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  const truthy: T[] = []
  const falsy: T[] = []

  for (const item of arr) {
    if (predicate(item)) {
      truthy.push(item)
    } else {
      falsy.push(item)
    }
  }

  return [truthy, falsy]
}

// Get intersection of two arrays
export function intersection<T>(arr1: T[], arr2: T[]): T[] {
  const set2 = new Set(arr2)
  return unique(arr1.filter(item => set2.has(item)))
}

// Get difference between two arrays
export function difference<T>(arr1: T[], arr2: T[]): T[] {
  const set2 = new Set(arr2)
  return arr1.filter(item => !set2.has(item))
}

// Get union of two arrays
export function union<T>(...arrays: T[][]): T[] {
  return unique(arrays.flat())
}

// Check if array includes all items
export function includesAll<T>(arr: T[], items: T[]): boolean {
  const set = new Set(arr)
  return items.every(item => set.has(item))
}

// Check if array includes any item
export function includesAny<T>(arr: T[], items: T[]): boolean {
  const set = new Set(arr)
  return items.some(item => set.has(item))
}

// Get min value from array
export function min(arr: number[]): number | undefined {
  return arr.length > 0 ? Math.min(...arr) : undefined
}

// Get max value from array
export function max(arr: number[]): number | undefined {
  return arr.length > 0 ? Math.max(...arr) : undefined
}

// Get min item by key
export function minBy<T>(arr: T[], keyFn: (item: T) => number): T | undefined {
  if (arr.length === 0) return undefined

  let minItem = arr[0]
  let minValue = keyFn(minItem)

  for (let i = 1; i < arr.length; i++) {
    const value = keyFn(arr[i])
    if (value < minValue) {
      minValue = value
      minItem = arr[i]
    }
  }

  return minItem
}

// Get max item by key
export function maxBy<T>(arr: T[], keyFn: (item: T) => number): T | undefined {
  if (arr.length === 0) return undefined

  let maxItem = arr[0]
  let maxValue = keyFn(maxItem)

  for (let i = 1; i < arr.length; i++) {
    const value = keyFn(arr[i])
    if (value > maxValue) {
      maxValue = value
      maxItem = arr[i]
    }
  }

  return maxItem
}

// Sum array of numbers
export function sum(arr: number[]): number {
  return arr.reduce((acc, num) => acc + num, 0)
}

// Sum array by key
export function sumBy<T>(arr: T[], keyFn: (item: T) => number): number {
  return arr.reduce((acc, item) => acc + keyFn(item), 0)
}

// Get average of array
export function average(arr: number[]): number {
  return arr.length > 0 ? sum(arr) / arr.length : 0
}

// Get average by key
export function averageBy<T>(arr: T[], keyFn: (item: T) => number): number {
  return arr.length > 0 ? sumBy(arr, keyFn) / arr.length : 0
}

// Count occurrences of each item
export function countBy<T, K extends string | number>(
  arr: T[],
  keyFn: (item: T) => K
): Record<K, number> {
  return arr.reduce((counts, item) => {
    const key = keyFn(item)
    counts[key] = (counts[key] || 0) + 1
    return counts
  }, {} as Record<K, number>)
}

// Take first n items
export function take<T>(arr: T[], n: number): T[] {
  return arr.slice(0, Math.max(0, n))
}

// Take last n items
export function takeLast<T>(arr: T[], n: number): T[] {
  return arr.slice(Math.max(0, arr.length - n))
}

// Take items while predicate is true
export function takeWhile<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  const result: T[] = []
  for (const item of arr) {
    if (!predicate(item)) break
    result.push(item)
  }
  return result
}

// Drop first n items
export function drop<T>(arr: T[], n: number): T[] {
  return arr.slice(Math.max(0, n))
}

// Drop last n items
export function dropLast<T>(arr: T[], n: number): T[] {
  return arr.slice(0, Math.max(0, arr.length - n))
}

// Drop items while predicate is true
export function dropWhile<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  let index = 0
  while (index < arr.length && predicate(arr[index])) {
    index++
  }
  return arr.slice(index)
}

// Check if array is empty
export function isEmpty<T>(arr: T[]): boolean {
  return arr.length === 0
}

// Create array of numbers in range
export function range(start: number, end?: number, step: number = 1): number[] {
  if (end === undefined) {
    end = start
    start = 0
  }

  if (step === 0) return []

  const result: number[] = []
  if (step > 0) {
    for (let i = start; i < end; i += step) {
      result.push(i)
    }
  } else {
    for (let i = start; i > end; i += step) {
      result.push(i)
    }
  }

  return result
}

// Create array with repeated value
export function repeat<T>(value: T, count: number): T[] {
  return Array(Math.max(0, count)).fill(value)
}

// Zip two arrays together
export function zip<T, U>(arr1: T[], arr2: U[]): Array<[T, U]> {
  const length = Math.min(arr1.length, arr2.length)
  const result: Array<[T, U]> = []

  for (let i = 0; i < length; i++) {
    result.push([arr1[i], arr2[i]])
  }

  return result
}

// Unzip array of pairs
export function unzip<T, U>(arr: Array<[T, U]>): [T[], U[]] {
  const first: T[] = []
  const second: U[] = []

  for (const [a, b] of arr) {
    first.push(a)
    second.push(b)
  }

  return [first, second]
}

// Rotate array left by n positions
export function rotateLeft<T>(arr: T[], n: number): T[] {
  if (arr.length === 0) return []
  n = n % arr.length
  if (n === 0) return [...arr]
  return arr.slice(n).concat(arr.slice(0, n))
}

// Rotate array right by n positions
export function rotateRight<T>(arr: T[], n: number): T[] {
  if (arr.length === 0) return []
  n = n % arr.length
  if (n === 0) return [...arr]
  return arr.slice(-n).concat(arr.slice(0, -n))
}

// Check if arrays are equal
export function isEqual<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false
  return arr1.every((item, index) => item === arr2[index])
}

// Check if arrays are equal (deep comparison)
export function isEqualDeep<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false

  return arr1.every((item, index) => {
    const other = arr2[index]

    if (Array.isArray(item) && Array.isArray(other)) {
      return isEqualDeep(item, other)
    }

    if (typeof item === 'object' && typeof other === 'object' && item !== null && other !== null) {
      return JSON.stringify(item) === JSON.stringify(other)
    }

    return item === other
  })
}