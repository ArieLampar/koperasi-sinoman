# @koperasi-sinoman/reports

Comprehensive business reporting package for Koperasi Sinoman, providing analytics and insights across all business domains including marketplace, referrals, investments, and Bank Sampah operations.

## Features

- **Marketplace Reports**: Sales analytics, product performance, seller metrics, and commission calculations
- **Referral Reports**: Referral performance tracking, conversion analysis, and reward calculations
- **Investment Reports**: ROI analysis, portfolio performance, and investor metrics
- **Bank Sampah Reports**: Environmental impact tracking, waste management analytics, and sustainability metrics
- **Multi-format Export**: JSON, CSV, and PDF export capabilities
- **Date Range Utilities**: Flexible date range handling with timezone support
- **Comprehensive Analytics**: KPI dashboards and business overview reports

## Installation

```bash
npm install @koperasi-sinoman/reports
```

## Usage

### Basic Setup

```typescript
import { ReportsFactory } from '@koperasi-sinoman/reports'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('your-url', 'your-key')
const reports = new ReportsFactory(supabase)
```

### Marketplace Reports

```typescript
// Generate sales analytics
const salesAnalytics = await reports.marketplace().generateSalesAnalytics({
  dateFrom: '2024-01-01T00:00:00Z',
  dateTo: '2024-01-31T23:59:59Z',
  format: 'json'
}, {
  sellerIds: ['seller-1', 'seller-2'],
  categoryIds: ['category-1']
})

// Export product performance report
const exportResult = await reports.marketplace().exportReport(
  'products',
  {
    dateFrom: '2024-01-01T00:00:00Z',
    dateTo: '2024-01-31T23:59:59Z',
    format: 'csv'
  }
)
```

### Referral Reports

```typescript
// Generate referral analytics
const referralAnalytics = await reports.referral().generateReferralAnalytics({
  dateFrom: '2024-01-01T00:00:00Z',
  dateTo: '2024-01-31T23:59:59Z',
  format: 'json'
})

// Calculate pending rewards
const pendingRewards = await reports.referral().calculatePendingRewards({
  memberIds: ['member-1', 'member-2']
})

// Process reward payouts
const payoutResult = await reports.referral().processRewardPayouts(
  ['member-1', 'member-2'],
  'admin-user-id'
)
```

### Investment Reports

```typescript
// Generate investment analytics
const investmentAnalytics = await reports.investment().generateInvestmentAnalytics({
  dateFrom: '2024-01-01T00:00:00Z',
  dateTo: '2024-01-31T23:59:59Z',
  format: 'json'
}, {
  riskLevel: ['low', 'medium']
})

// Calculate investment projections
const projections = await reports.investment().calculateInvestmentProjections(
  'opportunity-id',
  [
    {
      name: 'Optimistic',
      revenueGrowthRate: 0.15,
      expenseGrowthRate: 0.05,
      marketConditions: 'optimistic'
    }
  ]
)
```

### Bank Sampah Reports

```typescript
// Generate environmental impact report
const environmentalReport = await reports.bankSampah().generateEnvironmentalImpactReport({
  dateFrom: '2024-01-01T00:00:00Z',
  dateTo: '2024-01-31T23:59:59Z',
  format: 'json'
}, {
  unitIds: ['unit-1', 'unit-2'],
  wasteTypes: ['plastic', 'organic']
})

// Calculate carbon footprint
const carbonFootprint = await reports.bankSampah().calculateCarbonFootprint({
  dateFrom: '2024-01-01T00:00:00Z',
  dateTo: '2024-01-31T23:59:59Z',
  format: 'json'
})
```

### Business Overview

```typescript
// Generate comprehensive business overview
const businessOverview = await reports.generateBusinessOverview(
  '2024-01-01T00:00:00Z',
  '2024-01-31T23:59:59Z',
  'json'
)

// Generate KPI dashboard
const kpiDashboard = await reports.generateKPIDashboard(
  '2024-01-01T00:00:00Z',
  '2024-01-31T23:59:59Z'
)
```

## Report Types

### Marketplace Reports
- `sales`: Sales analytics with trends and metrics
- `products`: Product performance and popularity analysis
- `sellers`: Seller metrics and commission calculations
- `commissions`: Detailed commission calculations

### Referral Reports
- `analytics`: Comprehensive referral performance
- `referrers`: Top referrer performance metrics
- `rewards`: Reward calculations and payouts
- `payouts`: Payout history and processing

### Investment Reports
- `analytics`: Investment performance overview
- `roi`: ROI calculations and variance analysis
- `portfolio`: Portfolio performance metrics
- `investors`: Investor metrics and behavior

### Bank Sampah Reports
- `analytics`: Waste management overview
- `environmental`: Environmental impact analysis
- `units`: Unit performance metrics
- `members`: Member engagement analysis
- `sustainability`: Sustainability metrics and trends

## Export Formats

All reports support multiple export formats:

- **JSON**: Structured data for API consumption
- **CSV**: Tabular data for spreadsheet analysis
- **PDF**: Formatted reports for presentation

## Date Utilities

```typescript
import { DateUtils } from '@koperasi-sinoman/reports'

// Get predefined period dates
const periodDates = DateUtils.getPeriodDates('last_30_days')

// Generate date ranges for time series
const dateRanges = DateUtils.generateDateRanges(
  '2024-01-01T00:00:00Z',
  '2024-01-31T23:59:59Z',
  'week'
)

// Validate date range
const validation = DateUtils.validateDateRange(
  '2024-01-01T00:00:00Z',
  '2024-01-31T23:59:59Z'
)
```

## Advanced Features

### Custom Filters

Each report type supports domain-specific filters:

```typescript
// Marketplace filters
const marketplaceFilters = {
  sellerIds: ['seller-1'],
  categoryIds: ['category-1'],
  status: ['completed'],
  paymentStatus: ['paid']
}

// Investment filters
const investmentFilters = {
  opportunityIds: ['opp-1'],
  investorIds: ['investor-1'],
  riskLevel: ['low', 'medium']
}
```

### Aggregation and Grouping

Reports support flexible data aggregation:

```typescript
// Group sales by different periods
const salesByDay = await reports.marketplace().getSalesByPeriod(
  dateFrom, dateTo, filters, 'day'
)

const salesByMonth = await reports.marketplace().getSalesByPeriod(
  dateFrom, dateTo, filters, 'month'
)
```

### Performance Analytics

Calculate advanced metrics:

```typescript
// Portfolio diversification analysis
const diversification = await reports.investment().calculatePortfolioDiversification(
  'investor-id'
)

// Conversion funnel analysis
const conversionAnalysis = await reports.referral().getConversionAnalysis(
  dateFrom, dateTo
)

// Waste management efficiency
const efficiency = await reports.bankSampah().generateWasteManagementEfficiency({
  dateFrom, dateTo, format: 'json'
})
```

## Error Handling

The package includes comprehensive error handling:

```typescript
try {
  const report = await reports.marketplace().generateSalesAnalytics(options)
} catch (error) {
  if (error.message.includes('Invalid date range')) {
    // Handle date validation error
  } else if (error.message.includes('Database error')) {
    // Handle database connection error
  }
}
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  SalesAnalytics,
  ReferralAnalytics,
  InvestmentAnalytics,
  BankSampahAnalytics,
  ReportOptions,
  ExportResult
} from '@koperasi-sinoman/reports'
```

## Dependencies

- `@supabase/supabase-js`: Database client
- `date-fns`: Date manipulation utilities
- `lodash`: Utility functions
- `papaparse`: CSV parsing and generation
- `jspdf`: PDF generation
- `jspdf-autotable`: PDF table generation

## License

MIT