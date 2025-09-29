# Changelog

All notable changes to the `@koperasi-sinoman/utils` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of comprehensive utility package
- Indonesian localization support for validation and formatting
- Complete TypeScript type definitions
- Modular export structure for tree-shaking
- Comprehensive test suite with high coverage targets

### Features

#### Validation Module
- NIK (Indonesian National ID) validation with format checking
- NPWP (Indonesian Tax ID) validation with checksum verification
- Indonesian phone number validation using libphonenumber-js
- Email validation with RFC 5322 compliance
- Password strength validation with Indonesian feedback
- Postal code validation for Indonesian format
- Bank account number validation
- URL validation with security checks
- Credit card validation using Luhn algorithm

#### Formatting Module
- Indonesian Rupiah currency formatting with locale support
- Number formatting with Indonesian decimal separators
- NIK and NPWP formatting with proper separators
- Phone number formatting (international, national, clean)
- Indonesian address formatting with proper components
- Name formatting with Indonesian conventions
- File size formatting (binary and decimal units)
- Duration formatting in Indonesian language
- Text truncation with ellipsis
- Sensitive data masking (email, phone, bank accounts)
- Number to Indonesian words conversion

#### Date Module
- Date formatting with Indonesian locale using date-fns
- Relative time in Indonesian language
- Age calculation from birth date
- Indonesian day and month names
- Business day calculations
- Date range utilities and validation
- Indonesian timezone support (Asia/Jakarta)
- Fiscal year calculations
- Holiday checking for Indonesian calendar

#### Number Module
- Mathematical utilities (rounding, clamping, ranges)
- Financial calculations (compound interest, loan payments)
- Indonesian financial calculations (zakat, PPh21 tax)
- Statistical functions (average, median, mode, standard deviation)
- Array statistics and aggregations
- Prime number checking and mathematical sequences
- Number base conversion utilities
- Safe division operations

#### String Module
- Case conversion (camelCase, PascalCase, snake_case, kebab-case)
- URL-friendly slug generation
- Text truncation and word wrapping
- Email and URL extraction from text
- HTML tag stripping and entity escaping
- Random string generation with custom charsets
- String similarity calculation (Levenshtein distance)
- Indonesian text processing (stop words, name formatting)
- Palindrome checking and text reversal
- String chunking and character manipulation

#### Array Module
- Array deduplication and uniqueness by key
- Array chunking and flattening
- Grouping and sorting by multiple criteria
- Array shuffling and random sampling
- Set operations (intersection, difference, union)
- Array statistics and aggregations
- Array rotation and manipulation
- Partition by predicate functions
- Array equality checking (shallow and deep)

#### Object Module
- Deep cloning and merging
- Safe nested property access and modification
- Object flattening and unflattening
- Property picking and omitting
- Object transformation (mapValues, mapKeys)
- Object filtering and validation
- Deep equality comparison
- Object difference detection
- Query string conversion utilities

#### Crypto Module
- Secure random string and ID generation
- Password hashing with PBKDF2
- Hash functions (MD5, SHA1, SHA256, SHA512)
- HMAC generation with secrets
- Base64 and hex encoding/decoding
- Time-based token generation
- OTP (One-Time Password) generation
- API key and session token generation
- Sensitive data masking for logs
- Constant-time string comparison

#### File Module
- File size formatting and parsing
- File type detection by extension
- MIME type mapping
- File validation with size and type constraints
- Filename sanitization and unique generation
- File category classification
- Path manipulation utilities
- File info extraction and metadata

#### URL Module
- URL validation and parsing
- Query parameter manipulation
- URL building and joining
- Domain extraction and validation
- External URL detection
- URL normalization and cleaning
- Data URL creation and parsing
- Slug generation from text
- URL shortening for display

#### Error Module
- Custom error classes with context
- Error factory functions
- Safe async/sync operation wrappers
- Retry logic with exponential backoff
- Error aggregation for batch operations
- Error handling utilities
- Operational vs programming error classification

#### Constants Module
- Indonesian provinces and cities
- Indonesian bank codes and names
- Currency definitions and formatting rules
- Date and time format constants
- File size and validation limits
- HTTP status codes and error codes
- MIME type definitions
- Regex patterns for validation
- Cooperative-specific constants (savings types, membership levels)
- Admin roles and permissions
- Indonesian stop words for text processing

### Development Features
- Comprehensive ESLint configuration with TypeScript rules
- Prettier formatting with consistent code style
- Vitest testing framework with coverage reporting
- TypeScript strict mode with advanced type checking
- Bundle size monitoring with size-limit
- TypeDoc documentation generation
- CI/CD pipeline configuration
- Benchmark testing support

### Dependencies
- `date-fns`: Modern date utility library with localization
- `date-fns-tz`: Timezone support for date-fns
- `libphonenumber-js`: International phone number validation
- `nanoid`: URL-safe unique ID generator
- `slug`: URL slug generation
- `validator`: String validation library

### Peer Dependencies
- `zod`: Optional schema validation integration

## [1.0.0] - 2024-09-29

### Added
- Initial package setup and configuration
- Complete module structure with comprehensive utilities
- Indonesian localization support
- Full TypeScript support with strict type checking
- Comprehensive documentation and examples
- Development tooling and CI configuration