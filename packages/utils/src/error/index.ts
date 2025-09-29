/**
 * Error utilities and custom error classes
 */

// Base custom error class
export class BaseError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly timestamp: Date
  public readonly context?: Record<string, any>

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message)

    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.timestamp = new Date()
    this.context = context

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
    }
  }
}

// Validation error
export class ValidationError extends BaseError {
  public readonly field?: string
  public readonly value?: any

  constructor(
    message: string,
    field?: string,
    value?: any,
    context?: Record<string, any>
  ) {
    super(message, 'VALIDATION_ERROR', 400, true, context)
    this.field = field
    this.value = value
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
      value: this.value,
    }
  }
}

// Authentication error
export class AuthenticationError extends BaseError {
  constructor(message: string = 'Authentication failed', context?: Record<string, any>) {
    super(message, 'AUTHENTICATION_ERROR', 401, true, context)
  }
}

// Authorization error
export class AuthorizationError extends BaseError {
  public readonly requiredPermission?: string

  constructor(
    message: string = 'Access denied',
    requiredPermission?: string,
    context?: Record<string, any>
  ) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, context)
    this.requiredPermission = requiredPermission
  }

  toJSON() {
    return {
      ...super.toJSON(),
      requiredPermission: this.requiredPermission,
    }
  }
}

// Not found error
export class NotFoundError extends BaseError {
  public readonly resource?: string
  public readonly identifier?: string | number

  constructor(
    message: string = 'Resource not found',
    resource?: string,
    identifier?: string | number,
    context?: Record<string, any>
  ) {
    super(message, 'NOT_FOUND_ERROR', 404, true, context)
    this.resource = resource
    this.identifier = identifier
  }

  toJSON() {
    return {
      ...super.toJSON(),
      resource: this.resource,
      identifier: this.identifier,
    }
  }
}

// Conflict error
export class ConflictError extends BaseError {
  public readonly conflictingField?: string

  constructor(
    message: string = 'Resource conflict',
    conflictingField?: string,
    context?: Record<string, any>
  ) {
    super(message, 'CONFLICT_ERROR', 409, true, context)
    this.conflictingField = conflictingField
  }

  toJSON() {
    return {
      ...super.toJSON(),
      conflictingField: this.conflictingField,
    }
  }
}

// Business logic error
export class BusinessLogicError extends BaseError {
  public readonly businessRule?: string

  constructor(
    message: string,
    businessRule?: string,
    context?: Record<string, any>
  ) {
    super(message, 'BUSINESS_LOGIC_ERROR', 422, true, context)
    this.businessRule = businessRule
  }

  toJSON() {
    return {
      ...super.toJSON(),
      businessRule: this.businessRule,
    }
  }
}

// External service error
export class ExternalServiceError extends BaseError {
  public readonly service?: string
  public readonly originalError?: Error

  constructor(
    message: string,
    service?: string,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 503, true, context)
    this.service = service
    this.originalError = originalError
  }

  toJSON() {
    return {
      ...super.toJSON(),
      service: this.service,
      originalError: this.originalError?.message,
    }
  }
}

// Database error
export class DatabaseError extends BaseError {
  public readonly operation?: string
  public readonly table?: string

  constructor(
    message: string,
    operation?: string,
    table?: string,
    context?: Record<string, any>
  ) {
    super(message, 'DATABASE_ERROR', 500, true, context)
    this.operation = operation
    this.table = table
  }

  toJSON() {
    return {
      ...super.toJSON(),
      operation: this.operation,
      table: this.table,
    }
  }
}

// Rate limit error
export class RateLimitError extends BaseError {
  public readonly limit?: number
  public readonly resetTime?: Date

  constructor(
    message: string = 'Rate limit exceeded',
    limit?: number,
    resetTime?: Date,
    context?: Record<string, any>
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429, true, context)
    this.limit = limit
    this.resetTime = resetTime
  }

  toJSON() {
    return {
      ...super.toJSON(),
      limit: this.limit,
      resetTime: this.resetTime?.toISOString(),
    }
  }
}

// File upload error
export class FileUploadError extends BaseError {
  public readonly filename?: string
  public readonly fileSize?: number

  constructor(
    message: string,
    filename?: string,
    fileSize?: number,
    context?: Record<string, any>
  ) {
    super(message, 'FILE_UPLOAD_ERROR', 400, true, context)
    this.filename = filename
    this.fileSize = fileSize
  }

  toJSON() {
    return {
      ...super.toJSON(),
      filename: this.filename,
      fileSize: this.fileSize,
    }
  }
}

// Error handler utility
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorReporters: Array<(error: Error) => void> = []

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  addErrorReporter(reporter: (error: Error) => void): void {
    this.errorReporters.push(reporter)
  }

  handleError(error: Error): void {
    this.logError(error)
    this.reportError(error)

    if (!this.isOperationalError(error)) {
      // For non-operational errors, we might want to exit the process
      process.exit(1)
    }
  }

  private isOperationalError(error: Error): boolean {
    if (error instanceof BaseError) {
      return error.isOperational
    }
    return false
  }

  private logError(error: Error): void {
    console.error('Error occurred:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
  }

  private reportError(error: Error): void {
    this.errorReporters.forEach(reporter => {
      try {
        reporter(error)
      } catch (reporterError) {
        console.error('Error reporter failed:', reporterError)
      }
    })
  }
}

// Error factory functions
export function createValidationError(
  message: string,
  field?: string,
  value?: any,
  context?: Record<string, any>
): ValidationError {
  return new ValidationError(message, field, value, context)
}

export function createNotFoundError(
  resource?: string,
  identifier?: string | number,
  context?: Record<string, any>
): NotFoundError {
  const message = resource
    ? `${resource}${identifier ? ` with id ${identifier}` : ''} not found`
    : 'Resource not found'
  return new NotFoundError(message, resource, identifier, context)
}

export function createAuthenticationError(
  message?: string,
  context?: Record<string, any>
): AuthenticationError {
  return new AuthenticationError(message, context)
}

export function createAuthorizationError(
  requiredPermission?: string,
  context?: Record<string, any>
): AuthorizationError {
  const message = requiredPermission
    ? `Access denied. Required permission: ${requiredPermission}`
    : 'Access denied'
  return new AuthorizationError(message, requiredPermission, context)
}

// Error utilities
export function isError(value: any): value is Error {
  return value instanceof Error
}

export function isCustomError(value: any): value is BaseError {
  return value instanceof BaseError
}

export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unknown error occurred'
}

export function getErrorCode(error: unknown): string {
  if (isCustomError(error)) {
    return error.code
  }
  if (isError(error)) {
    return error.name
  }
  return 'UNKNOWN_ERROR'
}

export function getErrorStatusCode(error: unknown): number {
  if (isCustomError(error)) {
    return error.statusCode
  }
  return 500
}

// Safe error handling utilities
export function safeAsync<T>(
  fn: () => Promise<T>
): Promise<[T | null, Error | null]> {
  return fn()
    .then((result): [T, null] => [result, null])
    .catch((error): [null, Error] => [null, error])
}

export function safeSync<T>(fn: () => T): [T | null, Error | null] {
  try {
    const result = fn()
    return [result, null]
  } catch (error) {
    return [null, error as Error]
  }
}

// Retry utility with exponential backoff
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number
    baseDelay?: number
    maxDelay?: number
    backoffMultiplier?: number
    retryOn?: (error: Error) => boolean
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryOn = () => true,
  } = options

  let attempt = 1
  let delay = baseDelay

  while (attempt <= maxAttempts) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxAttempts || !retryOn(error as Error)) {
        throw error
      }

      await new Promise(resolve => setTimeout(resolve, delay))
      delay = Math.min(delay * backoffMultiplier, maxDelay)
      attempt++
    }
  }

  throw new Error('Retry failed') // This should never be reached
}

// Error aggregation for batch operations
export class ErrorAggregator {
  private errors: Array<{ index: number; error: Error }> = []

  addError(index: number, error: Error): void {
    this.errors.push({ index, error })
  }

  hasErrors(): boolean {
    return this.errors.length > 0
  }

  getErrors(): Array<{ index: number; error: Error }> {
    return [...this.errors]
  }

  getErrorCount(): number {
    return this.errors.length
  }

  throwIfHasErrors(): void {
    if (this.hasErrors()) {
      const message = `Batch operation failed with ${this.errors.length} error(s)`
      throw new BaseError(message, 'BATCH_ERROR', 400, true, {
        errors: this.errors.map(({ index, error }) => ({
          index,
          message: error.message,
          code: getErrorCode(error),
        })),
      })
    }
  }

  clear(): void {
    this.errors = []
  }
}