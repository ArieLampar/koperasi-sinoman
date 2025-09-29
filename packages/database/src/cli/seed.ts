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
  .name('db-seed')
  .description('Database seeding tool for Koperasi Sinoman')
  .version('0.1.0')

interface SeedFile {
  name: string
  path: string
  order: number
  environment: string[]
  description?: string
}

// Main seed command
program
  .option('-e, --env <environment>', 'Environment to seed (development, staging, production)', 'development')
  .option('-f, --file <file>', 'Specific seed file to run')
  .option('--dry-run', 'Show what would be seeded without executing')
  .option('--force', 'Force seed in production environment')
  .action(async (options) => {
    const spinner = ora('Initializing database seeding...').start()

    try {
      // Safety check for production
      if (options.env === 'production' && !options.force) {
        spinner.stop()
        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: chalk.red('You are about to seed PRODUCTION database. Are you sure?'),
            default: false,
          },
        ])

        if (!confirmed) {
          console.log(chalk.yellow('Seeding cancelled'))
          return
        }
        spinner.start()
      }

      const supabase = createSupabaseClient()

      // Get seed files
      const seedFiles = await getSeedFiles(options.env, options.file)

      if (seedFiles.length === 0) {
        spinner.succeed('No seed files found for this environment')
        return
      }

      spinner.text = `Found ${seedFiles.length} seed file(s) for ${options.env}`

      if (options.dryRun) {
        spinner.succeed('Dry run completed')
        console.log(chalk.blue(`\nSeed files for ${options.env}:`))
        seedFiles.forEach(file => {
          console.log(chalk.gray(`  ${file.order}. ${file.name} - ${file.description || 'No description'}`))
        })
        return
      }

      // Execute seed files
      for (const seedFile of seedFiles) {
        spinner.text = `Running seed: ${seedFile.name}`
        await executeSeedFile(supabase, seedFile)
      }

      spinner.succeed(`Successfully seeded ${seedFiles.length} file(s)`)
      console.log(chalk.green(`✓ Database seeded for ${options.env} environment`))

    } catch (error) {
      spinner.fail('Seeding failed')
      console.error(chalk.red('Error:'), error)
      process.exit(1)
    }
  })

// Create seed file command
program
  .command('create')
  .description('Create a new seed file')
  .argument('[name]', 'Seed file name')
  .option('-e, --env <environments...>', 'Environments this seed applies to', ['development'])
  .option('-o, --order <number>', 'Execution order (lower numbers run first)', '100')
  .option('-d, --description <description>', 'Seed file description')
  .action(async (name, options) => {
    try {
      let seedName = name

      if (!seedName) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Enter seed file name:',
            validate: (input) => input.length > 0 || 'Seed name is required',
          },
        ])
        seedName = answers.name
      }

      const fileName = `${String(options.order).padStart(3, '0')}_${seedName.toLowerCase().replace(/\s+/g, '_')}.ts`
      const seedPath = path.join(process.cwd(), 'seeds', fileName)

      // Ensure seeds directory exists
      await fs.mkdir(path.dirname(seedPath), { recursive: true })

      const template = `/**
 * Seed: ${seedName}
 * Description: ${options.description || 'Add description here'}
 * Environments: ${options.env.join(', ')}
 * Order: ${options.order}
 */

import { createClient } from '@supabase/supabase-js'

export const config = {
  name: '${seedName}',
  description: '${options.description || 'Add description here'}',
  environments: ${JSON.stringify(options.env)},
  order: ${options.order},
}

export async function seed(supabase: ReturnType<typeof createClient>) {
  console.log('Running seed: ${seedName}')

  try {
    // Add your seeding logic here

    // Example: Insert sample data
    /*
    const { error } = await supabase
      .from('your_table')
      .insert([
        { name: 'Sample Data 1' },
        { name: 'Sample Data 2' },
      ])

    if (error) throw error
    */

    console.log('✓ ${seedName} completed')
  } catch (error) {
    console.error('✗ ${seedName} failed:', error)
    throw error
  }
}

export default seed
`

      await fs.writeFile(seedPath, template)

      console.log(chalk.green(`✓ Created seed file: ${fileName}`))
      console.log(chalk.gray(`  Location: ${seedPath}`))
      console.log(chalk.gray(`  Environments: ${options.env.join(', ')}`))
      console.log(chalk.gray(`  Order: ${options.order}`))
    } catch (error) {
      console.error(chalk.red('Error creating seed file:'), error)
      process.exit(1)
    }
  })

// List seed files command
program
  .command('list')
  .description('List available seed files')
  .option('-e, --env <environment>', 'Filter by environment')
  .action(async (options) => {
    try {
      const seedFiles = await getSeedFiles(options.env)

      if (seedFiles.length === 0) {
        console.log(chalk.yellow('No seed files found'))
        return
      }

      console.log(chalk.blue(`\n📋 Available Seed Files${options.env ? ` (${options.env})` : ''}:\n`))

      const grouped = groupBy(seedFiles, 'environment')

      Object.entries(grouped).forEach(([env, files]) => {
        console.log(chalk.cyan(`${env.toUpperCase()}:`))
        files
          .sort((a, b) => a.order - b.order)
          .forEach(file => {
            console.log(chalk.gray(`  ${file.order}. ${file.name} - ${file.description || 'No description'}`))
          })
        console.log()
      })
    } catch (error) {
      console.error(chalk.red('Error listing seed files:'), error)
      process.exit(1)
    }
  })

// Reset command (clear seeded data)
program
  .command('reset')
  .description('Reset seeded data (dangerous operation)')
  .option('-e, --env <environment>', 'Environment to reset', 'development')
  .option('--confirm', 'Skip confirmation prompt')
  .action(async (options) => {
    try {
      if (options.env === 'production') {
        console.error(chalk.red('Cannot reset production database'))
        process.exit(1)
      }

      if (!options.confirm) {
        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: chalk.red(`This will delete all seeded data in ${options.env}. Continue?`),
            default: false,
          },
        ])

        if (!confirmed) {
          console.log(chalk.yellow('Reset cancelled'))
          return
        }
      }

      const spinner = ora('Resetting seeded data...').start()

      const supabase = createSupabaseClient()

      // This would implement the reset logic
      // For safety, this is not fully implemented
      spinner.warn('Reset functionality not fully implemented for safety')

      console.log(chalk.yellow('Manual reset required:'))
      console.log(chalk.gray('1. Drop and recreate database'))
      console.log(chalk.gray('2. Run migrations: npm run db:migrate:up'))
      console.log(chalk.gray('3. Run seeds: npm run db:seed'))

    } catch (error) {
      console.error(chalk.red('Error resetting data:'), error)
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

async function getSeedFiles(environment?: string, specificFile?: string): Promise<SeedFile[]> {
  try {
    const seedsDir = path.join(process.cwd(), 'seeds')
    const files = await fs.readdir(seedsDir)

    const seedFiles: SeedFile[] = []

    for (const file of files) {
      if (!file.endsWith('.ts') && !file.endsWith('.js')) continue

      if (specificFile && !file.includes(specificFile)) continue

      const filePath = path.join(seedsDir, file)

      try {
        // Dynamically import the seed file
        const seedModule = await import(filePath)
        const config = seedModule.config || {}

        const seedFile: SeedFile = {
          name: config.name || file.replace(/\.(ts|js)$/, ''),
          path: filePath,
          order: config.order || 100,
          environment: config.environments || ['development'],
          description: config.description,
        }

        // Filter by environment if specified
        if (!environment || seedFile.environment.includes(environment)) {
          seedFiles.push(seedFile)
        }
      } catch (error) {
        console.warn(chalk.yellow(`Warning: Could not load seed file ${file}`))
      }
    }

    return seedFiles.sort((a, b) => a.order - b.order)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  }
}

async function executeSeedFile(supabase: any, seedFile: SeedFile): Promise<void> {
  try {
    const seedModule = await import(seedFile.path)
    const seedFunction = seedModule.default || seedModule.seed

    if (typeof seedFunction !== 'function') {
      throw new Error(`Seed file ${seedFile.name} does not export a seed function`)
    }

    await seedFunction(supabase)
  } catch (error) {
    throw new Error(`Failed to execute seed ${seedFile.name}: ${error.message}`)
  }
}

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const value = item[key] as string
    const values = Array.isArray(value) ? value : [value]

    values.forEach(v => {
      if (!groups[v]) groups[v] = []
      groups[v].push(item)
    })

    return groups
  }, {} as Record<string, T[]>)
}

// Parse command line arguments
program.parse()

export default program