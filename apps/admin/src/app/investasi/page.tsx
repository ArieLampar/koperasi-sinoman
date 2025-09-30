'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/hooks/useAuth'
import { useAudit } from '@/hooks/useAudit'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Download, Eye, Edit, TrendingUp, DollarSign, Users, Target, Calendar, FileText, Plus, Search, Filter } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface InvestmentOpportunity {
  id: string
  title: string
  description: string
  category: string
  target_amount: number
  current_amount: number
  investor_count: number
  roi_percentage: number
  duration_months: number
  status: 'draft' | 'active' | 'fully_funded' | 'completed' | 'cancelled'
  risk_level: 'low' | 'medium' | 'high'
  created_at: string
  start_date: string
  end_date: string
  unit_business?: {
    name: string
    location: string
  }
}

interface Investment {
  id: string
  investment_opportunity_id: string
  investor_id: string
  amount: number
  shares: number
  status: string
  created_at: string
  investor: {
    full_name: string
    email: string
  }
  opportunity: {
    title: string
    roi_percentage: number
  }
}

interface ROICalculation {
  id: string
  investment_opportunity_id: string
  period: string
  revenue: number
  profit: number
  roi_actual: number
  roi_projected: number
  created_at: string
  opportunity: {
    title: string
  }
}

export default function InvestmentDashboard() {
  const { user, profile } = useAuth()
  const { logActivity } = useAudit()
  const supabase = createClientComponentClient()

  const [activeTab, setActiveTab] = useState('overview')
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [roiCalculations, setRoiCalculations] = useState<ROICalculation[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const canManageInvestments = profile?.role === 'admin' || profile?.permissions?.includes('manage_investments')
  const canViewInvestments = profile?.role === 'admin' || profile?.permissions?.includes('view_investments')

  useEffect(() => {
    if (user && canViewInvestments) {
      fetchData()
    }
  }, [user, canViewInvestments, dateRange])

  const fetchData = async () => {
    try {
      setLoading(true)

      const endDate = new Date()
      const startDate = new Date()

      switch (dateRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(endDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(endDate.getDate() - 90)
          break
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
      }

      // Fetch investment opportunities
      const { data: opportunitiesData, error: opportunitiesError } = await supabase
        .from('investment_opportunities')
        .select(`
          *,
          unit_business:unit_businesses(name, location)
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (opportunitiesError) throw opportunitiesError
      setOpportunities(opportunitiesData || [])

      // Fetch investments
      const { data: investmentsData, error: investmentsError } = await supabase
        .from('investments')
        .select(`
          *,
          investor:cooperative_members!investor_id(full_name, email),
          opportunity:investment_opportunities!investment_opportunity_id(title, roi_percentage)
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (investmentsError) throw investmentsError
      setInvestments(investmentsData || [])

      // Fetch ROI calculations
      const { data: roiData, error: roiError } = await supabase
        .from('roi_calculations')
        .select(`
          *,
          opportunity:investment_opportunities!investment_opportunity_id(title)
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (roiError) throw roiError
      setRoiCalculations(roiData || [])

    } catch (error) {
      console.error('Error fetching investment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOpportunityStatus = async (opportunityId: string, newStatus: string) => {
    if (!canManageInvestments) return

    try {
      const { error } = await supabase
        .from('investment_opportunities')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', opportunityId)

      if (error) throw error

      setOpportunities(prev =>
        prev.map(opp =>
          opp.id === opportunityId
            ? { ...opp, status: newStatus as any }
            : opp
        )
      )

      await logActivity(
        'investment_opportunity_status_updated',
        'investment_opportunities',
        opportunityId,
        { new_status: newStatus }
      )

    } catch (error) {
      console.error('Error updating opportunity status:', error)
    }
  }

  const calculateMetrics = () => {
    const totalOpportunities = opportunities.length
    const activeOpportunities = opportunities.filter(opp => opp.status === 'active').length
    const totalInvestmentValue = opportunities.reduce((sum, opp) => sum + opp.current_amount, 0)
    const totalTargetValue = opportunities.reduce((sum, opp) => sum + opp.target_amount, 0)
    const totalInvestors = new Set(investments.map(inv => inv.investor_id)).size
    const averageROI = opportunities.length > 0
      ? opportunities.reduce((sum, opp) => sum + opp.roi_percentage, 0) / opportunities.length
      : 0

    return {
      totalOpportunities,
      activeOpportunities,
      totalInvestmentValue,
      totalTargetValue,
      fundingProgress: totalTargetValue > 0 ? (totalInvestmentValue / totalTargetValue) * 100 : 0,
      totalInvestors,
      averageROI
    }
  }

  const getOpportunityStatusData = () => {
    const statusCounts = opportunities.reduce((acc, opp) => {
      acc[opp.status] = (acc[opp.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      labels: Object.keys(statusCounts).map(status =>
        status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
      ),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: [
          '#3B82F6', // blue
          '#10B981', // green
          '#F59E0B', // yellow
          '#EF4444', // red
          '#6B7280'  // gray
        ]
      }]
    }
  }

  const getInvestmentTrendData = () => {
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      return date.toISOString().slice(0, 7)
    })

    const monthlyData = last12Months.map(month => {
      const monthInvestments = investments.filter(inv =>
        inv.created_at.startsWith(month)
      )
      return monthInvestments.reduce((sum, inv) => sum + inv.amount, 0)
    })

    return {
      labels: last12Months.map(month => {
        const date = new Date(month + '-01')
        return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
      }),
      datasets: [{
        label: 'Total Investasi',
        data: monthlyData,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }]
    }
  }

  const getROIPerformanceData = () => {
    const opportunities_with_roi = opportunities.filter(opp =>
      roiCalculations.some(roi => roi.investment_opportunity_id === opp.id)
    )

    return {
      labels: opportunities_with_roi.map(opp => opp.title.slice(0, 20) + '...'),
      datasets: [
        {
          label: 'ROI Proyeksi (%)',
          data: opportunities_with_roi.map(opp => opp.roi_percentage),
          backgroundColor: 'rgba(59, 130, 246, 0.8)'
        },
        {
          label: 'ROI Aktual (%)',
          data: opportunities_with_roi.map(opp => {
            const latestROI = roiCalculations
              .filter(roi => roi.investment_opportunity_id === opp.id)
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
            return latestROI?.roi_actual || 0
          }),
          backgroundColor: 'rgba(16, 185, 129, 0.8)'
        }
      ]
    }
  }

  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesSearch = opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opportunity.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || opportunity.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || opportunity.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const paginatedOpportunities = filteredOpportunities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const exportData = async (type: 'csv' | 'excel' | 'pdf') => {
    if (!canViewInvestments) return

    try {
      await logActivity('investment_data_exported', 'system', '', { export_type: type, date_range: dateRange })

      // Implementation would depend on export library
      console.log(`Exporting investment data as ${type}`)
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  if (!canViewInvestments) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Akses Terbatas</h2>
          <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses dashboard investasi.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const metrics = calculateMetrics()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Investasi</h1>
          <p className="text-gray-600 mt-1">Kelola peluang investasi, pantau kinerja unit bisnis, dan analisis ROI</p>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white"
          >
            <option value="7d">7 Hari Terakhir</option>
            <option value="30d">30 Hari Terakhir</option>
            <option value="90d">90 Hari Terakhir</option>
            <option value="1y">1 Tahun Terakhir</option>
          </select>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => exportData('csv')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </button>
            <button
              onClick={() => exportData('excel')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </button>
            <button
              onClick={() => exportData('pdf')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </button>
          </div>

          {canManageInvestments && (
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Peluang Baru
            </button>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Peluang</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.totalOpportunities}</p>
              <p className="text-sm text-gray-600">{metrics.activeOpportunities} aktif</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Investasi</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(metrics.totalInvestmentValue)}
              </p>
              <p className="text-sm text-gray-600">
                {metrics.fundingProgress.toFixed(1)}% dari target
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Investor</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.totalInvestors}</p>
              <p className="text-sm text-gray-600">investor aktif</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Rata-rata ROI</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.averageROI.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">per tahun</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Ringkasan', icon: TrendingUp },
            { id: 'opportunities', name: 'Peluang Investasi', icon: Target },
            { id: 'investments', name: 'Data Investasi', icon: DollarSign },
            { id: 'roi', name: 'Analisis ROI', icon: FileText },
            { id: 'investors', name: 'Manajemen Investor', icon: Users }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Peluang Investasi</h3>
              <div className="h-64">
                <Doughnut
                  data={getOpportunityStatusData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren Investasi</h3>
              <div className="h-64">
                <Line
                  data={getInvestmentTrendData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0
                            }).format(value as number)
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performa ROI</h3>
            <div className="h-80">
              <Bar
                data={getROIPerformanceData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top'
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return value + '%'
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'opportunities' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari peluang investasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              >
                <option value="all">Semua Status</option>
                <option value="draft">Draft</option>
                <option value="active">Aktif</option>
                <option value="fully_funded">Terdanai Penuh</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              >
                <option value="all">Semua Kategori</option>
                <option value="unit_business">Unit Bisnis</option>
                <option value="property">Properti</option>
                <option value="agriculture">Pertanian</option>
                <option value="technology">Teknologi</option>
              </select>

              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
            </div>
          </div>

          {/* Opportunities List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Peluang Investasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target/Terkumpul
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ROI/Durasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Investor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedOpportunities.map((opportunity) => (
                    <tr key={opportunity.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{opportunity.title}</div>
                          <div className="text-sm text-gray-500">{opportunity.category}</div>
                          {opportunity.unit_business && (
                            <div className="text-xs text-gray-400">{opportunity.unit_business.name}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(opportunity.target_amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(opportunity.current_amount)}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min((opportunity.current_amount / opportunity.target_amount) * 100, 100)}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{opportunity.roi_percentage}% ROI</div>
                          <div className="text-sm text-gray-500">{opportunity.duration_months} bulan</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{opportunity.investor_count} investor</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          opportunity.status === 'active' ? 'bg-green-100 text-green-800' :
                          opportunity.status === 'fully_funded' ? 'bg-blue-100 text-blue-800' :
                          opportunity.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          opportunity.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {opportunity.status === 'active' ? 'Aktif' :
                           opportunity.status === 'fully_funded' ? 'Terdanai Penuh' :
                           opportunity.status === 'completed' ? 'Selesai' :
                           opportunity.status === 'cancelled' ? 'Dibatalkan' :
                           'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          {canManageInvestments && (
                            <>
                              <button className="text-gray-600 hover:text-gray-900">
                                <Edit className="h-4 w-4" />
                              </button>
                              <select
                                value={opportunity.status}
                                onChange={(e) => updateOpportunityStatus(opportunity.id, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="draft">Draft</option>
                                <option value="active">Aktif</option>
                                <option value="fully_funded">Terdanai Penuh</option>
                                <option value="completed">Selesai</option>
                                <option value="cancelled">Dibatalkan</option>
                              </select>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage * itemsPerPage >= filteredOpportunities.length}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredOpportunities.length)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{filteredOpportunities.length}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={currentPage * itemsPerPage >= filteredOpportunities.length}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'investments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Data Investasi</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Investor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Peluang Investasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah Investasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saham
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {investments.slice(0, 20).map((investment) => (
                    <tr key={investment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{investment.investor.full_name}</div>
                          <div className="text-sm text-gray-500">{investment.investor.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{investment.opportunity.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(investment.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{investment.shares} unit</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          investment.status === 'active' ? 'bg-green-100 text-green-800' :
                          investment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {investment.status === 'active' ? 'Aktif' :
                           investment.status === 'completed' ? 'Selesai' :
                           'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(investment.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'roi' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Analisis ROI</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Peluang Investasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Periode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ROI Proyeksi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ROI Aktual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Selisih
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roiCalculations.slice(0, 20).map((roi) => {
                    const difference = roi.roi_actual - roi.roi_projected
                    return (
                      <tr key={roi.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{roi.opportunity.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{roi.period}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(roi.revenue)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(roi.profit)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{roi.roi_projected.toFixed(2)}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{roi.roi_actual.toFixed(2)}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            difference > 0 ? 'text-green-600' :
                            difference < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {difference > 0 ? '+' : ''}{difference.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'investors' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Manajemen Investor</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600">Fitur manajemen investor dalam pengembangan...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}