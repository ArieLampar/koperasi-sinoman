'use client'

import React, { createContext, useContext, useCallback, ReactNode } from 'react'
import { useSupabase } from './supabase-provider'
import { useAuth } from './auth-provider'

// Audit event types
export type AuditEventType =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.failed_login'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.view'
  | 'savings.create'
  | 'savings.update'
  | 'savings.delete'
  | 'savings.view'
  | 'loan.create'
  | 'loan.update'
  | 'loan.approve'
  | 'loan.reject'
  | 'loan.delete'
  | 'report.generate'
  | 'report.export'
  | 'settings.update'
  | 'admin.role_change'
  | 'data.export'
  | 'data.import'
  | 'system.backup'
  | 'system.restore'

// Audit severity levels
export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical'

// Audit log entry interface
export interface AuditLogEntry {
  id?: string
  event_type: AuditEventType
  actor_id: string
  actor_email: string
  actor_role: string
  target_type?: string
  target_id?: string
  target_details?: Record<string, any>
  action_details: Record<string, any>
  severity: AuditSeverity
  ip_address?: string
  user_agent?: string
  session_id?: string
  timestamp: string
  metadata?: Record<string, any>
}

// Audit context interface
interface AuditContextType {
  logEvent: (event: Omit<AuditLogEntry, 'id' | 'actor_id' | 'actor_email' | 'actor_role' | 'timestamp' | 'session_id'>) => Promise<void>
  logAuthEvent: (eventType: 'login' | 'logout' | 'failed_login', details?: Record<string, any>) => Promise<void>
  logUserEvent: (action: 'create' | 'update' | 'delete' | 'view', targetId: string, details?: Record<string, any>) => Promise<void>
  logDataEvent: (action: 'export' | 'import', details: Record<string, any>) => Promise<void>
  logSystemEvent: (action: 'backup' | 'restore', details: Record<string, any>) => Promise<void>
  getAuditLogs: (filters?: AuditLogFilters) => Promise<AuditLogEntry[]>
  getAuditStats: (dateRange?: { from: Date; to: Date }) => Promise<AuditStats>
}

// Audit log filters
export interface AuditLogFilters {
  eventTypes?: AuditEventType[]
  actorIds?: string[]
  severity?: AuditSeverity[]
  dateFrom?: Date
  dateTo?: Date
  targetType?: string
  targetId?: string
  limit?: number
  offset?: number
}

// Audit statistics
export interface AuditStats {
  totalEvents: number
  eventsByType: Record<AuditEventType, number>
  eventsBySeverity: Record<AuditSeverity, number>
  topActors: Array<{ actor_email: string; count: number }>
  recentEvents: AuditLogEntry[]
}

const AuditContext = createContext<AuditContextType | undefined>(undefined)

interface AuditProviderProps {
  children: ReactNode
}

export const AuditProvider: React.FC<AuditProviderProps> = ({ children }) => {
  const { supabase } = useSupabase()
  const { user, session, adminRoles } = useAuth()

  // Get client info for audit logging
  const getClientInfo = useCallback(() => {
    return {
      ip_address: typeof window !== 'undefined' ?
        (window as any).clientIP || 'unknown' : 'server',
      user_agent: typeof window !== 'undefined' ?
        navigator.userAgent : 'server',
      session_id: session?.access_token ?
        session.access_token.substring(0, 16) : 'no-session'
    }
  }, [session])

  // Main audit logging function
  const logEvent = useCallback(async (
    event: Omit<AuditLogEntry, 'id' | 'actor_id' | 'actor_email' | 'actor_role' | 'timestamp' | 'session_id'>
  ): Promise<void> => {
    if (!user) {
      console.warn('Cannot log audit event: No authenticated user')
      return
    }

    try {
      const clientInfo = getClientInfo()
      const auditEntry: Omit<AuditLogEntry, 'id'> = {
        ...event,
        actor_id: user.id,
        actor_email: user.email || 'unknown',
        actor_role: adminRoles.join(',') || 'user',
        timestamp: new Date().toISOString(),
        session_id: clientInfo.session_id,
        ip_address: clientInfo.ip_address,
        user_agent: clientInfo.user_agent,
      }

      const { error } = await supabase
        .from('audit_logs')
        .insert([auditEntry])

      if (error) {
        console.error('Failed to log audit event:', error)
        // Don't throw error to avoid breaking the main application flow
      } else {
        console.log('Audit event logged:', event.event_type, event.action_details)
      }
    } catch (error) {
      console.error('Error logging audit event:', error)
    }
  }, [user, adminRoles, supabase, getClientInfo])

  // Specialized logging functions
  const logAuthEvent = useCallback(async (
    eventType: 'login' | 'logout' | 'failed_login',
    details: Record<string, any> = {}
  ): Promise<void> => {
    const severityMap = {
      login: 'medium' as AuditSeverity,
      logout: 'low' as AuditSeverity,
      failed_login: 'high' as AuditSeverity,
    }

    await logEvent({
      event_type: `auth.${eventType}` as AuditEventType,
      action_details: {
        timestamp: new Date().toISOString(),
        ...details,
      },
      severity: severityMap[eventType],
    })
  }, [logEvent])

  const logUserEvent = useCallback(async (
    action: 'create' | 'update' | 'delete' | 'view',
    targetId: string,
    details: Record<string, any> = {}
  ): Promise<void> => {
    const severityMap = {
      create: 'medium' as AuditSeverity,
      update: 'medium' as AuditSeverity,
      delete: 'high' as AuditSeverity,
      view: 'low' as AuditSeverity,
    }

    await logEvent({
      event_type: `user.${action}` as AuditEventType,
      target_type: 'user',
      target_id: targetId,
      action_details: {
        action,
        target_id: targetId,
        ...details,
      },
      severity: severityMap[action],
    })
  }, [logEvent])

  const logDataEvent = useCallback(async (
    action: 'export' | 'import',
    details: Record<string, any>
  ): Promise<void> => {
    await logEvent({
      event_type: `data.${action}` as AuditEventType,
      action_details: {
        action,
        ...details,
      },
      severity: 'medium',
    })
  }, [logEvent])

  const logSystemEvent = useCallback(async (
    action: 'backup' | 'restore',
    details: Record<string, any>
  ): Promise<void> => {
    await logEvent({
      event_type: `system.${action}` as AuditEventType,
      action_details: {
        action,
        ...details,
      },
      severity: 'critical',
    })
  }, [logEvent])

  // Audit log retrieval functions
  const getAuditLogs = useCallback(async (
    filters: AuditLogFilters = {}
  ): Promise<AuditLogEntry[]> => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })

      // Apply filters
      if (filters.eventTypes?.length) {
        query = query.in('event_type', filters.eventTypes)
      }

      if (filters.actorIds?.length) {
        query = query.in('actor_id', filters.actorIds)
      }

      if (filters.severity?.length) {
        query = query.in('severity', filters.severity)
      }

      if (filters.dateFrom) {
        query = query.gte('timestamp', filters.dateFrom.toISOString())
      }

      if (filters.dateTo) {
        query = query.lte('timestamp', filters.dateTo.toISOString())
      }

      if (filters.targetType) {
        query = query.eq('target_type', filters.targetType)
      }

      if (filters.targetId) {
        query = query.eq('target_id', filters.targetId)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching audit logs:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getAuditLogs:', error)
      return []
    }
  }, [supabase])

  const getAuditStats = useCallback(async (
    dateRange?: { from: Date; to: Date }
  ): Promise<AuditStats> => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')

      if (dateRange) {
        query = query
          .gte('timestamp', dateRange.from.toISOString())
          .lte('timestamp', dateRange.to.toISOString())
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching audit stats:', error)
        return {
          totalEvents: 0,
          eventsByType: {} as Record<AuditEventType, number>,
          eventsBySeverity: {} as Record<AuditSeverity, number>,
          topActors: [],
          recentEvents: [],
        }
      }

      const logs = data || []

      // Calculate statistics
      const eventsByType = logs.reduce((acc, log) => {
        acc[log.event_type] = (acc[log.event_type] || 0) + 1
        return acc
      }, {} as Record<AuditEventType, number>)

      const eventsBySeverity = logs.reduce((acc, log) => {
        acc[log.severity] = (acc[log.severity] || 0) + 1
        return acc
      }, {} as Record<AuditSeverity, number>)

      const actorCounts = logs.reduce((acc, log) => {
        acc[log.actor_email] = (acc[log.actor_email] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const topActors = Object.entries(actorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([actor_email, count]) => ({ actor_email, count }))

      const recentEvents = logs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)

      return {
        totalEvents: logs.length,
        eventsByType,
        eventsBySeverity,
        topActors,
        recentEvents,
      }
    } catch (error) {
      console.error('Error in getAuditStats:', error)
      return {
        totalEvents: 0,
        eventsByType: {} as Record<AuditEventType, number>,
        eventsBySeverity: {} as Record<AuditSeverity, number>,
        topActors: [],
        recentEvents: [],
      }
    }
  }, [supabase])

  const contextValue: AuditContextType = {
    logEvent,
    logAuthEvent,
    logUserEvent,
    logDataEvent,
    logSystemEvent,
    getAuditLogs,
    getAuditStats,
  }

  return (
    <AuditContext.Provider value={contextValue}>
      {children}
    </AuditContext.Provider>
  )
}

export const useAudit = (): AuditContextType => {
  const context = useContext(AuditContext)

  if (context === undefined) {
    throw new Error('useAudit must be used within an AuditProvider')
  }

  return context
}

export default AuditProvider