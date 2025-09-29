#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { config } from 'dotenv'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'

// Load environment variables
config()

const execAsync = promisify(exec)

const program = new Command()

program
  .name('db-types')
  .description('Generate TypeScript types from Supabase database schema')
  .version('0.1.0')

program
  .option('-o, --output <path>', 'Output file path', 'src/types/database.ts')
  .option('-s, --schema <schema>', 'Database schema to generate types for', 'public')
  .option('--project-id <id>', 'Supabase project ID (overrides env var)')
  .option('--dry-run', 'Show what would be generated without writing files')
  .action(async (options) => {
    const spinner = ora('Generating TypeScript types...').start()

    try {
      // Get project configuration
      const projectId = options.projectId || process.env.SUPABASE_PROJECT_ID
      const supabaseUrl = process.env.SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!projectId && !supabaseUrl) {
        throw new Error('Missing SUPABASE_PROJECT_ID or SUPABASE_URL environment variable')
      }

      spinner.text = 'Fetching database schema...'

      let command: string

      if (projectId) {
        // Use Supabase CLI with project ID
        command = `supabase gen types typescript --project-id ${projectId} --schema ${options.schema}`
      } else {
        // Use direct connection with URL and key
        if (!serviceRoleKey) {
          throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
        }
        command = `supabase gen types typescript --db-url "${supabaseUrl.replace('https://', `postgresql://postgres:${serviceRoleKey}@`).replace('.supabase.co', '.supabase.co:5432')}" --schema ${options.schema}`
      }

      spinner.text = 'Generating TypeScript definitions...'

      const { stdout, stderr } = await execAsync(command)

      if (stderr && !stderr.includes('Warning')) {
        throw new Error(stderr)
      }

      let generatedTypes = stdout

      // Add custom header and imports
      const header = `/**
 * Database types generated from Supabase schema
 * Generated on: ${new Date().toISOString()}
 * Schema: ${options.schema}
 *
 * This file is auto-generated. Do not edit manually.
 * To regenerate, run: npm run db:generate-types
 */

`

      // Add additional utility types
      const utilityTypes = `
// Utility types for better developer experience
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Custom helper types
export type UUID = string
export type Timestamp = string
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Table names as union type
export type TableName = keyof Database['public']['Tables']

// Function to get table type
export type GetTableType<T extends TableName> = Database['public']['Tables'][T]['Row']

`

      generatedTypes = header + generatedTypes + utilityTypes

      if (options.dryRun) {
        spinner.succeed('Dry run completed')
        console.log(chalk.blue('\nGenerated types preview:'))
        console.log(chalk.gray(generatedTypes.slice(0, 1000) + '...'))
        return
      }

      // Ensure output directory exists
      const outputPath = path.resolve(options.output)
      await fs.mkdir(path.dirname(outputPath), { recursive: true })

      // Write types to file
      spinner.text = 'Writing types to file...'
      await fs.writeFile(outputPath, generatedTypes)

      // Format the file if prettier is available
      try {
        await execAsync(`npx prettier --write "${outputPath}"`)
      } catch {
        // Prettier not available, skip formatting
      }

      spinner.succeed('TypeScript types generated successfully')
      console.log(chalk.green(`✓ Types written to: ${outputPath}`))
      console.log(chalk.gray(`  Schema: ${options.schema}`))
      console.log(chalk.gray(`  Size: ${Math.round(generatedTypes.length / 1024)}KB`))

    } catch (error) {
      spinner.fail('Failed to generate types')

      if (error.message.includes('supabase')) {
        console.error(chalk.red('\nError: Supabase CLI not found or not configured'))
        console.log(chalk.yellow('\nTo fix this issue:'))
        console.log(chalk.gray('1. Install Supabase CLI: npm install -g supabase'))
        console.log(chalk.gray('2. Login to Supabase: supabase login'))
        console.log(chalk.gray('3. Set your project ID in environment variables'))
      } else {
        console.error(chalk.red('Error:'), error.message)
      }

      process.exit(1)
    }
  })

// Add command to validate existing types
program
  .command('validate')
  .description('Validate existing TypeScript types against database schema')
  .option('-f, --file <path>', 'TypeScript types file to validate', 'src/types/database.ts')
  .action(async (options) => {
    const spinner = ora('Validating TypeScript types...').start()

    try {
      // Check if types file exists
      const typesPath = path.resolve(options.file)

      try {
        await fs.access(typesPath)
      } catch {
        throw new Error(`Types file not found: ${typesPath}`)
      }

      spinner.text = 'Reading existing types...'
      const existingTypes = await fs.readFile(typesPath, 'utf-8')

      spinner.text = 'Generating fresh types for comparison...'

      // Generate fresh types in memory
      const projectId = process.env.SUPABASE_PROJECT_ID
      const command = `supabase gen types typescript --project-id ${projectId} --schema public`

      const { stdout } = await execAsync(command)
      const freshTypes = stdout

      // Simple comparison (in a real implementation, you'd do more sophisticated diffing)
      const existingHash = hashString(existingTypes.replace(/Generated on:.*\n/, ''))
      const freshHash = hashString(freshTypes)

      if (existingHash === freshHash) {
        spinner.succeed('Types are up to date')
        console.log(chalk.green('✓ Database types match schema'))
      } else {
        spinner.warn('Types may be outdated')
        console.log(chalk.yellow('⚠ Database types may not match current schema'))
        console.log(chalk.gray('Run "npm run db:generate-types" to update'))
      }

    } catch (error) {
      spinner.fail('Validation failed')
      console.error(chalk.red('Error:'), error.message)
      process.exit(1)
    }
  })

// Add command to check schema changes
program
  .command('diff')
  .description('Show differences between current types and database schema')
  .option('-f, --file <path>', 'TypeScript types file to compare', 'src/types/database.ts')
  .action(async (options) => {
    const spinner = ora('Checking schema differences...').start()

    try {
      spinner.text = 'Generating current schema types...'

      const projectId = process.env.SUPABASE_PROJECT_ID
      if (!projectId) {
        throw new Error('Missing SUPABASE_PROJECT_ID environment variable')
      }

      const command = `supabase gen types typescript --project-id ${projectId} --schema public`
      const { stdout } = await execAsync(command)

      spinner.text = 'Reading existing types...'

      const typesPath = path.resolve(options.file)
      let existingTypes = ''

      try {
        existingTypes = await fs.readFile(typesPath, 'utf-8')
      } catch {
        console.log(chalk.yellow('No existing types file found'))
      }

      spinner.stop()

      if (!existingTypes) {
        console.log(chalk.blue('\n📋 New schema detected:'))
        console.log(chalk.gray(stdout.slice(0, 500) + '...'))
        return
      }

      // Simple diff (in production, use a proper diff library)
      const currentLines = stdout.split('\n')
      const existingLines = existingTypes.split('\n')

      console.log(chalk.blue('\n📊 Schema Changes Detected:'))

      if (currentLines.length !== existingLines.length) {
        console.log(chalk.yellow(`  Line count changed: ${existingLines.length} → ${currentLines.length}`))
      }

      // This is a simplified diff - in production, use libraries like 'diff'
      console.log(chalk.gray('\nRun "npm run db:generate-types" to update types'))

    } catch (error) {
      spinner.fail('Failed to check differences')
      console.error(chalk.red('Error:'), error.message)
      process.exit(1)
    }
  })

// Simple hash function for comparison
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString()
}

// Parse command line arguments
program.parse()

export default program