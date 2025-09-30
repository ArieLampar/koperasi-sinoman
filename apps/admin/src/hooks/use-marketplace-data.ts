import { useState, useEffect } from 'react'

export interface MarketplaceStats {
  totalProducts: number
  activeSellers: number
  pendingOrders: number
  totalSales: number
  totalOrders: number
  avgOrderValue: number
  conversionRate: number
  topCategories: Array<{
    name: string
    count: number
    percentage: number
  }>
  recentActivity: Array<{
    id: string
    type: 'order' | 'product' | 'seller'
    description: string
    timestamp: string
    status: string
  }>
}

export function useMarketplaceStats(period: string = '30') {
  const [stats, setStats] = useState<MarketplaceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/admin/marketplace/stats?period=${period}`)

        if (!response.ok) {
          throw new Error('Failed to fetch marketplace stats')
        }

        const data = await response.json()
        setStats(data.data)
      } catch (err) {
        console.error('Error fetching marketplace stats:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')

        // Fallback with sample data for development
        setStats({
          totalProducts: 1247,
          activeSellers: 89,
          pendingOrders: 23,
          totalSales: 425000000,
          totalOrders: 1834,
          avgOrderValue: 231600,
          conversionRate: 3.2,
          topCategories: [
            { name: 'Makanan & Minuman', count: 487, percentage: 39.1 },
            { name: 'Kesehatan', count: 312, percentage: 25.0 },
            { name: 'Rumah Tangga', count: 249, percentage: 20.0 },
            { name: 'Fashion', count: 199, percentage: 15.9 }
          ],
          recentActivity: [
            {
              id: '1',
              type: 'order',
              description: 'Pesanan #ORD-2024-1234 dari Member A',
              timestamp: '2024-12-07T10:30:00Z',
              status: 'pending'
            },
            {
              id: '2',
              type: 'product',
              description: 'Produk baru "Madu Organik" ditambahkan',
              timestamp: '2024-12-07T09:15:00Z',
              status: 'active'
            },
            {
              id: '3',
              type: 'seller',
              description: 'Penjual "Toko Sehat" membutuhkan verifikasi',
              timestamp: '2024-12-07T08:45:00Z',
              status: 'pending'
            }
          ]
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [period])

  return { stats, loading, error }
}