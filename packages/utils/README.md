# @koperasi-sinoman/utils

Shared utility functions and helpers for Koperasi Sinoman applications with Indonesian localization.

## 🚀 Features

- **Indonesian Localization** - Built-in support for Indonesian formats, validation, and business rules
- **Type-Safe** - Full TypeScript support with comprehensive type definitions
- **Modular** - Import only what you need with tree-shaking support
- **Comprehensive** - Covers validation, formatting, date/time, crypto, file handling, and more
- **Well-Tested** - Comprehensive test suite with high coverage
- **Zero Dependencies** - Minimal external dependencies for better security and performance

## 📦 Installation

```bash
npm install @koperasi-sinoman/utils
```

### Peer Dependencies

```bash
npm install zod  # Optional, for schema validation integration
```

## 🛠️ Usage

### Import Everything

```typescript
import { validateNIK, formatCurrency, generateId } from '@koperasi-sinoman/utils'

// Validate Indonesian NIK
const isValid = validateNIK('1234567890123456')

// Format currency in Indonesian Rupiah
const formatted = formatCurrency(1500000) // "Rp 1.500.000"

// Generate secure ID
const id = generateId()
```

### Modular Imports

```typescript
// Import specific modules
import { validateNIK } from '@koperasi-sinoman/utils/validation'
import { formatCurrency } from '@koperasi-sinoman/utils/formatting'
import { generateId } from '@koperasi-sinoman/utils/crypto'
```

## 📚 Modules

### Validation

Indonesian-specific validation functions:

```typescript
import {
  validateNIK,
  validatePhoneNumber,
  validateEmail,
  validatePasswordStrength,
  validatePostalCode,
  validateNPWP,
  validateIndonesianID
} from '@koperasi-sinoman/utils/validation'

// NIK validation
const isValidNIK = validateNIK('1234567890123456')

// Phone number validation (Indonesian format)
const isValidPhone = validatePhoneNumber('081234567890')

// Email validation
const isValidEmail = validateEmail('user@example.com')

// Password strength validation
const passwordResult = validatePasswordStrength('MyPassword123!')
// { isValid: true, score: 5, feedback: [] }

// NPWP validation
const isValidNPWP = validateNPWP('123456789012345')

// Multi-format ID validation
const idResult = validateIndonesianID('1234567890123456')
// { isValid: true, type: 'nik', formatted: '12.34.56.789012.3456' }
```

### Formatting

Indonesian localization and formatting:

```typescript
import {
  formatCurrency,
  formatNumber,
  formatNIK,
  formatNPWP,
  formatPhoneNumber,
  formatAddress,
  formatName,
  maskEmail,
  numberToWords
} from '@koperasi-sinoman/utils/formatting'

// Currency formatting
const currency = formatCurrency(1500000) // "Rp 1.500.000"
const currencyNoSymbol = formatCurrency(1500000, { showSymbol: false }) // "1.500.000"

// Number formatting
const number = formatNumber(1234.56) // "1.234,56"

// NIK formatting
const nik = formatNIK('1234567890123456') // "12.34.56.789012.3456"

// Phone number formatting
const phone = formatPhoneNumber('081234567890', 'national') // "0812-3456-7890"

// Address formatting
const address = formatAddress({
  street: 'Jl. Merdeka No. 123',
  village: 'Tonatan',
  district: 'Ponorogo',
  city: 'Ponorogo',
  province: 'Jawa Timur',
  postalCode: '63411'
}) // "Jl. Merdeka No. 123, Kel. Tonatan, Kec. Ponorogo, Ponorogo, Jawa Timur, 63411"

// Mask sensitive data
const maskedEmail = maskEmail('user@example.com') // "u***@example.com"

// Number to Indonesian words
const words = numberToWords(1500000) // "satu juta lima ratus ribu"
```

### Date Utilities

Date handling with Indonesian locale:

```typescript
import {
  formatDate,
  getRelativeTime,
  calculateAge,
  getDayName,
  getMonthName,
  isBusinessDay,
  addBusinessDays,
  getThisMonth
} from '@koperasi-sinoman/utils/date'

// Format date in Indonesian
const formatted = formatDate(new Date(), 'dd MMMM yyyy') // "29 September 2024"

// Relative time in Indonesian
const relative = getRelativeTime(new Date(Date.now() - 3600000)) // "1 jam yang lalu"

// Calculate age
const age = calculateAge('1990-05-15') // 34

// Get Indonesian day name
const day = getDayName(new Date()) // "Minggu"

// Business days
const isWorkingDay = isBusinessDay(new Date())
const nextBusinessDay = addBusinessDays(new Date(), 5)

// Date ranges
const thisMonth = getThisMonth()
// { start: Date, end: Date }
```

### Number Utilities

Mathematical and financial calculations:

```typescript
import {
  roundTo,
  clamp,
  calculateCompoundInterest,
  calculateLoanPayment,
  calculateZakat,
  calculatePPh21,
  sum,
  average,
  median
} from '@koperasi-sinoman/utils/number'

// Round to decimal places
const rounded = roundTo(3.14159, 2) // 3.14

// Clamp between min/max
const clamped = clamp(15, 0, 10) // 10

// Financial calculations
const interest = calculateCompoundInterest(1000000, 5, 2) // Calculate 5% compound interest over 2 years
const payment = calculateLoanPayment(10000000, 12, 36) // Monthly payment for 10M loan at 12% for 36 months
const zakat = calculateZakat(100000000) // Calculate zakat (2.5% if above nisab)

// Array statistics
const total = sum([1, 2, 3, 4, 5]) // 15
const avg = average([1, 2, 3, 4, 5]) // 3
const mid = median([1, 2, 3, 4, 5]) // 3
```

### String Utilities

Text manipulation and processing:

```typescript
import {
  capitalize,
  toCamelCase,
  toSnakeCase,
  createSlug,
  truncate,
  extractEmails,
  stripHtml,
  generateId,
  similarity,
  formatIndonesianName
} from '@koperasi-sinoman/utils/string'

// Case conversion
const capitalized = capitalize('hello world') // "Hello world"
const camelCase = toCamelCase('hello world') // "helloWorld"
const snakeCase = toSnakeCase('Hello World') // "hello_world"

// URL slug
const slug = createSlug('Hello World!') // "hello-world"

// Text processing
const truncated = truncate('Long text here', 10) // "Long te..."
const emails = extractEmails('Contact us at info@example.com or admin@test.com')
const clean = stripHtml('<p>Hello <strong>World</strong></p>') // "Hello World"

// Generate random ID
const id = generateId(8) // "aB3dE9fG"

// String similarity
const similar = similarity('hello', 'helo') // 80

// Indonesian name formatting
const name = formatIndonesianName('budi santoso bin ahmad') // "Budi Santoso bin Ahmad"
```

### Array Utilities

Array manipulation and processing:

```typescript
import {
  unique,
  chunk,
  groupBy,
  sortBy,
  shuffle,
  intersection,
  difference,
  partition
} from '@koperasi-sinoman/utils/array'

// Remove duplicates
const uniqueArray = unique([1, 2, 2, 3, 3, 4]) // [1, 2, 3, 4]

// Chunk into smaller arrays
const chunks = chunk([1, 2, 3, 4, 5, 6], 2) // [[1, 2], [3, 4], [5, 6]]

// Group by key
const grouped = groupBy(
  [{ type: 'A', value: 1 }, { type: 'B', value: 2 }, { type: 'A', value: 3 }],
  item => item.type
) // { A: [...], B: [...] }

// Sort by multiple criteria
const sorted = sortBy(users, user => user.name, user => user.age)

// Shuffle randomly
const shuffled = shuffle([1, 2, 3, 4, 5])

// Set operations
const common = intersection([1, 2, 3], [2, 3, 4]) // [2, 3]
const diff = difference([1, 2, 3], [2, 3, 4]) // [1]

// Partition by condition
const [even, odd] = partition([1, 2, 3, 4, 5], n => n % 2 === 0)
```

### Object Utilities

Object manipulation and comparison:

```typescript
import {
  deepClone,
  get,
  set,
  merge,
  pick,
  omit,
  flatten,
  isEqual,
  diff
} from '@koperasi-sinoman/utils/object'

const obj = { a: { b: { c: 1 } }, d: 2 }

// Deep clone
const cloned = deepClone(obj)

// Safe property access
const value = get(obj, 'a.b.c', 0) // 1
const missing = get(obj, 'a.b.x', 'default') // 'default'

// Set nested property
const updated = set(obj, 'a.b.x', 10)

// Merge objects
const merged = merge({ a: 1 }, { b: 2 }, { c: 3 })

// Pick/omit properties
const picked = pick(obj, ['a', 'd'])
const omitted = omit(obj, ['d'])

// Flatten nested object
const flat = flatten({ a: { b: 1, c: 2 } }) // { 'a.b': 1, 'a.c': 2 }

// Compare objects
const equal = isEqual(obj1, obj2)
const changes = diff(obj1, obj2) // { added: {}, removed: {}, changed: {} }
```

### Crypto Utilities

Cryptographic functions and security:

```typescript
import {
  generateId,
  generateSecureToken,
  hashPassword,
  verifyPassword,
  sha256,
  hmacSha256,
  generateOTP,
  maskSensitiveData
} from '@koperasi-sinoman/utils/crypto'

// Generate secure IDs
const id = generateId() // URL-safe random ID
const token = generateSecureToken(32) // Hex token
const numericId = generateNumericId(6) // "123456"

// Password hashing
const { hash, salt } = hashPassword('mypassword')
const isValid = verifyPassword('mypassword', hash, salt)

// Hashing
const hashed = sha256('data to hash')
const hmac = hmacSha256('data', 'secret')

// OTP generation
const otp = generateOTP(6) // "123456"

// Mask sensitive data
const masked = maskSensitiveData('1234567890123456', 4) // "1234********3456"
```

### File Utilities

File handling and validation:

```typescript
import {
  formatFileSize,
  getFileExtension,
  isImageFile,
  getMimeType,
  sanitizeFilename,
  validateFile,
  getFileInfo
} from '@koperasi-sinoman/utils/file'

// File size formatting
const size = formatFileSize(1536) // "1.5 KB"

// File extension
const ext = getFileExtension('document.pdf') // "pdf"

// File type checking
const isImage = isImageFile('photo.jpg') // true

// MIME type
const mime = getMimeType('document.pdf') // "application/pdf"

// Sanitize filename
const safe = sanitizeFilename('My Document (1).pdf') // "my_document_1.pdf"

// File validation
const validation = validateFile('photo.jpg', 2048000, {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['jpg', 'png', 'gif']
})

// File info
const info = getFileInfo('photo.jpg', 2048000)
// { name, extension, size, mimeType, isImage: true, ... }
```

### URL Utilities

URL manipulation and validation:

```typescript
import {
  isValidUrl,
  parseUrl,
  addQueryParams,
  getQueryParams,
  buildUrl,
  normalizeUrl,
  isExternalUrl
} from '@koperasi-sinoman/utils/url'

// URL validation
const valid = isValidUrl('https://example.com') // true

// Parse URL
const parsed = parseUrl('https://example.com/path?param=value')
// { protocol, hostname, pathname, search, ... }

// Add query parameters
const withParams = addQueryParams('https://example.com', { page: 1, limit: 10 })

// Extract query parameters
const params = getQueryParams('https://example.com?page=1&limit=10')
// { page: "1", limit: "10" }

// Build URL
const built = buildUrl('https://example.com', '/api/users', { page: 1 }, 'section')

// Normalize URL
const normalized = normalizeUrl('HTTPS://Example.COM/Path//')

// Check if external
const external = isExternalUrl('https://google.com', 'https://example.com') // true
```

### Error Handling

Custom error classes and utilities:

```typescript
import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  safeAsync,
  retry,
  ErrorAggregator
} from '@koperasi-sinoman/utils/error'

// Custom errors
throw new ValidationError('Invalid email format', 'email', 'invalid@')
throw new NotFoundError('User not found', 'User', 123)
throw new AuthenticationError('Invalid credentials')

// Safe async operations
const [result, error] = await safeAsync(async () => {
  return await riskyOperation()
})

// Retry with exponential backoff
const result = await retry(
  () => unreliableApiCall(),
  { maxAttempts: 3, baseDelay: 1000 }
)

// Error aggregation for batch operations
const aggregator = new ErrorAggregator()
aggregator.addError(0, new Error('First error'))
aggregator.addError(5, new Error('Second error'))
aggregator.throwIfHasErrors() // Throws combined error
```

### Constants

Common constants and enums:

```typescript
import {
  INDONESIAN_PROVINCES,
  MAJOR_INDONESIAN_CITIES,
  INDONESIAN_BANKS,
  CURRENCIES,
  HTTP_STATUS,
  REGEX_PATTERNS,
  MEMBERSHIP_TYPES,
  ADMIN_ROLES,
  PERMISSIONS
} from '@koperasi-sinoman/utils/constants'

// Use predefined constants
const provinces = INDONESIAN_PROVINCES
const status = HTTP_STATUS.NOT_FOUND // 404
const emailRegex = REGEX_PATTERNS.EMAIL
const roles = ADMIN_ROLES.SUPER_ADMIN // 'super_admin'
```

## 🔧 Development

### Setup

```bash
# Install dependencies
npm install

# Build package
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type check
npm run type-check

# Lint
npm run lint
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📄 License

MIT © Koperasi Sinoman

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For questions and support, please open an issue on [GitHub](https://github.com/koperasi-sinoman/koperasi-sinoman/issues).