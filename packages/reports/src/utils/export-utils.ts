import Papa from 'papaparse'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ExportResult, ReportData } from '../types'

export class ExportUtils {
  /**
   * Export data to CSV format
   */
  static exportToCSV(data: any[], filename: string): ExportResult {
    const csv = Papa.unparse(data, {
      header: true,
      quotes: true,
    })

    return {
      format: 'csv',
      data: csv,
      filename: `${filename}.csv`,
      contentType: 'text/csv; charset=utf-8',
    }
  }

  /**
   * Export data to PDF format
   */
  static exportToPDF(
    reportData: ReportData,
    title: string,
    filename: string,
    columns?: string[]
  ): ExportResult {
    const doc = new jsPDF()

    // Add title
    doc.setFontSize(16)
    doc.text(title, 20, 20)

    // Add metadata
    doc.setFontSize(10)
    doc.text(`Generated: ${reportData.metadata.generatedAt}`, 20, 30)
    doc.text(`Period: ${reportData.metadata.period.from} - ${reportData.metadata.period.to}`, 20, 35)
    doc.text(`Total Records: ${reportData.metadata.totalRecords}`, 20, 40)

    // Add table
    if (reportData.data.length > 0) {
      const tableColumns = columns || Object.keys(reportData.data[0])
      const tableRows = reportData.data.map(row =>
        tableColumns.map(col => this.formatCellValue(row[col]))
      )

      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 50,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      })
    }

    const pdfOutput = doc.output('arraybuffer')

    return {
      format: 'pdf',
      data: Buffer.from(pdfOutput),
      filename: `${filename}.pdf`,
      contentType: 'application/pdf',
    }
  }

  /**
   * Export data to JSON format
   */
  static exportToJSON(reportData: ReportData, filename: string): ExportResult {
    const jsonString = JSON.stringify(reportData, null, 2)

    return {
      format: 'json',
      data: jsonString,
      filename: `${filename}.json`,
      contentType: 'application/json; charset=utf-8',
    }
  }

  /**
   * Format cell values for display
   */
  private static formatCellValue(value: any): string {
    if (value === null || value === undefined) {
      return ''
    }

    if (typeof value === 'number') {
      // Format currency values
      if (value > 1000 && Number.isInteger(value)) {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(value)
      }
      return value.toString()
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }

    if (value instanceof Date) {
      return value.toLocaleDateString('id-ID')
    }

    return String(value)
  }

  /**
   * Generate filename with timestamp
   */
  static generateFilename(baseName: string, format: string): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    return `${baseName}_${timestamp}.${format}`
  }

  /**
   * Validate export format
   */
  static isValidFormat(format: string): boolean {
    return ['json', 'csv', 'pdf'].includes(format.toLowerCase())
  }
}