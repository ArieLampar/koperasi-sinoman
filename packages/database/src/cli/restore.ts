#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
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
  .name('db-restore')
  .description('Database restore tool for Koperasi Sinoman')
  .version('0.1.0')

// Main restore command
program
  .argument('<backup>', 'Backup file or directory to restore from')
  .option('-t, --tables <tables...>', 'Specific tables to restore (default: all)')
  .option('--data-only', 'Restore data only (no schema)')
  .option('--schema-only', 'Restore schema only (no data)')
  .option('--truncate', 'Truncate tables before inserting data')
  .option('--force', 'Skip confirmation prompts')
  .action(async (backupPath, options) => {
    const spinner = ora('Initializing database restore...').start()

    try {
      // Safety confirmation
      if (!options.force) {
        spinner.stop()
        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: chalk.red('This will modify the database. Are you sure you want to continue?'),
            default: false,
          },
        ])

        if (!confirmed) {
          console.log(chalk.yellow('Restore cancelled'))
          return
        }
        spinner.start()
      }

      const resolvedBackupPath = path.resolve(backupPath)

      // Check if backup exists
      try {
        await fs.access(resolvedBackupPath)
      } catch {
        throw new Error(`Backup not found: ${resolvedBackupPath}`)
      }

      // Determine if it's a compressed backup
      const isCompressed = resolvedBackupPath.endsWith('.tar.gz')
      let workingDir = resolvedBackupPath

      if (isCompressed) {
        spinner.text = 'Extracting compressed backup...'
        const tempDir = path.join(path.dirname(resolvedBackupPath), 'temp_restore_' + Date.now())
        await fs.mkdir(tempDir, { recursive: true })

        await execAsync(`tar -xzf "${resolvedBackupPath}" -C "${tempDir}"`)

        // Find the extracted directory
        const extracted = await fs.readdir(tempDir)
        workingDir = path.join(tempDir, extracted[0])
      }

      // Read manifest
      const manifestPath = path.join(workingDir, 'manifest.json')
      let manifest = null

      try {
        const manifestContent = await fs.readFile(manifestPath, 'utf-8')
        manifest = JSON.parse(manifestContent)
      } catch {
        console.warn(chalk.yellow('Warning: No manifest found, proceeding with basic restore'))
      }

      const supabase = createSupabaseClient()

      // Restore schema if not data-only
      if (!options.dataOnly && !manifest?.options?.dataOnly) {
        spinner.text = 'Restoring database schema...'
        await restoreSchema(workingDir)
      }

      // Restore data if not schema-only
      if (!options.schemaOnly) {
        const tablesToRestore = options.tables || (manifest?.tables) || await getBackupTables(workingDir)

        for (const table of tablesToRestore) {
          spinner.text = `Restoring table: ${table}`

          if (options.truncate) {
            await truncateTable(supabase, table)
          }

          await restoreTable(supabase, workingDir, table, manifest)
        }
      }

      // Cleanup temporary directory if we extracted
      if (isCompressed) {
        await fs.rm(path.dirname(workingDir), { recursive: true })
      }

      spinner.succeed('Database restore completed')
      console.log(chalk.green('✓ Database successfully restored'))

      if (manifest) {
        console.log(chalk.gray(`  Backup from: ${new Date(manifest.timestamp).toLocaleString()}`))
        console.log(chalk.gray(`  Tables restored: ${(options.tables || manifest.tables).length}`))
      }

    } catch (error) {
      spinner.fail('Restore failed')
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  })

// Validate backup command
program
  .command('validate')
  .description('Validate a backup file')
  .argument('<backup>', 'Backup file or directory to validate')
  .action(async (backupPath) => {
    const spinner = ora('Validating backup...').start()

    try {
      const resolvedBackupPath = path.resolve(backupPath)

      // Check if backup exists
      try {
        await fs.access(resolvedBackupPath)
      } catch {
        throw new Error(`Backup not found: ${resolvedBackupPath}`)
      }

      const isCompressed = resolvedBackupPath.endsWith('.tar.gz')
      let workingDir = resolvedBackupPath

      if (isCompressed) {
        spinner.text = 'Extracting backup for validation...'
        const tempDir = path.join(path.dirname(resolvedBackupPath), 'temp_validate_' + Date.now())
        await fs.mkdir(tempDir, { recursive: true })

        try {
          await execAsync(`tar -xzf "${resolvedBackupPath}" -C "${tempDir}"`)
          const extracted = await fs.readdir(tempDir)
          workingDir = path.join(tempDir, extracted[0])
        } catch (error) {
          await fs.rm(tempDir, { recursive: true })
          throw new Error('Failed to extract compressed backup')
        }
      }

      // Validate manifest
      const manifestPath = path.join(workingDir, 'manifest.json')
      let manifest = null

      try {
        const manifestContent = await fs.readFile(manifestPath, 'utf-8')
        manifest = JSON.parse(manifestContent)
      } catch {
        spinner.warn('No manifest found')
      }

      // Check backup files
      const backupFiles = await fs.readdir(workingDir)
      const dataFiles = backupFiles.filter(file =>
        file.endsWith('.json') || file.endsWith('.csv') || file.endsWith('.sql')
      )

      // Validate each data file
      for (const file of dataFiles) {
        spinner.text = `Validating ${file}...`
        const filePath = path.join(workingDir, file)
        const stats = await fs.stat(filePath)

        if (stats.size === 0) {
          console.warn(chalk.yellow(`Warning: ${file} is empty`))
        }

        // Basic format validation
        if (file.endsWith('.json')) {
          try {
            const content = await fs.readFile(filePath, 'utf-8')
            JSON.parse(content)
          } catch {
            throw new Error(`Invalid JSON format in ${file}`)
          }
        }
      }

      // Cleanup if extracted
      if (isCompressed) {
        await fs.rm(path.dirname(workingDir), { recursive: true })
      }

      spinner.succeed('Backup validation completed')

      console.log(chalk.green('✓ Backup is valid'))

      if (manifest) {
        console.log(chalk.blue('\n📋 Backup Information:'))
        console.log(chalk.gray(`  Created: ${new Date(manifest.timestamp).toLocaleString()}`))
        console.log(chalk.gray(`  Database: ${manifest.database}`))
        console.log(chalk.gray(`  Format: ${manifest.format}`))
        console.log(chalk.gray(`  Tables: ${manifest.tables.length}`))
        console.log(chalk.gray(`  Options: ${JSON.stringify(manifest.options)}`))
      }

      console.log(chalk.blue('\n📁 Backup Contents:'))
      dataFiles.forEach(file => {
        console.log(chalk.gray(`  • ${file}`))
      })

    } catch (error) {
      spinner.fail('Validation failed')
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  })

// Compare backup command
program
  .command('compare')
  .description('Compare backup with current database state')
  .argument('<backup>', 'Backup file or directory to compare')
  .option('-t, --table <table>', 'Compare specific table only')
  .action(async (backupPath, options) => {
    const spinner = ora('Comparing backup with database...').start()

    try {
      // This would implement comparison logic
      spinner.info('Compare functionality not fully implemented')

      console.log(chalk.blue('\nComparison would show:'))
      console.log(chalk.gray('• Tables added/removed'))
      console.log(chalk.gray('• Schema changes'))
      console.log(chalk.gray('• Data differences'))
      console.log(chalk.gray('• Record counts'))

    } catch (error) {
      spinner.fail('Comparison failed')
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

async function restoreSchema(backupDir: string) {
  const schemaPath = path.join(backupDir, 'schema.sql')

  try {
    await fs.access(schemaPath)
  } catch {
    console.warn(chalk.yellow('No schema file found, skipping schema restore'))
    return
  }

  // Use psql to restore schema
  const url = process.env.SUPABASE_URL
  const password = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !password) {
    throw new Error('Missing Supabase configuration')
  }

  const dbUrl = url.replace('https://', `postgresql://postgres:${password}@`).replace('.supabase.co', '.supabase.co:5432')
  const command = `psql "${dbUrl}" -f "${schemaPath}"`

  await execAsync(command)
}

async function restoreTable(supabase: any, backupDir: string, tableName: string, manifest: any) {
  const format = manifest?.format || 'json'
  const fileName = `${tableName}.${format}`
  const filePath = path.join(backupDir, fileName)

  try {
    await fs.access(filePath)
  } catch {
    console.warn(chalk.yellow(`Backup file not found for table: ${tableName}`))
    return
  }

  const fileContent = await fs.readFile(filePath, 'utf-8')

  switch (format) {
    case 'json':
      const jsonData = JSON.parse(fileContent)
      if (jsonData.length > 0) {
        // Insert in batches to avoid timeout
        const batchSize = 1000
        for (let i = 0; i < jsonData.length; i += batchSize) {
          const batch = jsonData.slice(i, i + batchSize)
          const { error } = await supabase.from(tableName).insert(batch)
          if (error) throw error
        }
      }
      break

    case 'sql':
      // For SQL format, we'd need to execute the INSERT statements
      // This is simplified - in practice, you'd parse and execute SQL
      console.warn(chalk.yellow(`SQL restore not fully implemented for table: ${tableName}`))
      break

    case 'csv':
      // CSV parsing and insertion would go here
      console.warn(chalk.yellow(`CSV restore not fully implemented for table: ${tableName}`))
      break
  }
}

async function truncateTable(supabase: any, tableName: string) {
  const { error } = await supabase.rpc('truncate_table', { table_name: tableName })
  if (error && !error.message.includes('does not exist')) {
    throw error
  }
}

async function getBackupTables(backupDir: string): Promise<string[]> {
  const files = await fs.readdir(backupDir)
  const tableFiles = files.filter(file =>
    file.endsWith('.json') || file.endsWith('.csv') || (file.endsWith('.sql') && file !== 'schema.sql')
  )

  return tableFiles.map(file => {
    const parts = file.split('.')
    parts.pop() // Remove extension
    return parts.join('.')
  })
}

// Parse command line arguments
program.parse()

export default program