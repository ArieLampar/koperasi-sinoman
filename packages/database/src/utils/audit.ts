/**
 * Audit logging utilities
 */

import type { UUID, DatabaseOperation, AuditLog } from '../types/base'

export interface AuditContext {
  userId?: UUID
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  source?: string // 'web', 'mobile', 'api', etc.
}

export interface AuditableOperation {
  table: string
  operation: DatabaseOperation
  recordId: UUID
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  metadata?: Record<string, any>
}

/**
 * Create audit log entry
 */
export function createAuditLog(
  operation: AuditableOperation,
  context: AuditContext
): Omit<AuditLog, 'id' | 'created_at' | 'updated_at'> {
  return {
    table_name: operation.table,
    record_id: operation.recordId,
    operation: operation.operation,
    old_values: operation.oldValues,
    new_values: operation.newValues,
    user_id: context.userId,
    ip_address: context.ipAddress,
    user_agent: context.userAgent,
  }
}

/**
 * Calculate field changes between old and new values
 */
export function calculateChanges(
  oldValues: Record<string, any>,
  newValues: Record<string, any>
): {
  changed: Record<string, { from: any; to: any }>
  added: Record<string, any>
  removed: Record<string, any>
} {
  const changed: Record<string, { from: any; to: any }> = {}
  const added: Record<string, any> = {}
  const removed: Record<string, any> = {}

  // Find changed and removed fields
  Object.keys(oldValues).forEach(key => {
    if (!(key in newValues)) {
      removed[key] = oldValues[key]
    } else if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
      changed[key] = {
        from: oldValues[key],
        to: newValues[key],
      }
    }
  })

  // Find added fields
  Object.keys(newValues).forEach(key => {
    if (!(key in oldValues)) {
      added[key] = newValues[key]
    }
  })

  return { changed, added, removed }
}

/**
 * Sanitize sensitive data from audit logs
 */
export function sanitizeAuditData(data: Record<string, any>): Record<string, any> {
  const sensitiveFields = [
    'password',
    'password_hash',
    'access_token',
    'refresh_token',
    'api_key',
    'secret',
    'private_key',
    'nik', // Mask NIK
    'credit_card',
    'bank_account',
  ]

  const sanitized = { ...data }

  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase()
    const isSensitive = sensitiveFields.some(field => lowerKey.includes(field))

    if (isSensitive) {
      if (key === 'nik' && typeof sanitized[key] === 'string') {
        // Mask NIK (show first 4 and last 4 digits)
        const nik = sanitized[key]
        sanitized[key] = nik.length === 16 ? `${nik.slice(0, 4)}****${nik.slice(-4)}` : '****'
      } else {
        sanitized[key] = '****'
      }
    }
  })

  return sanitized
}

/**
 * Format audit log for display
 */
export function formatAuditMessage(auditLog: AuditLog): string {
  const { table_name, operation, user_id } = auditLog
  const user = user_id ? `User ${user_id}` : 'System'

  switch (operation) {
    case 'create':
      return `${user} created a new record in ${table_name}`
    case 'update':
      return `${user} updated a record in ${table_name}`
    case 'delete':
      return `${user} deleted a record from ${table_name}`
    case 'read':
      return `${user} accessed a record in ${table_name}`
    default:
      return `${user} performed ${operation} on ${table_name}`
  }
}

/**
 * Get audit trail for a specific record
 */
export function getAuditTrail(auditLogs: AuditLog[]): {
  timeline: Array<{
    timestamp: string
    operation: DatabaseOperation
    user: string
    message: string
    changes?: Record<string, { from: any; to: any }>
  }>
  summary: {
    totalChanges: number
    lastModified: string
    lastModifiedBy: string
    createdAt: string
    createdBy: string
  }
} {
  const timeline = auditLogs
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(log => {
      const changes = log.old_values && log.new_values
        ? calculateChanges(log.old_values, log.new_values).changed
        : undefined

      return {
        timestamp: log.created_at,
        operation: log.operation,
        user: log.user_id || 'System',
        message: formatAuditMessage(log),
        changes,
      }
    })

  const firstLog = timeline[0]
  const lastLog = timeline[timeline.length - 1]

  return {
    timeline,
    summary: {
      totalChanges: timeline.filter(log => log.operation === 'update').length,
      lastModified: lastLog?.timestamp || '',
      lastModifiedBy: lastLog?.user || '',
      createdAt: firstLog?.timestamp || '',
      createdBy: firstLog?.user || '',
    },
  }
}

/**
 * Filter audit logs by criteria
 */
export function filterAuditLogs(
  auditLogs: AuditLog[],
  filters: {
    table?: string
    operation?: DatabaseOperation
    userId?: UUID
    dateFrom?: string
    dateTo?: string
    recordId?: UUID
  }
): AuditLog[] {
  return auditLogs.filter(log => {
    if (filters.table && log.table_name !== filters.table) return false
    if (filters.operation && log.operation !== filters.operation) return false
    if (filters.userId && log.user_id !== filters.userId) return false
    if (filters.recordId && log.record_id !== filters.recordId) return false

    if (filters.dateFrom) {
      const logDate = new Date(log.created_at)
      const fromDate = new Date(filters.dateFrom)
      if (logDate < fromDate) return false
    }

    if (filters.dateTo) {
      const logDate = new Date(log.created_at)
      const toDate = new Date(filters.dateTo)
      if (logDate > toDate) return false
    }

    return true
  })
}

/**
 * Generate audit report
 */
export function generateAuditReport(
  auditLogs: AuditLog[],
  period: { from: string; to: string }
): {
  period: { from: string; to: string }
  totalEvents: number
  eventsByOperation: Record<DatabaseOperation, number>
  eventsByTable: Record<string, number>
  eventsByUser: Record<string, number>
  topUsers: Array<{ userId: string; events: number }>
  topTables: Array<{ table: string; events: number }>
  dailyActivity: Array<{ date: string; events: number }>
} {
  const filteredLogs = filterAuditLogs(auditLogs, {
    dateFrom: period.from,
    dateTo: period.to,
  })

  const eventsByOperation: Record<DatabaseOperation, number> = {
    create: 0,
    read: 0,
    update: 0,
    delete: 0,
  }

  const eventsByTable: Record<string, number> = {}
  const eventsByUser: Record<string, number> = {}
  const dailyActivity: Record<string, number> = {}

  filteredLogs.forEach(log => {
    // Count by operation
    eventsByOperation[log.operation]++

    // Count by table
    eventsByTable[log.table_name] = (eventsByTable[log.table_name] || 0) + 1

    // Count by user
    const userId = log.user_id || 'System'
    eventsByUser[userId] = (eventsByUser[userId] || 0) + 1

    // Count by day
    const date = log.created_at.split('T')[0]
    dailyActivity[date] = (dailyActivity[date] || 0) + 1
  })

  // Sort top users and tables
  const topUsers = Object.entries(eventsByUser)
    .map(([userId, events]) => ({ userId, events }))
    .sort((a, b) => b.events - a.events)
    .slice(0, 10)

  const topTables = Object.entries(eventsByTable)
    .map(([table, events]) => ({ table, events }))
    .sort((a, b) => b.events - a.events)
    .slice(0, 10)

  return {
    period,
    totalEvents: filteredLogs.length,
    eventsByOperation,
    eventsByTable,
    eventsByUser,
    topUsers,
    topTables,
    dailyActivity: Object.entries(dailyActivity)
      .map(([date, events]) => ({ date, events }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  }
}

/**
 * Audit decorator for functions
 */
export function auditOperation<T extends (...args: any[]) => any>(
  operation: Omit<AuditableOperation, 'recordId'>,
  context: AuditContext
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args)

      // Extract record ID from result or args
      const recordId = result?.id || args[0]?.id || args[0]

      if (recordId) {
        const auditLog = createAuditLog(
          { ...operation, recordId },
          context
        )

        // This would typically save to audit log table
        console.log('Audit Log:', auditLog)
      }

      return result
    }

    return descriptor
  }
}

export default {
  createAuditLog,
  calculateChanges,
  sanitizeAuditData,
  formatAuditMessage,
  getAuditTrail,
  filterAuditLogs,
  generateAuditReport,
  auditOperation,
}