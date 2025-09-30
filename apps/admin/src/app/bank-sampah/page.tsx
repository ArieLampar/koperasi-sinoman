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
import { Download, Eye, Edit, Leaf, Recycle, TrendingUp, MapPin, Users, Calendar, FileText, Plus, Search, Filter } from 'lucide-react'

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

interface BankSampahUnit {
  id: string
  name: string
  location: string
  address: string
  manager_name: string
  manager_phone: string
  status: 'active' | 'inactive' | 'pending'
  franchise_type: 'owned' | 'partner' | 'franchise'
  total_members: number
  monthly_waste_kg: number
  monthly_revenue: number
  environmental_impact: {
    co2_saved_kg: number
    trees_saved: number
    water_saved_liters: number
  }
  created_at: string
  last_activity: string
}

interface WasteCollection {
  id: string
  bank_sampah_unit_id: string
  member_id: string
  waste_type: string
  weight_kg: number
  points_earned: number
  revenue_generated: number
  collection_date: string
  status: string
  collector_name: string
  unit: {
    name: string
    location: string
  }
  member: {
    full_name: string
    member_number: string
  }
}

interface EnvironmentalReport {
  id: string
  period: string
  total_waste_collected_kg: number
  total_co2_saved_kg: number
  total_trees_saved: number
  total_water_saved_liters: number
  plastic_recycled_kg: number
  organic_waste_kg: number
  revenue_generated: number
  members_participated: number
  units_active: number
  created_at: string
}

interface FranchiseOperation {
  id: string
  unit_id: string
  operation_type: 'training' | 'audit' | 'support' | 'expansion'
  description: string
  scheduled_date: string
  completed_date?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  cost: number
  notes?: string
  unit: {
    name: string
    location: string
  }
}

export default function BankSampahMonitoring() {
  const { user, profile } = useAuth()
  const { logActivity } = useAudit()
  const supabase = createClientComponentClient()

  const [activeTab, setActiveTab] = useState('overview')
  const [units, setUnits] = useState<BankSampahUnit[]>([])
  const [collections, setCollections] = useState<WasteCollection[]>([])
  const [environmentalReports, setEnvironmentalReports] = useState<EnvironmentalReport[]>([])
  const [franchiseOps, setFranchiseOps] = useState<FranchiseOperation[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const canManageBankSampah = profile?.role === 'admin' || profile?.permissions?.includes('manage_bank_sampah')
  const canViewBankSampah = profile?.role === 'admin' || profile?.permissions?.includes('view_bank_sampah')

  useEffect(() => {
    if (user && canViewBankSampah) {
      fetchData()
    }
  }, [user, canViewBankSampah, dateRange])

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

      // Fetch Bank Sampah units
      const { data: unitsData, error: unitsError } = await supabase
        .from('bank_sampah_units')
        .select('*')
        .order('created_at', { ascending: false })

      if (unitsError) throw unitsError
      setUnits(unitsData || [])

      // Fetch waste collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('bank_sampah_collections')
        .select(`
          *,
          unit:bank_sampah_units!bank_sampah_unit_id(name, location),
          member:cooperative_members!member_id(full_name, member_number)
        `)
        .gte('collection_date', startDate.toISOString())
        .order('collection_date', { ascending: false })

      if (collectionsError) throw collectionsError
      setCollections(collectionsData || [])

      // Fetch environmental reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('environmental_reports')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (reportsError) throw reportsError
      setEnvironmentalReports(reportsData || [])

      // Fetch franchise operations
      const { data: franchiseData, error: franchiseError } = await supabase
        .from('franchise_operations')
        .select(`
          *,
          unit:bank_sampah_units!unit_id(name, location)
        `)
        .gte('scheduled_date', startDate.toISOString())
        .order('scheduled_date', { ascending: false })

      if (franchiseError) throw franchiseError
      setFranchiseOps(franchiseData || [])

    } catch (error) {
      console.error('Error fetching Bank Sampah data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUnitStatus = async (unitId: string, newStatus: string) => {
    if (!canManageBankSampah) return

    try {
      const { error } = await supabase
        .from('bank_sampah_units')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', unitId)

      if (error) throw error

      setUnits(prev =>
        prev.map(unit =>
          unit.id === unitId
            ? { ...unit, status: newStatus as any }
            : unit
        )
      )

      await logActivity(
        'bank_sampah_unit_status_updated',
        'bank_sampah_units',
        unitId,
        { new_status: newStatus }
      )

    } catch (error) {
      console.error('Error updating unit status:', error)
    }
  }

  const calculateMetrics = () => {
    const totalUnits = units.length
    const activeUnits = units.filter(unit => unit.status === 'active').length
    const totalMembers = units.reduce((sum, unit) => sum + unit.total_members, 0)
    const totalWasteThisMonth = units.reduce((sum, unit) => sum + unit.monthly_waste_kg, 0)
    const totalRevenueThisMonth = units.reduce((sum, unit) => sum + unit.monthly_revenue, 0)

    const latestReport = environmentalReports[0]
    const environmentalImpact = latestReport ? {
      co2Saved: latestReport.total_co2_saved_kg,
      treesSaved: latestReport.total_trees_saved,
      waterSaved: latestReport.total_water_saved_liters
    } : { co2Saved: 0, treesSaved: 0, waterSaved: 0 }

    return {
      totalUnits,
      activeUnits,
      totalMembers,
      totalWasteThisMonth,
      totalRevenueThisMonth,
      environmentalImpact
    }
  }

  const getUnitStatusData = () => {
    const statusCounts = units.reduce((acc, unit) => {
      acc[unit.status] = (acc[unit.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      labels: Object.keys(statusCounts).map(status =>
        status === 'active' ? 'Aktif' :
        status === 'inactive' ? 'Tidak Aktif' : 'Pending'
      ),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: [
          '#10B981', // green for active
          '#EF4444', // red for inactive
          '#F59E0B'  // yellow for pending
        ]
      }]
    }
  }

  const getWasteCollectionTrendData = () => {
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      return date.toISOString().slice(0, 7)
    })

    const monthlyData = last12Months.map(month => {
      const monthCollections = collections.filter(collection =>
        collection.collection_date.startsWith(month)
      )
      return monthCollections.reduce((sum, collection) => sum + collection.weight_kg, 0)
    })

    return {
      labels: last12Months.map(month => {
        const date = new Date(month + '-01')
        return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
      }),
      datasets: [{
        label: 'Sampah Terkumpul (kg)',
        data: monthlyData,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      }]
    }
  }

  const getWasteTypeDistributionData = () => {
    const wasteTypes = collections.reduce((acc, collection) => {
      acc[collection.waste_type] = (acc[collection.waste_type] || 0) + collection.weight_kg
      return acc
    }, {} as Record<string, number>)

    return {
      labels: Object.keys(wasteTypes),
      datasets: [{
        label: 'Berat (kg)',
        data: Object.values(wasteTypes),
        backgroundColor: [
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
        ]
      }]
    }
  }

  const getUnitPerformanceData = () => {
    const unitData = units.slice(0, 10) // Top 10 units

    return {
      labels: unitData.map(unit => unit.name),
      datasets: [
        {
          label: 'Sampah Bulanan (kg)',
          data: unitData.map(unit => unit.monthly_waste_kg),
          backgroundColor: 'rgba(16, 185, 129, 0.8)'
        },
        {
          label: 'Revenue Bulanan (Rp)',
          data: unitData.map(unit => unit.monthly_revenue / 1000), // Convert to thousands
          backgroundColor: 'rgba(59, 130, 246, 0.8)'
        }
      ]
    }
  }

  const filteredUnits = units.filter(unit => {
    const matchesSearch = unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         unit.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         unit.manager_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || unit.status === statusFilter
    const matchesLocation = locationFilter === 'all' || unit.location === locationFilter
    return matchesSearch && matchesStatus && matchesLocation
  })

  const paginatedUnits = filteredUnits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const exportData = async (type: 'csv' | 'excel' | 'pdf') => {
    if (!canViewBankSampah) return

    try {
      await logActivity('bank_sampah_data_exported', 'system', '', { export_type: type, date_range: dateRange })

      // Implementation would depend on export library
      console.log(`Exporting Bank Sampah data as ${type}`)
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  if (!canViewBankSampah) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Akses Terbatas</h2>
          <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses monitoring Bank Sampah.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Monitoring Bank Sampah</h1>
          <p className="text-gray-600 mt-1">Pantau semua unit Bank Sampah, dampak lingkungan, dan operasi franchise</p>
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

          {canManageBankSampah && (
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Unit Baru
            </button>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapPin className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Unit</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.totalUnits}</p>
              <p className="text-sm text-gray-600">{metrics.activeUnits} aktif</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Member</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.totalMembers.toLocaleString()}</p>
              <p className="text-sm text-gray-600">member aktif</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Recycle className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Sampah Bulan Ini</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.totalWasteThisMonth.toLocaleString()} kg</p>
              <p className="text-sm text-gray-600">semua unit</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Leaf className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">CO₂ Diselamatkan</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.environmentalImpact.co2Saved.toLocaleString()} kg</p>
              <p className="text-sm text-gray-600">{metrics.environmentalImpact.treesSaved} pohon setara</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Ringkasan', icon: TrendingUp },
            { id: 'units', name: 'Unit Bank Sampah', icon: MapPin },
            { id: 'collections', name: 'Pengumpulan Sampah', icon: Recycle },
            { id: 'environmental', name: 'Dampak Lingkungan', icon: Leaf },
            { id: 'franchise', name: 'Operasi Franchise', icon: FileText }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Unit Bank Sampah</h3>
              <div className="h-64">
                <Doughnut
                  data={getUnitStatusData()}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren Pengumpulan Sampah</h3>
              <div className="h-64">
                <Line
                  data={getWasteCollectionTrendData()}
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
                            return value + ' kg'
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Jenis Sampah</h3>
              <div className="h-64">
                <Bar
                  data={getWasteTypeDistributionData()}
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
                            return value + ' kg'
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performa Unit (Top 10)</h3>
              <div className="h-64">
                <Bar
                  data={getUnitPerformanceData()}
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
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'units' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari unit Bank Sampah..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
                <option value="pending">Pending</option>
              </select>

              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              >
                <option value="all">Semua Lokasi</option>
                {[...new Set(units.map(unit => unit.location))].map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>

              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
            </div>
          </div>

          {/* Units List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Bank Sampah
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manager
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member/Sampah
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue Bulanan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipe/Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUnits.map((unit) => (
                    <tr key={unit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{unit.name}</div>
                          <div className="text-sm text-gray-500">{unit.location}</div>
                          <div className="text-xs text-gray-400">{unit.address}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{unit.manager_name}</div>
                          <div className="text-sm text-gray-500">{unit.manager_phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{unit.total_members} member</div>
                          <div className="text-sm text-gray-500">{unit.monthly_waste_kg} kg/bulan</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(unit.monthly_revenue)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            unit.status === 'active' ? 'bg-green-100 text-green-800' :
                            unit.status === 'inactive' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {unit.status === 'active' ? 'Aktif' :
                             unit.status === 'inactive' ? 'Tidak Aktif' : 'Pending'}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {unit.franchise_type === 'owned' ? 'Milik Sendiri' :
                             unit.franchise_type === 'partner' ? 'Partner' : 'Franchise'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-green-600 hover:text-green-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          {canManageBankSampah && (
                            <>
                              <button className="text-gray-600 hover:text-gray-900">
                                <Edit className="h-4 w-4" />
                              </button>
                              <select
                                value={unit.status}
                                onChange={(e) => updateUnitStatus(unit.id, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="active">Aktif</option>
                                <option value="inactive">Tidak Aktif</option>
                                <option value="pending">Pending</option>
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
                  disabled={currentPage * itemsPerPage >= filteredUnits.length}
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
                      {Math.min(currentPage * itemsPerPage, filteredUnits.length)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{filteredUnits.length}</span>
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
                      disabled={currentPage * itemsPerPage >= filteredUnits.length}
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

      {activeTab === 'collections' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Data Pengumpulan Sampah</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Bank Sampah
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jenis Sampah
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Berat/Poin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {collections.slice(0, 20).map((collection) => (
                    <tr key={collection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{collection.member.full_name}</div>
                          <div className="text-sm text-gray-500">{collection.member.member_number}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{collection.unit.name}</div>
                          <div className="text-sm text-gray-500">{collection.unit.location}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{collection.waste_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{collection.weight_kg} kg</div>
                          <div className="text-sm text-gray-500">{collection.points_earned} poin</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(collection.revenue_generated)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(collection.collection_date).toLocaleDateString('id-ID')}
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

      {activeTab === 'environmental' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Laporan Dampak Lingkungan</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Periode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sampah Terkumpul
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CO₂ Diselamatkan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pohon Setara
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Air Diselamatkan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {environmentalReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{report.period}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{report.total_waste_collected_kg.toLocaleString()} kg</div>
                          <div className="text-sm text-gray-500">{report.members_participated} member</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{report.total_co2_saved_kg.toLocaleString()} kg</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{report.total_trees_saved.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{report.total_water_saved_liters.toLocaleString()} L</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(report.revenue_generated)}
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

      {activeTab === 'franchise' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Operasi Franchise</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jenis Operasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deskripsi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jadwal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Biaya
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {franchiseOps.map((operation) => (
                    <tr key={operation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{operation.unit.name}</div>
                          <div className="text-sm text-gray-500">{operation.unit.location}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {operation.operation_type === 'training' ? 'Pelatihan' :
                           operation.operation_type === 'audit' ? 'Audit' :
                           operation.operation_type === 'support' ? 'Support' : 'Ekspansi'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{operation.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {new Date(operation.scheduled_date).toLocaleDateString('id-ID')}
                          </div>
                          {operation.completed_date && (
                            <div className="text-sm text-gray-500">
                              Selesai: {new Date(operation.completed_date).toLocaleDateString('id-ID')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(operation.cost)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          operation.status === 'completed' ? 'bg-green-100 text-green-800' :
                          operation.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          operation.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {operation.status === 'completed' ? 'Selesai' :
                           operation.status === 'in_progress' ? 'Berjalan' :
                           operation.status === 'scheduled' ? 'Terjadwal' : 'Dibatalkan'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}