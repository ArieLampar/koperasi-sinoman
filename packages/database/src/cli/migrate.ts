#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import { config } from 'dotenv'
import path from 'path'
import fs from 'fs/promises'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config()

const program = new Command()

program
  .name('db-migrate')
  .description('Database migration tool for Koperasi Sinoman')
  .version('0.1.0')

// Create migration command
program
  .command('create')
  .description('Create a new migration file')
  .argument('[name]', 'Migration name')
  .option('-d, --description <description>', 'Migration description')
  .action(async (name, options) => {
    try {
      let migrationName = name

      if (!migrationName) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Enter migration name:',
            validate: (input) => input.length > 0 || 'Migration name is required',
          },
        ])
        migrationName = answers.name
      }

      const timestamp = Date.now()
      const fileName = `${timestamp}_${migrationName.toLowerCase().replace(/\s+/g, '_')}.sql`
      const migrationPath = path.join(process.cwd(), 'migrations', fileName)

      // Ensure migrations directory exists
      await fs.mkdir(path.dirname(migrationPath), { recursive: true })

      const template = `-- Migration: ${migrationName}
-- Created: ${new Date().toISOString()}
-- Description: ${options.description || 'Add description here'}

-- =====================================================
-- UP MIGRATION
-- =====================================================

-- Add your SQL here



-- =====================================================
-- DOWN MIGRATION (for rollback)
-- =====================================================

-- Add your rollback SQL here

`

      await fs.writeFile(migrationPath, template)

      console.log(chalk.green(`✓ Created migration: ${fileName}`))
      console.log(chalk.gray(`  Location: ${migrationPath}`))
    } catch (error) {
      console.error(chalk.red('Error creating migration:'), error)
      process.exit(1)
    }
  })

// Run migrations command
program
  .command('up')
  .description('Run pending migrations')
  .option('-t, --target <migration>', 'Run up to specific migration')
  .option('--dry-run', 'Show what would be executed without running')
  .action(async (options) => {
    const spinner = ora('Running migrations...').start()

    try {
      const supabase = createSupabaseClient()

      // Get pending migrations
      const migrations = await getPendingMigrations()

      if (migrations.length === 0) {
        spinner.succeed('No pending migrations')
        return
      }

      spinner.text = `Found ${migrations.length} pending migration(s)`

      if (options.dryRun) {
        spinner.succeed('Dry run completed')
        console.log(chalk.blue('\nPending migrations:'))
        migrations.forEach(migration => {
          console.log(chalk.gray(`  - ${migration}`))
        })
        return
      }

      // Execute migrations
      for (const migration of migrations) {
        spinner.text = `Running migration: ${migration}`
        await executeMigration(supabase, migration)

        if (options.target && migration.includes(options.target)) {
          break
        }
      }

      spinner.succeed(`Successfully ran ${migrations.length} migration(s)`)
    } catch (error) {
      spinner.fail('Migration failed')
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  })

// Rollback migrations command
program
  .command('down')
  .description('Rollback migrations')
  .option('-n, --number <count>', 'Number of migrations to rollback', '1')
  .option('-t, --target <migration>', 'Rollback to specific migration')
  .option('--dry-run', 'Show what would be executed without running')
  .action(async (options) => {
    const spinner = ora('Rolling back migrations...').start()

    try {
      const count = parseInt(options.number)
      const appliedMigrations = await getAppliedMigrations()

      if (appliedMigrations.length === 0) {
        spinner.succeed('No migrations to rollback')
        return
      }

      let migrationsToRollback = appliedMigrations.slice(-count)

      if (options.target) {
        const targetIndex = appliedMigrations.findIndex(m => m.includes(options.target))
        if (targetIndex === -1) {
          throw new Error(`Migration ${options.target} not found`)
        }
        migrationsToRollback = appliedMigrations.slice(targetIndex)
      }

      spinner.text = `Found ${migrationsToRollback.length} migration(s) to rollback`

      if (options.dryRun) {
        spinner.succeed('Dry run completed')
        console.log(chalk.blue('\nMigrations to rollback:'))
        migrationsToRollback.forEach(migration => {
          console.log(chalk.gray(`  - ${migration}`))
        })
        return
      }

      // Confirm rollback
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `Are you sure you want to rollback ${migrationsToRollback.length} migration(s)?`,
          default: false,
        },
      ])

      if (!confirmed) {
        spinner.info('Rollback cancelled')
        return
      }

      const supabase = createSupabaseClient()

      // Execute rollbacks
      for (const migration of migrationsToRollback.reverse()) {
        spinner.text = `Rolling back migration: ${migration}`
        await rollbackMigration(supabase, migration)
      }

      spinner.succeed(`Successfully rolled back ${migrationsToRollback.length} migration(s)`)
    } catch (error) {
      spinner.fail('Rollback failed')
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  })

// Reset database command
program
  .command('reset')
  .description('Reset database (rollback all migrations)')
  .option('--confirm', 'Skip confirmation prompt')
  .action(async (options) => {
    try {
      if (!options.confirm) {
        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: chalk.red('This will rollback ALL migrations. Are you sure?'),
            default: false,
          },
        ])

        if (!confirmed) {
          console.log(chalk.yellow('Reset cancelled'))
          return
        }
      }

      const spinner = ora('Resetting database...').start()

      const supabase = createSupabaseClient()
      const appliedMigrations = await getAppliedMigrations()

      if (appliedMigrations.length === 0) {
        spinner.succeed('Database is already clean')
        return
      }

      // Rollback all migrations
      for (const migration of appliedMigrations.reverse()) {
        spinner.text = `Rolling back migration: ${migration}`
        await rollbackMigration(supabase, migration)
      }

      spinner.succeed('Database reset complete')
    } catch (error) {
      console.error(chalk.red('Error resetting database:'), error)
      process.exit(1)
    }
  })

// Status command
program
  .command('status')
  .description('Show migration status')
  .action(async () => {
    const spinner = ora('Checking migration status...').start()

    try {
      const [applied, pending] = await Promise.all([
        getAppliedMigrations(),
        getPendingMigrations(),
      ])

      spinner.stop()

      console.log(chalk.blue('\n📊 Migration Status\n'))
      console.log(`Applied migrations: ${chalk.green(applied.length)}`)
      console.log(`Pending migrations: ${chalk.yellow(pending.length)}`)
      console.log(`Total migrations: ${applied.length + pending.length}`)

      if (applied.length > 0) {
        console.log(chalk.blue('\n✅ Applied Migrations:'))
        applied.forEach(migration => {
          console.log(chalk.gray(`  ✓ ${migration}`))
        })
      }

      if (pending.length > 0) {
        console.log(chalk.blue('\n⏳ Pending Migrations:'))
        pending.forEach(migration => {
          console.log(chalk.gray(`  • ${migration}`))
        })
      }

      if (pending.length === 0 && applied.length > 0) {
        console.log(chalk.green('\n🎉 Database is up to date!'))
      }
    } catch (error) {
      spinner.fail('Failed to check migration status')
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  })

// Helper functions
function createSupabaseClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function getPendingMigrations(): Promise<string[]> {
  try {
    const migrationsDir = path.join(process.cwd(), 'migrations')
    const files = await fs.readdir(migrationsDir)

    // Filter SQL files and sort by timestamp
    const migrations = files
      .filter(file => file.endsWith('.sql'))
      .sort()

    const applied = await getAppliedMigrations()
    const appliedSet = new Set(applied)

    return migrations.filter(migration => !appliedSet.has(migration))
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  }
}

async function getAppliedMigrations(): Promise<string[]> {
  // This would query the migrations table in the database
  // For now, return empty array
  return []
}

async function executeMigration(supabase: any, migrationFile: string): Promise<void> {
  const migrationPath = path.join(process.cwd(), 'migrations', migrationFile)
  const sql = await fs.readFile(migrationPath, 'utf-8')

  // Extract UP migration (everything before DOWN MIGRATION comment)
  const upMatch = sql.match(/-- UP MIGRATION\s*--.*?\n(.*?)(?=-- DOWN MIGRATION|$)/s)
  const upSql = upMatch ? upMatch[1].trim() : sql

  if (upSql) {
    // Execute SQL using Supabase
    const { error } = await supabase.rpc('execute_sql', { sql: upSql })
    if (error) throw error
  }

  // Record migration as applied
  await recordMigration(supabase, migrationFile)
}

async function rollbackMigration(supabase: any, migrationFile: string): Promise<void> {
  const migrationPath = path.join(process.cwd(), 'migrations', migrationFile)
  const sql = await fs.readFile(migrationPath, 'utf-8')

  // Extract DOWN migration
  const downMatch = sql.match(/-- DOWN MIGRATION.*?\n(.*?)$/s)
  const downSql = downMatch ? downMatch[1].trim() : ''

  if (downSql) {
    // Execute rollback SQL
    const { error } = await supabase.rpc('execute_sql', { sql: downSql })
    if (error) throw error
  }

  // Remove migration record
  await removeMigrationRecord(supabase, migrationFile)
}

async function recordMigration(supabase: any, migrationFile: string): Promise<void> {
  // This would insert into migrations table
  console.log(`Recording migration: ${migrationFile}`)
}

async function removeMigrationRecord(supabase: any, migrationFile: string): Promise<void> {
  // This would delete from migrations table
  console.log(`Removing migration record: ${migrationFile}`)
}

// Parse command line arguments
program.parse()

export default program