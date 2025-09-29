/**
 * Database migration utilities
 */

export interface Migration {
  id: string
  name: string
  timestamp: number
  up: string
  down: string
  description?: string
  dependencies?: string[]
}

export interface MigrationRecord {
  id: string
  name: string
  executed_at: string
  checksum: string
}

export interface MigrationResult {
  success: boolean
  migration: Migration
  error?: string
  executionTime?: number
}

export interface MigrationStatus {
  applied: MigrationRecord[]
  pending: Migration[]
  total: number
  lastExecuted?: MigrationRecord
}

/**
 * Migration manager for handling database schema changes
 */
export class MigrationManager {
  private migrations: Migration[] = []
  private connectionString: string

  constructor(connectionString: string) {
    this.connectionString = connectionString
  }

  /**
   * Add a migration to the manager
   */
  addMigration(migration: Migration): void {
    this.migrations.push(migration)
    this.migrations.sort((a, b) => a.timestamp - b.timestamp)
  }

  /**
   * Load migrations from directory
   */
  async loadMigrations(directory: string): Promise<void> {
    // Implementation would scan directory for migration files
    // and parse them into Migration objects
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<MigrationStatus> {
    const applied = await this.getAppliedMigrations()
    const appliedIds = new Set(applied.map(m => m.id))
    const pending = this.migrations.filter(m => !appliedIds.has(m.id))

    return {
      applied,
      pending,
      total: this.migrations.length,
      lastExecuted: applied[applied.length - 1],
    }
  }

  /**
   * Run pending migrations
   */
  async up(target?: string): Promise<MigrationResult[]> {
    const status = await this.getStatus()
    let migrationsToRun = status.pending

    if (target) {
      const targetIndex = migrationsToRun.findIndex(m => m.id === target)
      if (targetIndex === -1) {
        throw new Error(`Migration ${target} not found`)
      }
      migrationsToRun = migrationsToRun.slice(0, targetIndex + 1)
    }

    const results: MigrationResult[] = []

    for (const migration of migrationsToRun) {
      const result = await this.executeMigration(migration, 'up')
      results.push(result)

      if (!result.success) {
        break // Stop on first failure
      }
    }

    return results
  }

  /**
   * Rollback migrations
   */
  async down(target?: string): Promise<MigrationResult[]> {
    const applied = await this.getAppliedMigrations()
    let migrationsToRollback = applied.reverse()

    if (target) {
      const targetIndex = migrationsToRollback.findIndex(m => m.id === target)
      if (targetIndex === -1) {
        throw new Error(`Migration ${target} not found`)
      }
      migrationsToRollback = migrationsToRollback.slice(0, targetIndex + 1)
    }

    const results: MigrationResult[] = []

    for (const record of migrationsToRollback) {
      const migration = this.migrations.find(m => m.id === record.id)
      if (!migration) {
        continue
      }

      const result = await this.executeMigration(migration, 'down')
      results.push(result)

      if (!result.success) {
        break // Stop on first failure
      }
    }

    return results
  }

  /**
   * Reset database (rollback all migrations)
   */
  async reset(): Promise<MigrationResult[]> {
    return this.down()
  }

  /**
   * Execute a single migration
   */
  private async executeMigration(migration: Migration, direction: 'up' | 'down'): Promise<MigrationResult> {
    const startTime = Date.now()

    try {
      const sql = direction === 'up' ? migration.up : migration.down

      // Execute SQL (implementation would use actual database connection)
      await this.executeSQL(sql)

      if (direction === 'up') {
        await this.recordMigration(migration)
      } else {
        await this.removeMigrationRecord(migration.id)
      }

      return {
        success: true,
        migration,
        executionTime: Date.now() - startTime,
      }
    } catch (error) {
      return {
        success: false,
        migration,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Execute SQL query
   */
  private async executeSQL(sql: string): Promise<void> {
    // Implementation would execute SQL using database connection
    console.log('Executing SQL:', sql)
  }

  /**
   * Get applied migrations from database
   */
  private async getAppliedMigrations(): Promise<MigrationRecord[]> {
    // Implementation would query migrations table
    return []
  }

  /**
   * Record migration as applied
   */
  private async recordMigration(migration: Migration): Promise<void> {
    // Implementation would insert migration record
  }

  /**
   * Remove migration record
   */
  private async removeMigrationRecord(migrationId: string): Promise<void> {
    // Implementation would delete migration record
  }

  /**
   * Create migrations table
   */
  async createMigrationsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum VARCHAR(64) NOT NULL
      );
    `
    await this.executeSQL(sql)
  }
}

/**
 * Generate migration ID
 */
export function generateMigrationId(): string {
  return Date.now().toString()
}

/**
 * Generate migration name from description
 */
export function generateMigrationName(description: string): string {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
}

/**
 * Create migration template
 */
export function createMigrationTemplate(name: string, description?: string): Migration {
  const timestamp = Date.now()
  const id = `${timestamp}_${name}`

  return {
    id,
    name,
    timestamp,
    description,
    up: `-- Migration: ${name}
-- Description: ${description || 'Add description here'}
-- Up migration

-- Add your SQL here
`,
    down: `-- Migration: ${name}
-- Description: ${description || 'Add description here'}
-- Down migration (rollback)

-- Add your rollback SQL here
`,
  }
}

export default MigrationManager