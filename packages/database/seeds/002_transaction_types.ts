/**
 * Seed: Transaction Types
 * Description: Create default transaction types for financial operations
 * Environments: development, staging, production
 * Order: 2
 */

import { createClient } from '@supabase/supabase-js'

export const config = {
  name: 'Transaction Types',
  description: 'Create default transaction types for financial operations',
  environments: ['development', 'staging', 'production'],
  order: 2,
}

export async function seed(supabase: ReturnType<typeof createClient>) {
  console.log('Running seed: Transaction Types')

  try {
    const transactionTypes = [
      // Deposit transactions
      {
        name: 'Setoran Tunai',
        code: 'DEPOSIT_CASH',
        category: 'deposit',
        description: 'Setoran simpanan secara tunai',
      },
      {
        name: 'Setoran Transfer Bank',
        code: 'DEPOSIT_TRANSFER',
        category: 'deposit',
        description: 'Setoran simpanan melalui transfer bank',
      },
      {
        name: 'Setoran Virtual Account',
        code: 'DEPOSIT_VA',
        category: 'deposit',
        description: 'Setoran simpanan melalui virtual account',
      },
      {
        name: 'Setoran QRIS',
        code: 'DEPOSIT_QRIS',
        category: 'deposit',
        description: 'Setoran simpanan melalui QRIS',
      },

      // Withdrawal transactions
      {
        name: 'Penarikan Tunai',
        code: 'WITHDRAWAL_CASH',
        category: 'withdrawal',
        description: 'Penarikan simpanan secara tunai',
      },
      {
        name: 'Penarikan Transfer Bank',
        code: 'WITHDRAWAL_TRANSFER',
        category: 'withdrawal',
        description: 'Penarikan simpanan melalui transfer bank',
      },

      // Transfer transactions
      {
        name: 'Transfer Antar Rekening',
        code: 'TRANSFER_INTERNAL',
        category: 'transfer',
        description: 'Transfer antara rekening simpanan anggota',
      },
      {
        name: 'Transfer ke Bank',
        code: 'TRANSFER_EXTERNAL',
        category: 'transfer',
        description: 'Transfer dari rekening simpanan ke bank eksternal',
      },

      // Fee transactions
      {
        name: 'Biaya Administrasi',
        code: 'FEE_ADMIN',
        category: 'fee',
        description: 'Biaya administrasi bulanan',
      },
      {
        name: 'Biaya Transfer',
        code: 'FEE_TRANSFER',
        category: 'fee',
        description: 'Biaya untuk transfer ke bank eksternal',
      },
      {
        name: 'Biaya Penarikan',
        code: 'FEE_WITHDRAWAL',
        category: 'fee',
        description: 'Biaya untuk penarikan simpanan',
      },

      // Interest transactions
      {
        name: 'Bunga Simpanan',
        code: 'INTEREST_SAVINGS',
        category: 'interest',
        description: 'Bunga yang diterima dari simpanan',
      },
      {
        name: 'Bunga Deposito',
        code: 'INTEREST_DEPOSIT',
        category: 'interest',
        description: 'Bunga yang diterima dari deposito berjangka',
      },

      // Bonus transactions
      {
        name: 'Bonus Referral',
        code: 'BONUS_REFERRAL',
        category: 'bonus',
        description: 'Bonus dari referral anggota baru',
      },
      {
        name: 'SHU (Sisa Hasil Usaha)',
        code: 'BONUS_SHU',
        category: 'bonus',
        description: 'Pembagian Sisa Hasil Usaha tahunan',
      },
      {
        name: 'Bonus Loyalitas',
        code: 'BONUS_LOYALTY',
        category: 'bonus',
        description: 'Bonus untuk anggota loyal',
      },
    ]

    // Check if transaction types already exist
    const { data: existing } = await supabase
      .from('transaction_types')
      .select('code')

    const existingCodes = new Set(existing?.map(item => item.code) || [])

    // Filter out existing types
    const newTypes = transactionTypes.filter(type => !existingCodes.has(type.code))

    if (newTypes.length === 0) {
      console.log('ℹ Transaction types already exist, skipping...')
      return
    }

    const { error } = await supabase
      .from('transaction_types')
      .insert(newTypes)

    if (error) throw error

    console.log(`✓ Created ${newTypes.length} transaction types`)

    // Group by category for better display
    const grouped = newTypes.reduce((acc, type) => {
      if (!acc[type.category]) acc[type.category] = []
      acc[type.category].push(type)
      return acc
    }, {} as Record<string, typeof newTypes>)

    Object.entries(grouped).forEach(([category, types]) => {
      console.log(`  ${category.toUpperCase()}:`)
      types.forEach(type => {
        console.log(`    - ${type.name} (${type.code})`)
      })
    })

  } catch (error) {
    console.error('✗ Transaction Types failed:', error)
    throw error
  }
}

export default seed