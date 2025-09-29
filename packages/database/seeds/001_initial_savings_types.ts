/**
 * Seed: Initial Savings Types
 * Description: Create default savings account types for the cooperative
 * Environments: development, staging, production
 * Order: 1
 */

import { createClient } from '@supabase/supabase-js'

export const config = {
  name: 'Initial Savings Types',
  description: 'Create default savings account types for the cooperative',
  environments: ['development', 'staging', 'production'],
  order: 1,
}

export async function seed(supabase: ReturnType<typeof createClient>) {
  console.log('Running seed: Initial Savings Types')

  try {
    const savingsTypes = [
      {
        name: 'Simpanan Pokok',
        code: 'POKOK',
        description: 'Simpanan pokok yang wajib dibayar saat menjadi anggota koperasi',
        minimum_amount: 100000, // Rp 100,000
        is_withdrawable: false,
        is_mandatory: true,
        interest_rate: 0.0, // 0% per year
      },
      {
        name: 'Simpanan Wajib',
        code: 'WAJIB',
        description: 'Simpanan wajib bulanan yang harus dibayar setiap anggota',
        minimum_amount: 50000, // Rp 50,000
        is_withdrawable: false,
        is_mandatory: true,
        interest_rate: 0.03, // 3% per year
      },
      {
        name: 'Simpanan Sukarela',
        code: 'SUKARELA',
        description: 'Simpanan sukarela yang dapat disetor dan ditarik kapan saja',
        minimum_amount: 10000, // Rp 10,000
        is_withdrawable: true,
        is_mandatory: false,
        interest_rate: 0.06, // 6% per year
      },
      {
        name: 'Simpanan Berjangka',
        code: 'BERJANGKA',
        description: 'Simpanan berjangka dengan jangka waktu tertentu dan bunga lebih tinggi',
        minimum_amount: 1000000, // Rp 1,000,000
        is_withdrawable: false,
        is_mandatory: false,
        interest_rate: 0.08, // 8% per year
      },
    ]

    // Check if savings types already exist
    const { data: existing } = await supabase
      .from('savings_types')
      .select('code')

    const existingCodes = new Set(existing?.map(item => item.code) || [])

    // Filter out existing types
    const newTypes = savingsTypes.filter(type => !existingCodes.has(type.code))

    if (newTypes.length === 0) {
      console.log('ℹ Savings types already exist, skipping...')
      return
    }

    const { error } = await supabase
      .from('savings_types')
      .insert(newTypes)

    if (error) throw error

    console.log(`✓ Created ${newTypes.length} savings types`)
    newTypes.forEach(type => {
      console.log(`  - ${type.name} (${type.code})`)
    })

  } catch (error) {
    console.error('✗ Initial Savings Types failed:', error)
    throw error
  }
}

export default seed