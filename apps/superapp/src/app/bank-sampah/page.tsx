'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Recycle,
  Leaf,
  TrendingUp,
  Calendar,
  MapPin,
  Clock,
  Award,
  Users,
  ArrowUpRight,
  ChevronRight,
  Plus,
  CheckCircle,
  AlertCircle,
  Package,
  Truck
} from 'lucide-react'

// Hooks and utilities
import { useAuth } from '@/components/providers/auth-provider'
import { formatCurrency } from '@/lib/utils/currency'
import { formatRelativeTime, formatDate } from '@/lib/utils/date'

// Types
interface WasteContribution {
  id: string
  waste_type: 'organic' | 'plastic' | 'paper' | 'metal' | 'glass' | 'electronic'
  weight_kg: number
  points_earned: number
  pickup_date: string
  status: 'scheduled' | 'collected' | 'processed' | 'completed'
  description?: string
}

interface PointsSummary {
  total_points: number
  available_points: number
  redeemed_points: number
  this_month_points: number
  total_waste_kg: number
  environmental_impact: {
    co2_saved_kg: number
    trees_saved: number
    water_saved_liters: number
  }
}

interface PickupRequest {
  id: string
  requested_date: string
  preferred_time: string
  address: string
  estimated_weight: number
  waste_types: string[]
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
  pickup_fee?: number
}

interface Leaderboard {
  rank: number
  member_name: string
  points: number
  waste_kg: number
  is_current_user: boolean
}

export default function BankSampahPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // State
  const [contributions, setContributions] = useState<WasteContribution[]>([])
  const [pointsSummary, setPointsSummary] = useState<PointsSummary | null>(null)
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([])
  const [leaderboard, setLeaderboard] = useState<Leaderboard[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contributions' | 'pickup' | 'leaderboard'>('dashboard')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // Fetch data
  useEffect(() => {
    if (user) {
      fetchBankSampahData()
    }
  }, [user])

  const fetchBankSampahData = async () => {
    try {
      setLoading(true)

      // Fetch points summary
      const summaryResponse = await fetch('/api/bank-sampah/summary')
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        setPointsSummary(summaryData.data)
      }

      // Fetch contributions
      const contributionsResponse = await fetch('/api/bank-sampah/contributions')
      if (contributionsResponse.ok) {
        const contributionsData = await contributionsResponse.json()
        setContributions(contributionsData.data || [])
      }

      // Fetch pickup requests
      const pickupResponse = await fetch('/api/bank-sampah/pickup-requests')
      if (pickupResponse.ok) {
        const pickupData = await pickupResponse.json()
        setPickupRequests(pickupData.data || [])
      }

      // Fetch leaderboard
      const leaderboardResponse = await fetch('/api/bank-sampah/leaderboard')
      if (leaderboardResponse.ok) {
        const leaderboardData = await leaderboardResponse.json()
        setLeaderboard(leaderboardData.data || [])
      }
    } catch (error) {
      console.error('Error fetching Bank Sampah data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Show loading or redirect if not authenticated
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-loading mx-auto mb-4"></div>
          <p className="text-neutral-600">Memuat...</p>
        </div>
      </div>
    )
  }

  const getWasteTypeColor = (type: string) => {
    switch (type) {
      case 'organic': return 'text-green-600 bg-green-100'
      case 'plastic': return 'text-blue-600 bg-blue-100'
      case 'paper': return 'text-yellow-600 bg-yellow-100'
      case 'metal': return 'text-gray-600 bg-gray-100'
      case 'glass': return 'text-teal-600 bg-teal-100'
      case 'electronic': return 'text-purple-600 bg-purple-100'
      default: return 'text-neutral-600 bg-neutral-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success-600 bg-success-100'
      case 'processed': return 'text-primary-600 bg-primary-100'
      case 'collected': return 'text-warning-600 bg-warning-100'
      case 'scheduled': return 'text-secondary-600 bg-secondary-100'
      default: return 'text-neutral-600 bg-neutral-100'
    }
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
            Bank Sampah Koperasi
          </h1>
          <p className="text-neutral-600">
            Kelola sampah Anda, dapatkan poin, dan berkontribusi untuk lingkungan
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg border border-neutral-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-shrink-0 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-primary-600 text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('contributions')}
            className={`flex-shrink-0 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'contributions'
                ? 'bg-primary-600 text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Kontribusi
          </button>
          <button
            onClick={() => setActiveTab('pickup')}
            className={`flex-shrink-0 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'pickup'
                ? 'bg-primary-600 text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Penjemputan
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-shrink-0 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'leaderboard'
                ? 'bg-primary-600 text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Leaderboard
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Points & Impact Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5 text-primary-600" />
                  </div>
                  <span className="text-xs text-neutral-500">Total Poin</span>
                </div>
                <p className="text-2xl font-bold text-primary-600">
                  {pointsSummary?.total_points?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-neutral-600 mt-1">
                  {pointsSummary?.this_month_points || 0} poin bulan ini
                </p>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                    <Recycle className="h-5 w-5 text-success-600" />
                  </div>
                  <span className="text-xs text-neutral-500">Total Sampah</span>
                </div>
                <p className="text-2xl font-bold text-success-600">
                  {pointsSummary?.total_waste_kg || 0} kg
                </p>
                <p className="text-sm text-neutral-600 mt-1">
                  Sampah didaur ulang
                </p>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Leaf className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-xs text-neutral-500">CO2 Tersimpan</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {pointsSummary?.environmental_impact?.co2_saved_kg || 0} kg
                </p>
                <p className="text-sm text-neutral-600 mt-1">
                  Emisi karbon dicegah
                </p>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-xs text-neutral-500">Pohon Diselamatkan</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {pointsSummary?.environmental_impact?.trees_saved || 0}
                </p>
                <p className="text-sm text-neutral-600 mt-1">
                  Setara pohon
                </p>
              </div>
            </div>

            {/* Environmental Impact Details */}
            <div className="card">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Dampak Lingkungan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Leaf className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {pointsSummary?.environmental_impact?.co2_saved_kg || 0} kg
                  </p>
                  <p className="text-sm text-neutral-600">CO2 Tersimpan</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Setara dengan mengemudi {Math.round((pointsSummary?.environmental_impact?.co2_saved_kg || 0) * 4.6)} km
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {pointsSummary?.environmental_impact?.trees_saved || 0}
                  </p>
                  <p className="text-sm text-neutral-600">Pohon Diselamatkan</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Dari penggunaan kertas daur ulang
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Package className="h-8 w-8 text-teal-600" />
                  </div>
                  <p className="text-2xl font-bold text-teal-600">
                    {pointsSummary?.environmental_impact?.water_saved_liters || 0} L
                  </p>
                  <p className="text-sm text-neutral-600">Air Dihemat</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Dari proses daur ulang
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Aksi Cepat</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab('pickup')}
                    className="w-full flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <Truck className="h-5 w-5 text-primary-600 mr-3" />
                      <span className="font-medium text-primary-900">Jadwalkan Penjemputan</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-primary-600" />
                  </button>

                  <button className="w-full flex items-center justify-between p-3 bg-success-50 border border-success-200 rounded-lg hover:bg-success-100 transition-colors">
                    <div className="flex items-center">
                      <Award className="h-5 w-5 text-success-600 mr-3" />
                      <span className="font-medium text-success-900">Tukar Poin</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-success-600" />
                  </button>

                  <button
                    onClick={() => setActiveTab('leaderboard')}
                    className="w-full flex items-center justify-between p-3 bg-warning-50 border border-warning-200 rounded-lg hover:bg-warning-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-warning-600 mr-3" />
                      <span className="font-medium text-warning-900">Lihat Ranking</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-warning-600" />
                  </button>
                </div>
              </div>

              {/* Recent Contributions */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Kontribusi Terbaru</h3>
                  <button
                    onClick={() => setActiveTab('contributions')}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                  >
                    Lihat Semua
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-12 bg-neutral-100 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : contributions.length > 0 ? (
                  <div className="space-y-3">
                    {contributions.slice(0, 5).map((contribution) => (
                      <div
                        key={contribution.id}
                        className="flex items-center justify-between p-2 border border-neutral-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Recycle className="h-4 w-4 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900 text-sm">
                              {contribution.weight_kg} kg {contribution.waste_type}
                            </p>
                            <p className="text-xs text-neutral-600">
                              {formatRelativeTime(contribution.pickup_date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary-600 text-sm">
                            +{contribution.points_earned} poin
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contribution.status)}`}>
                            {contribution.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-neutral-600">
                    <Recycle className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
                    <p className="text-sm">Belum ada kontribusi</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contributions Tab */}
        {activeTab === 'contributions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">Riwayat Kontribusi</h2>
              <div className="flex items-center space-x-2">
                <select className="px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                  <option value="">Semua Jenis</option>
                  <option value="organic">Organik</option>
                  <option value="plastic">Plastik</option>
                  <option value="paper">Kertas</option>
                  <option value="metal">Logam</option>
                  <option value="glass">Kaca</option>
                  <option value="electronic">Elektronik</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-white rounded-lg border border-neutral-200"></div>
                  </div>
                ))}
              </div>
            ) : contributions.length > 0 ? (
              <div className="space-y-4">
                {contributions.map((contribution) => (
                  <div key={contribution.id} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Recycle className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-900">
                            {contribution.weight_kg} kg Sampah {contribution.waste_type}
                          </h3>
                          <p className="text-sm text-neutral-600">{contribution.description}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-neutral-500">
                              Dijemput: {formatDate(contribution.pickup_date)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWasteTypeColor(contribution.waste_type)}`}>
                              {contribution.waste_type}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center space-x-6">
                          <div>
                            <p className="text-sm text-neutral-600">Poin Didapat</p>
                            <p className="font-semibold text-primary-600 text-lg">
                              +{contribution.points_earned}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-600">Status</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contribution.status)}`}>
                              {contribution.status === 'completed' ? 'Selesai' :
                               contribution.status === 'processed' ? 'Diproses' :
                               contribution.status === 'collected' ? 'Terkumpul' : 'Terjadwal'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Recycle className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">Belum ada kontribusi</h3>
                <p className="text-neutral-600 mb-4">
                  Mulai berkontribusi dengan menjadwalkan penjemputan sampah
                </p>
                <button
                  onClick={() => setActiveTab('pickup')}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
                >
                  Jadwalkan Penjemputan
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pickup Tab */}
        {activeTab === 'pickup' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">Penjemputan Sampah</h2>
              <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Jadwalkan Baru
              </button>
            </div>

            {/* Pickup Requests */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-white rounded-lg border border-neutral-200"></div>
                  </div>
                ))}
              </div>
            ) : pickupRequests.length > 0 ? (
              <div className="space-y-4">
                {pickupRequests.map((request) => (
                  <div key={request.id} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                          <Truck className="h-6 w-6 text-secondary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-900">
                            Penjemputan {formatDate(request.requested_date)}
                          </h3>
                          <p className="text-sm text-neutral-600">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {request.address}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-neutral-500">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {request.preferred_time}
                            </span>
                            <span className="text-xs text-neutral-500">
                              Est. {request.estimated_weight} kg
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          request.status === 'completed' ? 'bg-success-100 text-success-700' :
                          request.status === 'in_progress' ? 'bg-warning-100 text-warning-700' :
                          request.status === 'scheduled' ? 'bg-primary-100 text-primary-700' :
                          request.status === 'cancelled' ? 'bg-error-100 text-error-700' :
                          'bg-neutral-100 text-neutral-700'
                        }`}>
                          {request.status === 'completed' ? 'Selesai' :
                           request.status === 'in_progress' ? 'Berlangsung' :
                           request.status === 'scheduled' ? 'Terjadwal' :
                           request.status === 'cancelled' ? 'Dibatalkan' : 'Pending'}
                        </span>
                        {request.pickup_fee && (
                          <p className="text-sm text-neutral-600 mt-1">
                            Biaya: {formatCurrency(request.pickup_fee)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Truck className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">Belum ada penjemputan</h3>
                <p className="text-neutral-600 mb-4">
                  Jadwalkan penjemputan sampah untuk mulai berkontribusi
                </p>
                <button className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700">
                  Jadwalkan Penjemputan
                </button>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">Papan Peringkat</h2>
              <div className="flex items-center space-x-2">
                <select className="px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                  <option value="monthly">Bulan Ini</option>
                  <option value="yearly">Tahun Ini</option>
                  <option value="all">Sepanjang Masa</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-white rounded-lg border border-neutral-200"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card">
                {leaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          entry.is_current_user ? 'bg-primary-50 border border-primary-200' : 'hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            entry.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                            entry.rank === 2 ? 'bg-gray-100 text-gray-700' :
                            entry.rank === 3 ? 'bg-orange-100 text-orange-700' :
                            'bg-neutral-100 text-neutral-700'
                          }`}>
                            {entry.rank === 1 ? '🥇' :
                             entry.rank === 2 ? '🥈' :
                             entry.rank === 3 ? '🥉' : entry.rank}
                          </div>
                          <div>
                            <p className={`font-medium ${entry.is_current_user ? 'text-primary-900' : 'text-neutral-900'}`}>
                              {entry.member_name}
                              {entry.is_current_user && <span className="ml-2 text-primary-600">(Anda)</span>}
                            </p>
                            <p className="text-sm text-neutral-600">{entry.waste_kg} kg sampah</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary-600">{entry.points.toLocaleString()} poin</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
                    <p className="text-neutral-600">Belum ada data peringkat</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}