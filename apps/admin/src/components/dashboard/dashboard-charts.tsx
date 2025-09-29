'use client'

import { useState } from 'react'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface DashboardChartsProps {
  data: {
    totalMembers: number
    totalSavings: number
    totalLoans: number
    monthlyGrowth: {
      members: number
      savings: number
      loans: number
    }
  }
}

export function DashboardCharts({ data }: DashboardChartsProps) {
  const [activeChart, setActiveChart] = useState<'growth' | 'distribution' | 'trends'>('growth')

  // Sample data for charts (in real app, this would come from props or API)
  const monthlyGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
    datasets: [
      {
        label: 'Anggota',
        data: [120, 135, 145, 160, 175, 185, 195, 210, 225, 240, 255, data.totalMembers],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Simpanan (Juta)',
        data: [450, 480, 520, 580, 620, 680, 720, 780, 820, 860, 900, data.totalSavings / 1000000],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const savingsDistribution = {
    labels: ['Simpanan Pokok', 'Simpanan Wajib', 'Simpanan Sukarela', 'Simpanan Berjangka'],
    datasets: [
      {
        data: [25, 35, 30, 10],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(139, 92, 246)',
        ],
        borderWidth: 2,
      },
    ],
  }

  const monthlyTransactions = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
    datasets: [
      {
        label: 'Setoran',
        data: [85, 92, 88, 95, 102, 98, 105, 112, 108, 115, 120, 118],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      },
      {
        label: 'Penarikan',
        data: [45, 52, 48, 55, 62, 58, 65, 72, 68, 75, 80, 78],
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(107, 114, 128, 1)',
        },
      },
      y: {
        grid: {
          color: 'rgba(229, 231, 235, 1)',
        },
        ticks: {
          color: 'rgba(107, 114, 128, 1)',
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || ''
            const value = context.parsed || 0
            return `${label}: ${value}%`
          },
        },
      },
    },
  }

  const chartTabs = [
    { id: 'growth', label: 'Pertumbuhan', icon: '📈' },
    { id: 'distribution', label: 'Distribusi', icon: '🥧' },
    { id: 'trends', label: 'Transaksi', icon: '📊' },
  ]

  return (
    <div className="admin-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">Analitik</h3>
        <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1">
          {chartTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveChart(tab.id as any)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeChart === tab.id
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-80">
        {activeChart === 'growth' && (
          <div>
            <h4 className="text-sm font-medium text-neutral-700 mb-4">
              Pertumbuhan Bulanan Anggota & Simpanan
            </h4>
            <Line data={monthlyGrowthData} options={chartOptions} />
          </div>
        )}

        {activeChart === 'distribution' && (
          <div>
            <h4 className="text-sm font-medium text-neutral-700 mb-4">
              Distribusi Jenis Simpanan (%)
            </h4>
            <Doughnut data={savingsDistribution} options={doughnutOptions} />
          </div>
        )}

        {activeChart === 'trends' && (
          <div>
            <h4 className="text-sm font-medium text-neutral-700 mb-4">
              Tren Transaksi Bulanan
            </h4>
            <Bar data={monthlyTransactions} options={chartOptions} />
          </div>
        )}
      </div>

      {/* Chart insights */}
      <div className="mt-6 pt-6 border-t border-neutral-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <p className="font-medium text-green-600">+{data.monthlyGrowth.members}</p>
            <p className="text-neutral-600">Anggota baru bulan ini</p>
          </div>
          <div className="text-center">
            <p className="font-medium text-blue-600">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(data.monthlyGrowth.savings)}
            </p>
            <p className="text-neutral-600">Pertumbuhan simpanan</p>
          </div>
          <div className="text-center">
            <p className="font-medium text-purple-600">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(data.monthlyGrowth.loans)}
            </p>
            <p className="text-neutral-600">Pinjaman baru</p>
          </div>
        </div>
      </div>
    </div>
  )
}