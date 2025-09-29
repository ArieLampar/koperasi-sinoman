/**
 * Constants and configuration values
 */

// Indonesian regions and provinces
export const INDONESIAN_PROVINCES = [
  { code: 'AC', name: 'Aceh' },
  { code: 'SU', name: 'Sumatera Utara' },
  { code: 'SB', name: 'Sumatera Barat' },
  { code: 'RI', name: 'Riau' },
  { code: 'KR', name: 'Kepulauan Riau' },
  { code: 'JA', name: 'Jambi' },
  { code: 'SS', name: 'Sumatera Selatan' },
  { code: 'BB', name: 'Bangka Belitung' },
  { code: 'BE', name: 'Bengkulu' },
  { code: 'LA', name: 'Lampung' },
  { code: 'JK', name: 'DKI Jakarta' },
  { code: 'JB', name: 'Jawa Barat' },
  { code: 'BT', name: 'Banten' },
  { code: 'JT', name: 'Jawa Tengah' },
  { code: 'YO', name: 'DI Yogyakarta' },
  { code: 'JI', name: 'Jawa Timur' },
  { code: 'BA', name: 'Bali' },
  { code: 'NB', name: 'Nusa Tenggara Barat' },
  { code: 'NT', name: 'Nusa Tenggara Timur' },
  { code: 'KB', name: 'Kalimantan Barat' },
  { code: 'KT', name: 'Kalimantan Tengah' },
  { code: 'KS', name: 'Kalimantan Selatan' },
  { code: 'KI', name: 'Kalimantan Timur' },
  { code: 'KU', name: 'Kalimantan Utara' },
  { code: 'SA', name: 'Sulawesi Utara' },
  { code: 'ST', name: 'Sulawesi Tengah' },
  { code: 'SN', name: 'Sulawesi Selatan' },
  { code: 'SG', name: 'Sulawesi Tenggara' },
  { code: 'GO', name: 'Gorontalo' },
  { code: 'SR', name: 'Sulawesi Barat' },
  { code: 'MA', name: 'Maluku' },
  { code: 'MU', name: 'Maluku Utara' },
  { code: 'PA', name: 'Papua' },
  { code: 'PB', name: 'Papua Barat' },
] as const

// Common Indonesian cities
export const MAJOR_INDONESIAN_CITIES = [
  'Jakarta',
  'Surabaya',
  'Bandung',
  'Bekasi',
  'Medan',
  'Tangerang',
  'Depok',
  'Semarang',
  'Palembang',
  'Makassar',
  'South Tangerang',
  'Batam',
  'Bogor',
  'Pekanbaru',
  'Bandar Lampung',
] as const

// Banking constants
export const INDONESIAN_BANKS = [
  { code: 'BCA', name: 'Bank Central Asia' },
  { code: 'BRI', name: 'Bank Rakyat Indonesia' },
  { code: 'BNI', name: 'Bank Negara Indonesia' },
  { code: 'BTN', name: 'Bank Tabungan Negara' },
  { code: 'MANDIRI', name: 'Bank Mandiri' },
  { code: 'CIMB', name: 'CIMB Niaga' },
  { code: 'DANAMON', name: 'Bank Danamon' },
  { code: 'PERMATA', name: 'Bank Permata' },
  { code: 'MEGA', name: 'Bank Mega' },
  { code: 'OCBC', name: 'OCBC NISP' },
  { code: 'PANIN', name: 'Panin Bank' },
  { code: 'UOB', name: 'UOB Indonesia' },
  { code: 'BII', name: 'Bank Internasional Indonesia' },
  { code: 'MUAMALAT', name: 'Bank Muamalat' },
  { code: 'BSM', name: 'Bank Syariah Mandiri' },
] as const

// Currency constants
export const CURRENCIES = {
  IDR: {
    code: 'IDR',
    name: 'Indonesian Rupiah',
    symbol: 'Rp',
    decimals: 0,
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimals: 2,
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    decimals: 2,
  },
} as const

// Date and time constants
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  ISO_DATETIME: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DISPLAY: 'DD MMMM YYYY',
  DISPLAY_SHORT: 'DD MMM YYYY',
  DISPLAY_WITH_DAY: 'dddd, DD MMMM YYYY',
  TIME: 'HH:mm',
  TIME_WITH_SECONDS: 'HH:mm:ss',
  DATETIME: 'DD MMMM YYYY HH:mm',
  DATETIME_SHORT: 'DD/MM/YYYY HH:mm',
} as const

export const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const

export const INDONESIAN_DAYS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const

export const INDONESIAN_DAYS_SHORT = [
  'Min',
  'Sen',
  'Sel',
  'Rab',
  'Kam',
  'Jum',
  'Sab',
] as const

// File size constants
export const FILE_SIZE_LIMITS = {
  AVATAR: 2 * 1024 * 1024, // 2MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  IMAGE: 5 * 1024 * 1024, // 5MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  GENERAL: 25 * 1024 * 1024, // 25MB
} as const

// Validation constants
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  NAME_MAX_LENGTH: 255,
  EMAIL_MAX_LENGTH: 320,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
  NIK_LENGTH: 16,
  NPWP_LENGTH: 15,
  POSTAL_CODE_LENGTH: 5,
} as const

// Indonesian phone number prefixes
export const INDONESIAN_PHONE_PREFIXES = [
  '0811', '0812', '0813', '0814', '0815', '0816', '0817', '0818', '0819', // Telkomsel
  '0821', '0822', '0823', '0824', '0825', '0826', '0827', '0828', // Telkomsel
  '0831', '0832', '0833', '0838', // Axis
  '0851', '0852', '0853', '0858', // Telkomsel
  '0855', '0856', '0857', '0858', // Indosat
  '0859', // XL
  '0877', '0878', // XL
  '0881', '0882', '0883', '0884', '0885', '0886', '0887', '0888', // Smartfren
  '0895', '0896', '0897', '0898', '0899', // Three
] as const

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const

// Common error codes
export const ERROR_CODES = {
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
} as const

// MIME types
export const MIME_TYPES = {
  // Images
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  GIF: 'image/gif',
  WEBP: 'image/webp',
  SVG: 'image/svg+xml',

  // Documents
  PDF: 'application/pdf',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLS: 'application/vnd.ms-excel',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  PPT: 'application/vnd.ms-powerpoint',
  PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  // Text
  TEXT: 'text/plain',
  HTML: 'text/html',
  CSS: 'text/css',
  JS: 'application/javascript',
  JSON: 'application/json',
  XML: 'application/xml',
  CSV: 'text/csv',

  // Archives
  ZIP: 'application/zip',
  RAR: 'application/vnd.rar',
  TAR: 'application/x-tar',
  GZIP: 'application/gzip',

  // Video
  MP4: 'video/mp4',
  AVI: 'video/x-msvideo',
  MOV: 'video/quicktime',
  WEBM: 'video/webm',

  // Audio
  MP3: 'audio/mpeg',
  WAV: 'audio/wav',
  OGG: 'audio/ogg',
  AAC: 'audio/aac',
} as const

// Cooperative-specific constants
export const SAVINGS_TYPES = {
  POKOK: 'POKOK',
  WAJIB: 'WAJIB',
  SUKARELA: 'SUKARELA',
  BERJANGKA: 'BERJANGKA',
} as const

export const MEMBERSHIP_TYPES = {
  REGULAR: 'regular',
  PREMIUM: 'premium',
  INVESTOR: 'investor',
} as const

export const MEMBERSHIP_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive',
  TERMINATED: 'terminated',
} as const

export const KYC_STATUS = {
  PENDING: 'pending',
  IN_REVIEW: 'in_review',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const

export const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  TRANSFER: 'transfer',
  ADJUSTMENT: 'adjustment',
  FEE: 'fee',
  INTEREST: 'interest',
} as const

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const

// Admin roles and permissions
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
} as const

export const PERMISSIONS = {
  // Member management
  MEMBERS_READ: 'members:read',
  MEMBERS_CREATE: 'members:create',
  MEMBERS_UPDATE: 'members:update',
  MEMBERS_DELETE: 'members:delete',
  MEMBERS_APPROVE_KYC: 'members:approve_kyc',

  // Savings management
  SAVINGS_READ: 'savings:read',
  SAVINGS_CREATE: 'savings:create',
  SAVINGS_UPDATE: 'savings:update',
  SAVINGS_DELETE: 'savings:delete',

  // Transactions
  TRANSACTIONS_READ: 'transactions:read',
  TRANSACTIONS_CREATE: 'transactions:create',
  TRANSACTIONS_UPDATE: 'transactions:update',
  TRANSACTIONS_DELETE: 'transactions:delete',
  TRANSACTIONS_APPROVE: 'transactions:approve',

  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',

  // System
  SYSTEM_SETTINGS: 'system:settings',
  SYSTEM_AUDIT: 'system:audit',
  SYSTEM_BACKUP: 'system:backup',

  // Admin management
  ADMINS_READ: 'admins:read',
  ADMINS_CREATE: 'admins:create',
  ADMINS_UPDATE: 'admins:update',
  ADMINS_DELETE: 'admins:delete',
} as const

// Common regex patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE_ID: /^(\+62|62|0)[0-9]{8,13}$/,
  NIK: /^\d{16}$/,
  NPWP: /^\d{15}$/,
  POSTAL_CODE: /^\d{5}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,30}$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  URL: /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=]*)$/,
} as const

// Indonesian stop words for text processing
export const INDONESIAN_STOP_WORDS = [
  'yang', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada', 'dalam', 'adalah', 'ini', 'itu',
  'dan', 'atau', 'juga', 'akan', 'dapat', 'bisa', 'tidak', 'ada', 'saya', 'kami', 'kita',
  'dia', 'mereka', 'sudah', 'belum', 'sedang', 'masih', 'selalu', 'pernah', 'jika', 'kalau',
  'karena', 'sebab', 'maka', 'lalu', 'kemudian', 'setelah', 'sebelum', 'saat', 'ketika',
  'oleh', 'bagi', 'tentang', 'terhadap', 'antara', 'hingga', 'sampai', 'sejak', 'selama',
  'agar', 'supaya', 'bahwa', 'seperti', 'sebagai', 'kecuali', 'tanpa', 'melainkan',
] as const

// Environment constants
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TEST: 'test',
} as const

// Time constants (in milliseconds)
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
} as const

// Rate limiting constants
export const RATE_LIMITS = {
  LOGIN: {
    windowMs: 15 * TIME_CONSTANTS.MINUTE,
    max: 5,
  },
  API: {
    windowMs: TIME_CONSTANTS.MINUTE,
    max: 100,
  },
  UPLOAD: {
    windowMs: TIME_CONSTANTS.HOUR,
    max: 10,
  },
} as const