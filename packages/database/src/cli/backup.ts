#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { config } from 'dotenv'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config()

const execAsync = promisify(exec)

const program = new Command()

program
  .name('db-backup')
  .description('Database backup tool for Koperasi Sinoman')
  .version('0.1.0')

// Main backup command
program
  .option('-o, --output <path>', 'Output directory for backup files', './backups')
  .option('-f, --format <format>', 'Backup format (sql, json, csv)', 'sql')
  .option('-t, --tables <tables...>', 'Specific tables to backup (default: all)')
  .option('-c, --compress', 'Compress backup files')
  .option('--data-only', 'Backup data only (no schema)')
  .option('--schema-only', 'Backup schema only (no data)')
  .action(async (options) => {
    const spinner = ora('Starting database backup...').start()

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
      const backupDir = path.resolve(options.output, timestamp)

      // Ensure backup directory exists
      await fs.mkdir(backupDir, { recursive: true })

      const supabase = createSupabaseClient()

      // Get database info
      spinner.text = 'Gathering database information...'
      const dbInfo = await getDatabaseInfo(supabase)

      // Create backup manifest
      const manifest = {
        timestamp: new Date().toISOString(),
        database: dbInfo.name,
        version: dbInfo.version,
        format: options.format,
        tables: options.tables || dbInfo.tables,
        options: {
          dataOnly: options.dataOnly,
          schemaOnly: options.schemaOnly,
          compressed: options.compress,
        },
      }

      // Backup schema if not data-only
      if (!options.dataOnly) {
        spinner.text = 'Backing up database schema...'
        await backupSchema(backupDir, options)
      }

      // Backup data if not schema-only
      if (!options.schemaOnly) {
        const tablesToBackup = options.tables || dbInfo.tables

        for (const table of tablesToBackup) {
          spinner.text = `Backing up table: ${table}`
          await backupTable(supabase, backupDir, table, options)
        }
      }

      // Write manifest
      const manifestPath = path.join(backupDir, 'manifest.json')
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))

      // Compress if requested
      if (options.compress) {
        spinner.text = 'Compressing backup...'
        const archivePath = `${backupDir}.tar.gz`
        await execAsync(`tar -czf "${archivePath}" -C "${path.dirname(backupDir)}" "${path.basename(backupDir)}"`)

        // Remove uncompressed directory
        await fs.rm(backupDir, { recursive: true })

        spinner.succeed(`Backup completed: ${archivePath}`)
      } else {
        spinner.succeed(`Backup completed: ${backupDir}`)
      }

      console.log(chalk.green(`✓ Database backup created`))
      console.log(chalk.gray(`  Format: ${options.format}`))
      console.log(chalk.gray(`  Tables: ${(options.tables || dbInfo.tables).length}`))
      console.log(chalk.gray(`  Size: ${await getDirectorySize(options.compress ? `${backupDir}.tar.gz` : backupDir)}`))

    } catch (error) {
      spinner.fail('Backup failed')
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  })

// List backups command
program
  .command('list')
  .description('List available backup files')
  .option('-p, --path <path>', 'Backup directory to scan', './backups')
  .action(async (options) => {
    try {
      const backupDir = path.resolve(options.path)

      try {
        const entries = await fs.readdir(backupDir, { withFileTypes: true })
        const backups = []

        for (const entry of entries) {
          if (entry.isDirectory() || entry.name.endsWith('.tar.gz')) {
            const backupPath = path.join(backupDir, entry.name)
            const manifestPath = entry.isDirectory()
              ? path.join(backupPath, 'manifest.json')
              : null

            let manifest = null
            if (manifestPath) {
              try {
                const manifestContent = await fs.readFile(manifestPath, 'utf-8')
                manifest = JSON.parse(manifestContent)
              } catch {
                // Manifest not found or invalid
              }
            }

            const stats = await fs.stat(backupPath)
            backups.push({
              name: entry.name,
              path: backupPath,
              size: stats.size,
              created: stats.birthtime,
              manifest,
            })
          }
        }

        if (backups.length === 0) {
          console.log(chalk.yellow('No backups found'))
          return
        }

        console.log(chalk.blue('\n📋 Available Backups:\n'))

        backups
          .sort((a, b) => b.created.getTime() - a.created.getTime())
          .forEach(backup => {
            console.log(chalk.cyan(backup.name))
            console.log(chalk.gray(`  Created: ${backup.created.toLocaleString()}`))
            console.log(chalk.gray(`  Size: ${formatBytes(backup.size)}`))
            if (backup.manifest) {
              console.log(chalk.gray(`  Tables: ${backup.manifest.tables.length}`))
              console.log(chalk.gray(`  Format: ${backup.manifest.format}`))
            }
            console.log()
          })

      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log(chalk.yellow('Backup directory not found'))
          return
        }
        throw error
      }

    } catch (error) {
      console.error(chalk.red('Error listing backups:'), error)
      process.exit(1)
    }
  })

// Cleanup old backups command
program
  .command('cleanup')
  .description('Remove old backup files')
  .option('-p, --path <path>', 'Backup directory to clean', './backups')
  .option('-d, --days <days>', 'Remove backups older than N days', '30')
  .option('--dry-run', 'Show what would be deleted without deleting')
  .action(async (options) => {
    const spinner = ora('Scanning for old backups...').start()

    try {
      const backupDir = path.resolve(options.path)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(options.days))

      const entries = await fs.readdir(backupDir, { withFileTypes: true })
      const oldBackups = []

      for (const entry of entries) {
        if (entry.isDirectory() || entry.name.endsWith('.tar.gz')) {
          const backupPath = path.join(backupDir, entry.name)
          const stats = await fs.stat(backupPath)

          if (stats.birthtime < cutoffDate) {
            oldBackups.push({
              name: entry.name,
              path: backupPath,
              created: stats.birthtime,
              size: stats.size,
            })
          }
        }
      }

      spinner.stop()

      if (oldBackups.length === 0) {
        console.log(chalk.green('No old backups found'))
        return
      }

      console.log(chalk.blue(`\n🗑️  Old Backups (older than ${options.days} days):\n`))

      oldBackups.forEach(backup => {
        console.log(chalk.red(`  ✗ ${backup.name}`))
        console.log(chalk.gray(`    Created: ${backup.created.toLocaleString()}`))
        console.log(chalk.gray(`    Size: ${formatBytes(backup.size)}`))
      })

      const totalSize = oldBackups.reduce((sum, backup) => sum + backup.size, 0)
      console.log(chalk.yellow(`\nTotal size to be freed: ${formatBytes(totalSize)}`))

      if (options.dryRun) {
        console.log(chalk.blue('\nDry run completed - no files deleted'))
        return
      }

      // Delete old backups
      const deleteSpinner = ora('Deleting old backups...').start()

      for (const backup of oldBackups) {
        await fs.rm(backup.path, { recursive: true, force: true })
      }

      deleteSpinner.succeed(`Deleted ${oldBackups.length} old backup(s)`)
      console.log(chalk.green(`✓ Freed ${formatBytes(totalSize)} of storage`))

    } catch (error) {
      spinner.fail('Cleanup failed')
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

async function getDatabaseInfo(supabase: any) {
  // Get table list
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE')

  if (error) throw error

  return {
    name: 'koperasi_sinoman',
    version: '1.0',
    tables: tables.map((t: any) => t.table_name),
  }
}

async function backupSchema(backupDir: string, options: any) {
  // Use pg_dump to get schema
  const url = process.env.SUPABASE_URL
  const password = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !password) {
    throw new Error('Missing Supabase configuration')
  }

  // Convert Supabase URL to PostgreSQL connection string
  const dbUrl = url.replace('https://', `postgresql://postgres:${password}@`).replace('.supabase.co', '.supabase.co:5432')

  const schemaPath = path.join(backupDir, 'schema.sql')
  const command = `pg_dump "${dbUrl}" --schema-only --no-owner --no-privileges > "${schemaPath}"`

  await execAsync(command)
}

async function backupTable(supabase: any, backupDir: string, tableName: string, options: any) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')

  if (error) throw error

  const fileName = `${tableName}.${options.format}`
  const filePath = path.join(backupDir, fileName)

  switch (options.format) {
    case 'json':
      await fs.writeFile(filePath, JSON.stringify(data, null, 2))
      break

    case 'csv':
      if (data.length > 0) {
        const headers = Object.keys(data[0])
        const csv = [
          headers.join(','),
          ...data.map((row: any) =>
            headers.map(header => `"${String(row[header] || '').replace(/"/g, '""')}"`).join(',')
          )
        ].join('\n')
        await fs.writeFile(filePath, csv)
      }
      break

    case 'sql':
      const insertStatements = data.map((row: any) => {
        const columns = Object.keys(row)
        const values = columns.map(col => {
          const value = row[col]
          if (value === null) return 'NULL'
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
          return String(value)
        })
        return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`
      }).join('\n')

      await fs.writeFile(filePath, insertStatements)
      break
  }
}

async function getDirectorySize(dirPath: string): Promise<string> {
  try {
    const stats = await fs.stat(dirPath)
    if (stats.isFile()) {
      return formatBytes(stats.size)
    }

    // Calculate directory size recursively
    let totalSize = 0
    const files = await fs.readdir(dirPath, { withFileTypes: true })

    for (const file of files) {
      const filePath = path.join(dirPath, file.name)
      const fileStats = await fs.stat(filePath)

      if (fileStats.isDirectory()) {
        // Recursive call would go here
        totalSize += fileStats.size
      } else {
        totalSize += fileStats.size
      }
    }

    return formatBytes(totalSize)
  } catch {
    return 'Unknown'
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Parse command line arguments
program.parse()

export default program