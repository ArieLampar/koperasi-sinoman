import { DatabaseClient, MarketplaceReportFilters, SalesAnalytics, ProductPerformance, SellerMetrics, CommissionCalculation, ReportData, ReportOptions } from './types'
import { DateUtils } from './utils/date-utils'
import { ExportUtils } from './utils/export-utils'
import _ from 'lodash'

export class MarketplaceReports {
  constructor(private supabase: DatabaseClient) {}

  /**
   * Generate comprehensive sales analytics report
   */
  async generateSalesAnalytics(
    options: ReportOptions,
    filters: MarketplaceReportFilters = {}
  ): Promise<SalesAnalytics> {
    const { dateFrom, dateTo } = options

    // Validate date range
    const dateValidation = DateUtils.validateDateRange(dateFrom, dateTo)
    if (!dateValidation.valid) {
      throw new Error(dateValidation.error)
    }

    // Build base query with filters
    const baseQuery = this.buildOrderQuery(dateFrom, dateTo, filters)

    // Get total sales metrics
    const { data: salesData, error: salesError } = await this.supabase
      .rpc('get_sales_summary', {
        date_from: dateFrom,
        date_to: dateTo,
        seller_ids: filters.sellerIds,
        category_ids: filters.categoryIds,
        status_filter: filters.status
      })

    if (salesError) throw salesError

    // Get top products
    const topProducts = await this.getTopProducts(dateFrom, dateTo, filters, 10)

    // Get top sellers
    const topSellers = await this.getTopSellers(dateFrom, dateTo, filters, 10)

    // Get sales by period
    const salesByPeriod = await this.getSalesByPeriod(dateFrom, dateTo, filters, 'day')

    // Get orders by status
    const ordersByStatus = await this.getOrdersByStatus(dateFrom, dateTo, filters)

    const summary = salesData[0] || {
      total_sales: 0,
      total_orders: 0,
      total_commission: 0
    }

    return {
      totalSales: summary.total_sales || 0,
      totalOrders: summary.total_orders || 0,
      averageOrderValue: summary.total_orders > 0 ? (summary.total_sales / summary.total_orders) : 0,
      totalCommission: summary.total_commission || 0,
      topProducts,
      topSellers,
      salesByPeriod,
      ordersByStatus
    }
  }

  /**
   * Generate product performance report
   */
  async generateProductPerformanceReport(
    options: ReportOptions,
    filters: MarketplaceReportFilters = {}
  ): Promise<ReportData> {
    const { dateFrom, dateTo } = options

    const products = await this.getProductPerformance(dateFrom, dateTo, filters)

    return {
      data: products,
      metadata: {
        totalRecords: products.length,
        generatedAt: new Date().toISOString(),
        period: { from: dateFrom, to: dateTo },
        filters
      }
    }
  }

  /**
   * Generate seller metrics report
   */
  async generateSellerMetricsReport(
    options: ReportOptions,
    filters: MarketplaceReportFilters = {}
  ): Promise<ReportData> {
    const { dateFrom, dateTo } = options

    const sellers = await this.getSellerMetrics(dateFrom, dateTo, filters)

    return {
      data: sellers,
      metadata: {
        totalRecords: sellers.length,
        generatedAt: new Date().toISOString(),
        period: { from: dateFrom, to: dateTo },
        filters
      }
    }
  }

  /**
   * Generate commission calculations report
   */
  async generateCommissionReport(
    options: ReportOptions,
    filters: MarketplaceReportFilters = {}
  ): Promise<ReportData> {
    const { dateFrom, dateTo } = options

    const commissions = await this.calculateCommissions(dateFrom, dateTo, filters)

    return {
      data: commissions,
      metadata: {
        totalRecords: commissions.length,
        generatedAt: new Date().toISOString(),
        period: { from: dateFrom, to: dateTo },
        filters
      }
    }
  }

  /**
   * Export marketplace report
   */
  async exportReport(
    reportType: 'sales' | 'products' | 'sellers' | 'commissions',
    options: ReportOptions,
    filters: MarketplaceReportFilters = {}
  ) {
    let reportData: ReportData

    switch (reportType) {
      case 'sales':
        const analytics = await this.generateSalesAnalytics(options, filters)
        reportData = {
          data: [analytics],
          metadata: {
            totalRecords: 1,
            generatedAt: new Date().toISOString(),
            period: { from: options.dateFrom, to: options.dateTo },
            filters
          }
        }
        break

      case 'products':
        reportData = await this.generateProductPerformanceReport(options, filters)
        break

      case 'sellers':
        reportData = await this.generateSellerMetricsReport(options, filters)
        break

      case 'commissions':
        reportData = await this.generateCommissionReport(options, filters)
        break

      default:
        throw new Error(`Unsupported report type: ${reportType}`)
    }

    const filename = ExportUtils.generateFilename(`marketplace_${reportType}`, options.format)

    switch (options.format) {
      case 'csv':
        return ExportUtils.exportToCSV(reportData.data, filename)

      case 'pdf':
        return ExportUtils.exportToPDF(reportData, `Marketplace ${reportType} Report`, filename)

      case 'json':
      default:
        return ExportUtils.exportToJSON(reportData, filename)
    }
  }

  /**
   * Get top performing products
   */
  private async getTopProducts(
    dateFrom: string,
    dateTo: string,
    filters: MarketplaceReportFilters,
    limit: number = 10
  ): Promise<ProductPerformance[]> {
    let query = this.supabase
      .from('marketplace_order_items')
      .select(`
        product_id,
        quantity,
        price,
        total_amount,
        products!inner(
          name,
          sellers!inner(business_name),
          product_categories!inner(name)
        ),
        orders!inner(
          created_at,
          status
        )
      `)
      .gte('orders.created_at', dateFrom)
      .lte('orders.created_at', dateTo)

    if (filters.sellerIds?.length) {
      query = query.in('products.seller_id', filters.sellerIds)
    }

    if (filters.categoryIds?.length) {
      query = query.in('products.category_id', filters.categoryIds)
    }

    if (filters.status?.length) {
      query = query.in('orders.status', filters.status)
    }

    const { data, error } = await query

    if (error) throw error

    // Group by product and calculate metrics
    const productGroups = _.groupBy(data, 'product_id')

    const products: ProductPerformance[] = Object.entries(productGroups).map(([productId, items]) => {
      const firstItem = items[0]
      const totalQuantity = _.sumBy(items, 'quantity')
      const totalRevenue = _.sumBy(items, 'total_amount')
      const totalOrders = _.uniqBy(items, 'order_id').length

      return {
        productId,
        productName: firstItem.products.name,
        sellerName: firstItem.products.sellers.business_name,
        categoryName: firstItem.products.product_categories.name,
        totalSales: totalRevenue,
        totalOrders,
        totalQuantity,
        averageRating: 0, // TODO: Get from reviews
        reviewCount: 0, // TODO: Get from reviews
        revenue: totalRevenue,
        profit: 0 // TODO: Calculate based on cost price
      }
    })

    return _.orderBy(products, 'totalSales', 'desc').slice(0, limit)
  }

  /**
   * Get top performing sellers
   */
  private async getTopSellers(
    dateFrom: string,
    dateTo: string,
    filters: MarketplaceReportFilters,
    limit: number = 10
  ): Promise<SellerMetrics[]> {
    const { data, error } = await this.supabase
      .rpc('get_seller_metrics', {
        date_from: dateFrom,
        date_to: dateTo,
        seller_ids: filters.sellerIds,
        limit_count: limit
      })

    if (error) throw error

    return data.map((seller: any) => ({
      sellerId: seller.seller_id,
      sellerName: seller.business_name,
      businessType: seller.business_type,
      totalSales: seller.total_sales || 0,
      totalOrders: seller.total_orders || 0,
      totalProducts: seller.total_products || 0,
      averageRating: seller.average_rating || 0,
      commissionEarned: seller.commission_earned || 0,
      commissionRate: seller.commission_rate || 0,
      status: seller.status
    }))
  }

  /**
   * Get product performance details
   */
  private async getProductPerformance(
    dateFrom: string,
    dateTo: string,
    filters: MarketplaceReportFilters
  ): Promise<ProductPerformance[]> {
    const { data, error } = await this.supabase
      .rpc('get_product_performance', {
        date_from: dateFrom,
        date_to: dateTo,
        seller_ids: filters.sellerIds,
        category_ids: filters.categoryIds,
        product_ids: filters.productIds
      })

    if (error) throw error

    return data.map((product: any) => ({
      productId: product.product_id,
      productName: product.product_name,
      sellerName: product.seller_name,
      categoryName: product.category_name,
      totalSales: product.total_sales || 0,
      totalOrders: product.total_orders || 0,
      totalQuantity: product.total_quantity || 0,
      averageRating: product.average_rating || 0,
      reviewCount: product.review_count || 0,
      revenue: product.revenue || 0,
      profit: product.profit || 0
    }))
  }

  /**
   * Get seller metrics details
   */
  private async getSellerMetrics(
    dateFrom: string,
    dateTo: string,
    filters: MarketplaceReportFilters
  ): Promise<SellerMetrics[]> {
    const { data, error } = await this.supabase
      .rpc('get_detailed_seller_metrics', {
        date_from: dateFrom,
        date_to: dateTo,
        seller_ids: filters.sellerIds
      })

    if (error) throw error

    return data.map((seller: any) => ({
      sellerId: seller.seller_id,
      sellerName: seller.business_name,
      businessType: seller.business_type,
      totalSales: seller.total_sales || 0,
      totalOrders: seller.total_orders || 0,
      totalProducts: seller.total_products || 0,
      averageRating: seller.average_rating || 0,
      commissionEarned: seller.commission_earned || 0,
      commissionRate: seller.commission_rate || 0,
      status: seller.status
    }))
  }

  /**
   * Calculate commissions for sellers
   */
  private async calculateCommissions(
    dateFrom: string,
    dateTo: string,
    filters: MarketplaceReportFilters
  ): Promise<CommissionCalculation[]> {
    const { data, error } = await this.supabase
      .rpc('calculate_seller_commissions', {
        date_from: dateFrom,
        date_to: dateTo,
        seller_ids: filters.sellerIds
      })

    if (error) throw error

    return data.map((commission: any) => ({
      sellerId: commission.seller_id,
      sellerName: commission.seller_name,
      period: `${DateUtils.formatDate(dateFrom)} - ${DateUtils.formatDate(dateTo)}`,
      grossSales: commission.gross_sales || 0,
      commissionRate: commission.commission_rate || 0,
      commissionAmount: commission.commission_amount || 0,
      fees: commission.fees || 0,
      netCommission: commission.net_commission || 0,
      orderCount: commission.order_count || 0,
      status: commission.status || 'pending'
    }))
  }

  /**
   * Get sales by time period
   */
  private async getSalesByPeriod(
    dateFrom: string,
    dateTo: string,
    filters: MarketplaceReportFilters,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ) {
    const { data, error } = await this.supabase
      .rpc('get_sales_by_period', {
        date_from: dateFrom,
        date_to: dateTo,
        group_by: groupBy,
        seller_ids: filters.sellerIds,
        category_ids: filters.categoryIds
      })

    if (error) throw error

    return data.map((item: any) => ({
      period: item.period,
      value: item.total_sales || 0,
      orders: item.total_orders || 0,
      customers: item.unique_customers || 0
    }))
  }

  /**
   * Get orders by status distribution
   */
  private async getOrdersByStatus(
    dateFrom: string,
    dateTo: string,
    filters: MarketplaceReportFilters
  ) {
    let query = this.supabase
      .from('marketplace_orders')
      .select('status')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)

    if (filters.sellerIds?.length) {
      // Join with order items to filter by seller
      query = query.in('id',
        await this.getOrderIdsBySellers(filters.sellerIds)
      )
    }

    const { data, error } = await query

    if (error) throw error

    const statusCounts = _.countBy(data, 'status')
    const total = data.length

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }))
  }

  /**
   * Helper function to build order query with filters
   */
  private buildOrderQuery(dateFrom: string, dateTo: string, filters: MarketplaceReportFilters) {
    let query = this.supabase
      .from('marketplace_orders')
      .select('*')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)

    if (filters.status?.length) {
      query = query.in('status', filters.status)
    }

    if (filters.paymentStatus?.length) {
      query = query.in('payment_status', filters.paymentStatus)
    }

    return query
  }

  /**
   * Helper function to get order IDs by sellers
   */
  private async getOrderIdsBySellers(sellerIds: string[]): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('marketplace_order_items')
      .select('order_id, products!inner(seller_id)')
      .in('products.seller_id', sellerIds)

    if (error) throw error

    return _.uniq(data.map(item => item.order_id))
  }
}