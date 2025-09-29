/**
 * Seed: Development Sample Data
 * Description: Create sample data for development environment only
 * Environments: development
 * Order: 100
 */

import { createClient } from '@supabase/supabase-js'

export const config = {
  name: 'Development Sample Data',
  description: 'Create sample data for development environment only',
  environments: ['development'],
  order: 100,
}

export async function seed(supabase: ReturnType<typeof createClient>) {
  console.log('Running seed: Development Sample Data')

  try {
    // Create sample members
    const sampleMembers = [
      {
        member_number: 'SIN-2024-000001',
        full_name: 'Budi Santoso',
        nik: '3502011234567890',
        email: 'budi.santoso@example.com',
        phone: '081234567890',
        date_of_birth: '1990-05-15',
        gender: 'male',
        address: 'Jl. Merdeka No. 123',
        village: 'Tonatan',
        district: 'Ponorogo',
        city: 'Ponorogo',
        province: 'Jawa Timur',
        postal_code: '63411',
        membership_type: 'regular',
        membership_status: 'active',
        kyc_status: 'verified',
        occupation: 'Pegawai Swasta',
        referral_code: 'BUDI2024',
      },
      {
        member_number: 'SIN-2024-000002',
        full_name: 'Siti Nurhaliza',
        nik: '3502022234567891',
        email: 'siti.nurhaliza@example.com',
        phone: '081234567891',
        date_of_birth: '1985-08-20',
        gender: 'female',
        address: 'Jl. Ahmad Yani No. 456',
        village: 'Bangunsari',
        district: 'Ponorogo',
        city: 'Ponorogo',
        province: 'Jawa Timur',
        postal_code: '63411',
        membership_type: 'premium',
        membership_status: 'active',
        kyc_status: 'verified',
        occupation: 'Guru',
        referral_code: 'SITI2024',
      },
      {
        member_number: 'SIN-2024-000003',
        full_name: 'Ahmad Wijaya',
        nik: '3502033234567892',
        email: 'ahmad.wijaya@example.com',
        phone: '081234567892',
        date_of_birth: '1992-12-10',
        gender: 'male',
        address: 'Jl. Sudirman No. 789',
        village: 'Nologaten',
        district: 'Ponorogo',
        city: 'Ponorogo',
        province: 'Jawa Timur',
        postal_code: '63411',
        membership_type: 'investor',
        membership_status: 'active',
        kyc_status: 'pending',
        occupation: 'Wiraswasta',
        referral_code: 'AHMAD024',
      },
    ]

    // Check if sample members already exist
    const { data: existingMembers } = await supabase
      .from('members')
      .select('member_number')
      .in('member_number', sampleMembers.map(m => m.member_number))

    const existingNumbers = new Set(existingMembers?.map(m => m.member_number) || [])
    const newMembers = sampleMembers.filter(m => !existingNumbers.has(m.member_number))

    if (newMembers.length > 0) {
      const { data: insertedMembers, error: memberError } = await supabase
        .from('members')
        .insert(newMembers)
        .select('id, member_number, full_name')

      if (memberError) throw memberError

      console.log(`✓ Created ${newMembers.length} sample members`)
      insertedMembers.forEach(member => {
        console.log(`  - ${member.full_name} (${member.member_number})`)
      })

      // Create sample savings accounts for the new members
      const { data: savingsTypes } = await supabase
        .from('savings_types')
        .select('id, code')

      if (savingsTypes && savingsTypes.length > 0) {
        const savingsAccounts = []

        for (const member of insertedMembers) {
          // Create mandatory accounts (POKOK and WAJIB)
          const mandatoryTypes = savingsTypes.filter(st =>
            st.code === 'POKOK' || st.code === 'WAJIB'
          )

          for (const savingsType of mandatoryTypes) {
            savingsAccounts.push({
              member_id: member.id,
              savings_type_id: savingsType.id,
              account_number: `SA-2024-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
              balance: savingsType.code === 'POKOK' ? 100000 : 50000,
              status: 'active',
            })
          }

          // Create optional sukarela account for some members
          if (Math.random() > 0.5) {
            const sukarelaType = savingsTypes.find(st => st.code === 'SUKARELA')
            if (sukarelaType) {
              savingsAccounts.push({
                member_id: member.id,
                savings_type_id: sukarelaType.id,
                account_number: `SA-2024-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
                balance: Math.floor(Math.random() * 1000000) + 100000, // Random balance 100k - 1.1M
                status: 'active',
              })
            }
          }
        }

        const { error: accountError } = await supabase
          .from('savings_accounts')
          .insert(savingsAccounts)

        if (accountError) throw accountError

        console.log(`✓ Created ${savingsAccounts.length} sample savings accounts`)
      }
    } else {
      console.log('ℹ Sample members already exist, skipping...')
    }

    // Create sample product categories
    const sampleCategories = [
      {
        name: 'Hasil Pertanian',
        slug: 'hasil-pertanian',
        description: 'Produk-produk hasil pertanian dari anggota koperasi',
        sort_order: 1,
        is_active: true,
      },
      {
        name: 'Makanan & Minuman',
        slug: 'makanan-minuman',
        description: 'Produk makanan dan minuman olahan',
        sort_order: 2,
        is_active: true,
      },
      {
        name: 'Kerajinan Tangan',
        slug: 'kerajinan-tangan',
        description: 'Produk kerajinan tangan dan handicraft',
        sort_order: 3,
        is_active: true,
      },
    ]

    const { data: existingCategories } = await supabase
      .from('product_categories')
      .select('slug')
      .in('slug', sampleCategories.map(c => c.slug))

    const existingSlugs = new Set(existingCategories?.map(c => c.slug) || [])
    const newCategories = sampleCategories.filter(c => !existingSlugs.has(c.slug))

    if (newCategories.length > 0) {
      const { error: categoryError } = await supabase
        .from('product_categories')
        .insert(newCategories)

      if (categoryError) throw categoryError

      console.log(`✓ Created ${newCategories.length} sample product categories`)
      newCategories.forEach(category => {
        console.log(`  - ${category.name}`)
      })
    } else {
      console.log('ℹ Sample categories already exist, skipping...')
    }

    console.log('✓ Development sample data seeding completed')

  } catch (error) {
    console.error('✗ Development Sample Data failed:', error)
    throw error
  }
}

export default seed