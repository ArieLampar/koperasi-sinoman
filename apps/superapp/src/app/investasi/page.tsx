'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  User,
  ChevronRight,
  Target,
  Award,
  Clock,
  Briefcase
} from 'lucide-react'

// Hooks and utilities
import { useAuth } from '@/components/providers/auth-provider'
import { formatCurrency } from '@/lib/utils/currency'
import { formatRelativeTime, formatDate } from '@/lib/utils/date'

// Types
interface InvestmentOpportunity {
  id: string
  name: string
  type: 'bank_sampah' | 'toko_koperasi' | 'mikro_kredit' | 'property'
  minimum_investment: number
  expected_return: number
  duration_months: number
  risk_level: 'low' | 'medium' | 'high'
  status: 'available' | 'full' | 'closed'
  total_target: number
  current_funding: number
  description: string
  launch_date: string
}

interface MemberInvestment {
  id: string
  opportunity_id: string
  opportunity_name: string
  opportunity_type: string
  amount: number
  investment_date: string
  status: 'active' | 'completed' | 'pending'
  expected_return: number
  current_return: number
  duration_months: number
  maturity_date: string
}

interface InvestmentSummary {
  total_invested: number
  total_returns: number
  active_investments: number
  completed_investments: number
  pending_returns: number
  portfolio_performance: number
}

export default function InvestmentPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // State
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([])
  const [investments, setInvestments] = useState<MemberInvestment[]>([])
  const [summary, setSummary] = useState<InvestmentSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'opportunities' | 'portfolio'>('overview')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // Fetch data
  useEffect(() => {
    if (user) {
      fetchInvestmentData()
    }
  }, [user])

  const fetchInvestmentData = async () => {
    try {
      setLoading(true)

      // Fetch investment summary
      const summaryResponse = await fetch('/api/investments/summary')
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        setSummary(summaryData.data)
      }

      // Fetch investment opportunities
      const opportunitiesResponse = await fetch('/api/investments/opportunities')
      if (opportunitiesResponse.ok) {
        const opportunitiesData = await opportunitiesResponse.json()
        setOpportunities(opportunitiesData.data || [])
      }

      // Fetch member investments
      const investmentsResponse = await fetch('/api/investments/portfolio')
      if (investmentsResponse.ok) {
        const investmentsData = await investmentsResponse.json()
        setInvestments(investmentsData.data || [])
      }
    } catch (error) {
      console.error('Error fetching investment data:', error)
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

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-success-600 bg-success-100'
      case 'medium': return 'text-warning-600 bg-warning-100'
      case 'high': return 'text-error-600 bg-error-100'
      default: return 'text-neutral-600 bg-neutral-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-success-600 bg-success-100'
      case 'full': return 'text-warning-600 bg-warning-100'
      case 'closed': return 'text-error-600 bg-error-100'
      default: return 'text-neutral-600 bg-neutral-100'
    }
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
            Investasi Koperasi
          </h1>
          <p className="text-neutral-600">
            Kembangkan dana Anda melalui berbagai unit usaha koperasi
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg border border-neutral-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-primary-600 text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'opportunities'
                ? 'bg-primary-600 text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Peluang Investasi
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'portfolio'
                ? 'bg-primary-600 text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Portfolio
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Investment Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary-600" />
                  </div>
                  <span className="text-xs text-neutral-500">Total Investasi</span>
                </div>
                <p className="text-2xl font-bold text-neutral-900">
                  {summary ? formatCurrency(summary.total_invested) : '-'}
                </p>
                <p className="text-sm text-neutral-600 mt-1">
                  {summary?.active_investments || 0} investasi aktif
                </p>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-success-600" />
                  </div>
                  <span className="text-xs text-neutral-500">Total Return</span>
                </div>
                <p className="text-2xl font-bold text-success-600">
                  {summary ? formatCurrency(summary.total_returns) : '-'}
                </p>
                <p className="text-sm text-neutral-600 mt-1">
                  +{summary?.portfolio_performance || 0}% portfolio
                </p>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-warning-600" />
                  </div>
                  <span className="text-xs text-neutral-500">Pending Return</span>
                </div>
                <p className="text-2xl font-bold text-warning-600">
                  {summary ? formatCurrency(summary.pending_returns) : '-'}
                </p>
                <p className="text-sm text-neutral-600 mt-1">
                  Menunggu pencairan
                </p>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5 text-secondary-600" />
                  </div>
                  <span className="text-xs text-neutral-500">Investasi Selesai</span>
                </div>
                <p className="text-2xl font-bold text-neutral-900">
                  {summary?.completed_investments || 0}
                </p>
                <p className="text-sm text-neutral-600 mt-1">
                  Investasi sukses
                </p>
              </div>
            </div>

            {/* Performance Chart Placeholder */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">Performa Portfolio</h3>
                <div className="flex items-center space-x-2">
                  <button className="text-sm text-neutral-600 hover:text-neutral-900">1M</button>
                  <button className="text-sm text-neutral-600 hover:text-neutral-900">3M</button>
                  <button className="text-sm bg-primary-600 text-white px-2 py-1 rounded">6M</button>
                  <button className="text-sm text-neutral-600 hover:text-neutral-900">1Y</button>
                </div>
              </div>
              <div className="h-64 bg-neutral-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
                  <p className="text-neutral-500">Grafik performa portfolio</p>
                  <p className="text-sm text-neutral-400">Akan diimplementasikan dengan chart library</p>
                </div>
              </div>
            </div>

            {/* Recent Investments */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">Investasi Terbaru</h3>
                <Link
                  href="#"
                  onClick={() => setActiveTab('portfolio')}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                >
                  Lihat Portfolio
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-neutral-100 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : investments.length > 0 ? (
                <div className="space-y-3">
                  {investments.slice(0, 5).map((investment) => (
                    <div
                      key={investment.id}
                      className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Briefcase className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{investment.opportunity_name}</p>
                          <p className="text-sm text-neutral-600">
                            {formatDate(investment.investment_date)} • {investment.opportunity_type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-neutral-900">
                          {formatCurrency(investment.amount)}
                        </p>
                        <p className={`text-sm ${
                          investment.current_return > 0 ? 'text-success-600' : 'text-neutral-600'
                        }`}>
                          Return: {formatCurrency(investment.current_return)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-600">
                  <Briefcase className="h-12 w-12 mx-auto mb-3 text-neutral-400" />
                  <p>Belum ada investasi</p>
                  <button
                    onClick={() => setActiveTab('opportunities')}
                    className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Lihat Peluang Investasi
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Opportunities Tab */}
        {activeTab === 'opportunities' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">Peluang Investasi</h2>
              <div className="flex items-center space-x-2">
                <select className="px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                  <option value="">Semua Kategori</option>
                  <option value="bank_sampah">Bank Sampah</option>
                  <option value="toko_koperasi">Toko Koperasi</option>
                  <option value="mikro_kredit">Mikro Kredit</option>
                  <option value="property">Property</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-64 bg-white rounded-lg border border-neutral-200"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opportunities.map((opportunity) => (
                  <div key={opportunity.id} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(opportunity.risk_level)}`}>
                        {opportunity.risk_level === 'low' ? 'Risiko Rendah' :
                         opportunity.risk_level === 'medium' ? 'Risiko Sedang' : 'Risiko Tinggi'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(opportunity.status)}`}>
                        {opportunity.status === 'available' ? 'Tersedia' :
                         opportunity.status === 'full' ? 'Penuh' : 'Tutup'}
                      </span>
                    </div>

                    <h3 className="font-semibold text-neutral-900 mb-2">{opportunity.name}</h3>
                    <p className="text-sm text-neutral-600 mb-4">{opportunity.description}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Min. Investasi:</span>
                        <span className="font-medium">{formatCurrency(opportunity.minimum_investment)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Expected Return:</span>
                        <span className="font-medium text-success-600">{opportunity.expected_return}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Durasi:</span>
                        <span className="font-medium">{opportunity.duration_months} bulan</span>
                      </div>
                    </div>

                    {/* Funding Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-neutral-600">Progress:</span>
                        <span className="font-medium">
                          {Math.round((opportunity.current_funding / opportunity.total_target) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${Math.min((opportunity.current_funding / opportunity.total_target) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-neutral-500 mt-1">
                        <span>{formatCurrency(opportunity.current_funding)}</span>
                        <span>{formatCurrency(opportunity.total_target)}</span>
                      </div>
                    </div>

                    <button
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        opportunity.status === 'available'
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                      }`}
                      disabled={opportunity.status !== 'available'}
                    >
                      {opportunity.status === 'available' ? 'Investasi Sekarang' :
                       opportunity.status === 'full' ? 'Sudah Penuh' : 'Tidak Tersedia'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">Portfolio Investasi</h2>
              <div className="flex items-center space-x-2">
                <select className="px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                  <option value="">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="completed">Selesai</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-white rounded-lg border border-neutral-200"></div>
                  </div>
                ))}
              </div>
            ) : investments.length > 0 ? (
              <div className="space-y-4">
                {investments.map((investment) => (
                  <div key={investment.id} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Briefcase className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-900">{investment.opportunity_name}</h3>
                          <p className="text-sm text-neutral-600">{investment.opportunity_type}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-neutral-500">
                              Investasi: {formatDate(investment.investment_date)}
                            </span>
                            <span className="text-xs text-neutral-500">
                              Jatuh tempo: {formatDate(investment.maturity_date)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center space-x-6">
                          <div>
                            <p className="text-sm text-neutral-600">Investasi</p>
                            <p className="font-semibold text-neutral-900">
                              {formatCurrency(investment.amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-600">Return Saat Ini</p>
                            <p className={`font-semibold ${
                              investment.current_return > 0 ? 'text-success-600' : 'text-neutral-600'
                            }`}>
                              {formatCurrency(investment.current_return)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-600">Status</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              investment.status === 'active' ? 'bg-success-100 text-success-700' :
                              investment.status === 'completed' ? 'bg-primary-100 text-primary-700' :
                              'bg-warning-100 text-warning-700'
                            }`}>
                              {investment.status === 'active' ? 'Aktif' :
                               investment.status === 'completed' ? 'Selesai' : 'Pending'}
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
                <PieChart className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">Belum ada investasi</h3>
                <p className="text-neutral-600 mb-4">
                  Mulai investasi untuk mengembangkan dana Anda
                </p>
                <button
                  onClick={() => setActiveTab('opportunities')}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
                >
                  Lihat Peluang Investasi
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}