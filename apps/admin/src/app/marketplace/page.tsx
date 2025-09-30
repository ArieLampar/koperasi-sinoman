'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { useMarketplaceStats } from '@/hooks/use-marketplace-data'
import {
  ShoppingBagIcon,
  CubeIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'

// =============================================================================
// MARKETPLACE DASHBOARD PAGE
// =============================================================================

export default function MarketplacePage() {
  const { hasPermission } = useAuth()
  const { stats, loading, error } = useMarketplaceStats()
  const [selectedPeriod, setSelectedPeriod] = useState('30')

  // Quick stats cards data
  const quickStats = [
    {
      name: 'Total Produk',
      value: stats?.totalProducts || 0,
      icon: CubeIcon,
      href: '/marketplace/products',
      permission: 'marketplace.products.view',
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      name: 'Penjual Aktif',
      value: stats?.activeSellers || 0,
      icon: BuildingStorefrontIcon,
      href: '/marketplace/sellers',
      permission: 'marketplace.sellers.view',
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      name: 'Pesanan Pending',
      value: stats?.pendingOrders || 0,
      icon: TruckIcon,
      href: '/marketplace/orders',
      permission: 'marketplace.orders.view',
      color: 'bg-yellow-500',
      change: '+3%'
    },
    {
      name: 'Total Penjualan',
      value: `Rp ${(stats?.totalSales || 0).toLocaleString('id-ID')}`,
      icon: CurrencyDollarIcon,
      href: '/marketplace/orders',
      permission: 'marketplace.orders.view',
      color: 'bg-purple-500',
      change: '+15%'
    }
  ]

  // Sample data for charts
  const salesData = [
    { date: '1 Des', sales: 12000000, orders: 45 },
    { date: '2 Des', sales: 15000000, orders: 52 },
    { date: '3 Des', sales: 18000000, orders: 61 },
    { date: '4 Des', sales: 14000000, orders: 48 },
    { date: '5 Des', sales: 22000000, orders: 73 },
    { date: '6 Des', sales: 25000000, orders: 85 },
    { date: '7 Des', sales: 28000000, orders: 92 }
  ]

  const categoryData = [
    { name: 'Makanan & Minuman', value: 40, color: '#3B82F6' },
    { name: 'Kesehatan', value: 25, color: '#10B981' },
    { name: 'Rumah Tangga', value: 20, color: '#F59E0B' },
    { name: 'Fashion', value: 15, color: '#EF4444' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">
                  Dashboard Marketplace
                </h1>
                <p className="mt-1 text-sm text-neutral-600">
                  Overview dan statistik marketplace koperasi
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="7">7 Hari Terakhir</option>
                  <option value="30">30 Hari Terakhir</option>
                  <option value="90">90 Hari Terakhir</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat) => {
            if (stat.permission && !hasPermission(stat.permission)) {
              return null
            }

            const Icon = stat.icon
            return (
              <Link
                key={stat.name}
                href={stat.href}
                className="block group"
              >
                <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-neutral-600">{stat.name}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                        <span className="text-xs text-green-600 font-medium">{stat.change}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales Trend */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">Tren Penjualan</h3>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-neutral-600">Penjualan</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-neutral-600">Pesanan</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'sales' ? `Rp ${value.toLocaleString('id-ID')}` : value,
                    name === 'sales' ? 'Penjualan' : 'Pesanan'
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 4 }}
                  yAxisId="right"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900 mb-6">Distribusi Kategori</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Persentase']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Aksi Cepat</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hasPermission('marketplace.products.view') && (
              <Link
                href="/marketplace/products"
                className="flex items-center p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <CubeIcon className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <h4 className="font-medium text-neutral-900">Kelola Produk</h4>
                  <p className="text-sm text-neutral-600">Tambah, edit, atau hapus produk</p>
                </div>
              </Link>
            )}

            {hasPermission('marketplace.orders.view') && (
              <Link
                href="/marketplace/orders"
                className="flex items-center p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <TruckIcon className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <h4 className="font-medium text-neutral-900">Kelola Pesanan</h4>
                  <p className="text-sm text-neutral-600">Monitor dan proses pesanan</p>
                </div>
              </Link>
            )}

            {hasPermission('marketplace.sellers.view') && (
              <Link
                href="/marketplace/sellers"
                className="flex items-center p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <BuildingStorefrontIcon className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <h4 className="font-medium text-neutral-900">Kelola Penjual</h4>
                  <p className="text-sm text-neutral-600">Verifikasi dan monitor penjual</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}