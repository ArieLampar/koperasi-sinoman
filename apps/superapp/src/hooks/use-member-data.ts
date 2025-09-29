'use client'

import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers/supabase-provider'
import { useAuth } from '@/components/providers/auth-provider'

export interface MemberData {
  id: string
  member_id: string
  full_name: string
  email: string
  phone: string
  join_date: string
  status: 'active' | 'inactive' | 'pending'
  profile_image?: string
}

export interface SavingsData {
  id: string
  type: 'pokok' | 'wajib' | 'sukarela'
  balance: number
  last_transaction: string
  monthly_target?: number
  interest_rate: number
}

export interface TransactionData {
  id: string
  type: 'deposit' | 'withdrawal' | 'loan' | 'payment'
  amount: number
  description: string
  date: string
  status: 'completed' | 'pending' | 'failed'
  category: string
}

export function useMemberData() {
  const { supabase } = useSupabase()
  const { user } = useAuth()

  return useQuery({
    queryKey: ['member-data', user?.id],
    queryFn: async (): Promise<MemberData | null> => {
      if (!user) return null

      // Mock data for now - replace with actual Supabase query
      return {
        id: user.id,
        member_id: 'M001234',
        full_name: user.user_metadata?.full_name || 'Anggota Koperasi',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        join_date: '2023-01-15',
        status: 'active',
        profile_image: user.user_metadata?.avatar_url
      }
    },
    enabled: !!user,
  })
}

export function useSavingsData() {
  const { supabase } = useSupabase()
  const { user } = useAuth()

  return useQuery({
    queryKey: ['savings-data', user?.id],
    queryFn: async (): Promise<SavingsData[]> => {
      if (!user) return []

      // Mock data for now - replace with actual Supabase query
      return [
        {
          id: '1',
          type: 'pokok',
          balance: 500000,
          last_transaction: '2024-01-15',
          interest_rate: 0,
        },
        {
          id: '2',
          type: 'wajib',
          balance: 2400000,
          last_transaction: '2024-01-15',
          monthly_target: 100000,
          interest_rate: 8,
        },
        {
          id: '3',
          type: 'sukarela',
          balance: 1850000,
          last_transaction: '2024-01-10',
          interest_rate: 12,
        }
      ]
    },
    enabled: !!user,
  })
}

export function useRecentTransactions() {
  const { supabase } = useSupabase()
  const { user } = useAuth()

  return useQuery({
    queryKey: ['recent-transactions', user?.id],
    queryFn: async (): Promise<TransactionData[]> => {
      if (!user) return []

      // Mock data for now - replace with actual Supabase query
      return [
        {
          id: '1',
          type: 'deposit',
          amount: 100000,
          description: 'Setoran Simpanan Wajib',
          date: '2024-01-15T10:30:00Z',
          status: 'completed',
          category: 'savings'
        },
        {
          id: '2',
          type: 'payment',
          amount: 85000,
          description: 'Angsuran Pinjaman Usaha',
          date: '2024-01-14T14:20:00Z',
          status: 'completed',
          category: 'loan'
        },
        {
          id: '3',
          type: 'deposit',
          amount: 250000,
          description: 'Setoran Simpanan Sukarela',
          date: '2024-01-10T09:15:00Z',
          status: 'completed',
          category: 'savings'
        },
        {
          id: '4',
          type: 'withdrawal',
          amount: 150000,
          description: 'Penarikan Simpanan Sukarela',
          date: '2024-01-08T16:45:00Z',
          status: 'completed',
          category: 'savings'
        }
      ]
    },
    enabled: !!user,
  })
}