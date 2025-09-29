'use client'

import * as React from 'react'
import { SavingsSummary, SavingsSummarySkeleton } from './savings-summary'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

// Example data
const exampleAccounts = [
  {
    id: 'acc_001',
    type: 'sukarela' as const,
    balance: 15000000,
    interestRate: 4.0,
    monthlyGrowth: 500000,
    accountNumber: 'KS2024001'
  },
  {
    id: 'acc_002',
    type: 'wajib' as const,
    balance: 3600000,
    interestRate: 3.5,
    monthlyGrowth: 300000,
    accountNumber: 'KS2024002'
  },
  {
    id: 'acc_003',
    type: 'berjangka' as const,
    balance: 10000000,
    interestRate: 5.5,
    monthlyGrowth: 0,
    accountNumber: 'KS2024003'
  },
  {
    id: 'acc_004',
    type: 'pokok' as const,
    balance: 500000,
    interestRate: 0,
    monthlyGrowth: 0,
    accountNumber: 'KS2024004'
  }
]

const exampleGrowthData = [
  { month: 'Jan', balance: 25000000, deposits: 2000000, interest: 100000 },
  { month: 'Feb', balance: 26500000, deposits: 1200000, interest: 108000 },
  { month: 'Mar', balance: 27800000, deposits: 1000000, interest: 115000 },
  { month: 'Apr', balance: 28200000, deposits: 300000, interest: 121000 },
  { month: 'Mei', balance: 29100000, deposits: 800000, interest: 123000 },
  { month: 'Jun', balance: 29100000, deposits: 0, interest: 127000 }
]

export const SavingsSummaryExample: React.FC = () => {
  const [loading, setLoading] = React.useState(false)
  const [showBalance, setShowBalance] = React.useState(true)
  const [selectedVariant, setSelectedVariant] = React.useState<'default' | 'compact' | 'dashboard'>('default')

  const totalBalance = exampleAccounts.reduce((sum, acc) => sum + acc.balance, 0)
  const totalGrowth = exampleAccounts.reduce((sum, acc) => sum + acc.monthlyGrowth, 0)
  const totalInterestEarned = 1500000 // Example annual interest
  const monthlyTarget = 1000000
  const lastUpdated = new Date().toISOString()

  const handleToggleBalance = () => {
    setShowBalance(!showBalance)
  }

  const handleQuickDeposit = () => {
    alert('Navigating to deposit page...')
  }

  const handleQuickWithdraw = () => {
    alert('Navigating to withdrawal page...')
  }

  const handleViewHistory = () => {
    alert('Navigating to transaction history...')
  }

  const handleCalculator = () => {
    alert('Opening savings calculator...')
  }

  const handleExportData = () => {
    alert('Exporting savings data...')
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  const simulateLoading = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 3000)
  }

  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Savings Summary Component</h1>
        <p className="text-neutral-600">
          Comprehensive savings overview with interactive charts and quick actions
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Component Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Variant</label>
              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedVariant('default')}
                  variant={selectedVariant === 'default' ? 'default' : 'outline'}
                  size="sm"
                >
                  Default
                </Button>
                <Button
                  onClick={() => setSelectedVariant('compact')}
                  variant={selectedVariant === 'compact' ? 'default' : 'outline'}
                  size="sm"
                >
                  Compact
                </Button>
                <Button
                  onClick={() => setSelectedVariant('dashboard')}
                  variant={selectedVariant === 'dashboard' ? 'default' : 'outline'}
                  size="sm"
                >
                  Dashboard
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Actions</label>
              <div className="flex gap-2">
                <Button onClick={simulateLoading} variant="secondary" size="sm">
                  Simulate Loading
                </Button>
                <Button onClick={handleToggleBalance} variant="outline" size="sm">
                  Toggle Balance: {showBalance ? 'Visible' : 'Hidden'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Showcase */}
      <Tabs defaultValue="interactive" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="interactive">Interactive</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="loading">Loading States</TabsTrigger>
        </TabsList>

        <TabsContent value="interactive" className="space-y-4">
          <h3 className="text-lg font-semibold">Interactive Savings Summary</h3>
          <p className="text-neutral-600 mb-4">
            Full-featured savings summary with all interactive elements and real data.
          </p>

          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <SavingsSummary
                accounts={exampleAccounts}
                totalBalance={totalBalance}
                totalGrowth={totalGrowth}
                totalInterestEarned={totalInterestEarned}
                monthlyTarget={monthlyTarget}
                growthData={exampleGrowthData}
                lastUpdated={lastUpdated}
                showBalance={showBalance}
                onToggleBalance={handleToggleBalance}
                onQuickDeposit={handleQuickDeposit}
                onQuickWithdraw={handleQuickWithdraw}
                onViewHistory={handleViewHistory}
                onCalculator={handleCalculator}
                onExportData={handleExportData}
                onRefresh={handleRefresh}
                loading={loading}
                variant={selectedVariant}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="variants" className="space-y-6">
          <h3 className="text-lg font-semibold">Component Variants</h3>

          <div className="space-y-8">
            <div>
              <h4 className="font-medium mb-3">Default Variant</h4>
              <p className="text-sm text-neutral-600 mb-4">
                Full-featured variant with all components including charts, stats, and actions.
              </p>
              <SavingsSummary
                accounts={exampleAccounts}
                totalBalance={totalBalance}
                totalGrowth={totalGrowth}
                totalInterestEarned={totalInterestEarned}
                monthlyTarget={monthlyTarget}
                growthData={exampleGrowthData}
                lastUpdated={lastUpdated}
                variant="default"
                className="max-w-4xl"
              />
            </div>

            <div>
              <h4 className="font-medium mb-3">Compact Variant</h4>
              <p className="text-sm text-neutral-600 mb-4">
                Condensed version suitable for sidebars or smaller spaces.
              </p>
              <div className="flex justify-start">
                <SavingsSummary
                  accounts={exampleAccounts}
                  totalBalance={totalBalance}
                  totalGrowth={totalGrowth}
                  totalInterestEarned={totalInterestEarned}
                  growthData={exampleGrowthData}
                  lastUpdated={lastUpdated}
                  variant="compact"
                />
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Dashboard Variant</h4>
              <p className="text-sm text-neutral-600 mb-4">
                Full-width variant optimized for dashboard layouts.
              </p>
              <SavingsSummary
                accounts={exampleAccounts}
                totalBalance={totalBalance}
                totalGrowth={totalGrowth}
                totalInterestEarned={totalInterestEarned}
                monthlyTarget={monthlyTarget}
                growthData={exampleGrowthData}
                lastUpdated={lastUpdated}
                variant="dashboard"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="loading" className="space-y-4">
          <h3 className="text-lg font-semibold">Loading States</h3>
          <p className="text-neutral-600 mb-4">
            Skeleton loading states for different variants while data is being fetched.
          </p>

          <div className="space-y-8">
            <div>
              <h4 className="font-medium mb-3">Default Loading</h4>
              <SavingsSummarySkeleton variant="default" />
            </div>

            <div>
              <h4 className="font-medium mb-3">Compact Loading</h4>
              <div className="flex justify-start">
                <SavingsSummarySkeleton variant="compact" />
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Dashboard Loading</h4>
              <SavingsSummarySkeleton variant="dashboard" />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Feature Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Component Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Display Features</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li>✅ Total balance with growth indicators</li>
                <li>✅ Breakdown by savings type with percentages</li>
                <li>✅ Interactive charts showing growth trends</li>
                <li>✅ Real-time statistics and KPIs</li>
                <li>✅ Monthly target progress tracking</li>
                <li>✅ Interest earned visualization</li>
                <li>✅ Account count and status indicators</li>
                <li>✅ Balance visibility toggle for privacy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Interactive Features</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li>✅ Quick deposit and withdrawal actions</li>
                <li>✅ Transaction history navigation</li>
                <li>✅ Savings calculator integration</li>
                <li>✅ Data export functionality</li>
                <li>✅ Real-time data refresh</li>
                <li>✅ Chart time range selection</li>
                <li>✅ Responsive design for all screens</li>
                <li>✅ Loading states and skeletons</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Basic Usage</h4>
              <pre className="bg-neutral-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import { SavingsSummary } from '@/components/ui/savings-summary'

<SavingsSummary
  accounts={accounts}
  totalBalance={29100000}
  totalGrowth={800000}
  totalInterestEarned={1500000}
  monthlyTarget={1000000}
  growthData={growthData}
  lastUpdated={new Date().toISOString()}
  onQuickDeposit={() => navigate('/savings/deposit')}
  onQuickWithdraw={() => navigate('/savings/withdraw')}
  onViewHistory={() => navigate('/savings/history')}
  onCalculator={() => openCalculator()}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Compact Version</h4>
              <pre className="bg-neutral-100 p-4 rounded-lg text-sm overflow-x-auto">
{`<SavingsSummary
  accounts={accounts}
  totalBalance={totalBalance}
  totalGrowth={totalGrowth}
  totalInterestEarned={totalInterestEarned}
  growthData={growthData}
  lastUpdated={lastUpdated}
  variant="compact"
  showBalance={showBalance}
  onToggleBalance={() => setShowBalance(!showBalance)}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Loading State</h4>
              <pre className="bg-neutral-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import { SavingsSummarySkeleton } from '@/components/ui/savings-summary'

{loading ? (
  <SavingsSummarySkeleton variant="default" />
) : (
  <SavingsSummary {...props} />
)}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Structure */}
      <Card>
        <CardHeader>
          <CardTitle>Data Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Savings Account Interface</h4>
              <pre className="bg-neutral-100 p-4 rounded-lg text-sm overflow-x-auto">
{`interface SavingsAccount {
  id: string
  type: 'pokok' | 'wajib' | 'sukarela' | 'berjangka'
  balance: number
  interestRate: number
  monthlyGrowth: number
  accountNumber: string
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Growth Data Interface</h4>
              <pre className="bg-neutral-100 p-4 rounded-lg text-sm overflow-x-auto">
{`interface SavingsGrowth {
  month: string
  balance: number
  deposits: number
  interest: number
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SavingsSummaryExample