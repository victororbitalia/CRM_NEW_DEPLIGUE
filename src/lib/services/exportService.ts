import ReportService from './reportService';
import { ReportFilters } from './reportService';
import { formatCurrency } from '@/lib/utils';

// Simple formatCurrency function if not available in utils
const formatCurrencyWithSymbol = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf' | 'excel';
  includeHeaders?: boolean;
  dateFormat?: string;
  currencyFormat?: string;
  filename?: string;
}

export interface ExportData {
  type: 'reservations' | 'customers' | 'financial' | 'analytics';
  data: any[];
  metadata?: {
    generatedAt: Date;
    period: {
      start: Date;
      end: Date;
    };
    filters: any;
  };
}

class ExportService {
  /**
   * Export data to CSV format
   */
  async exportToCSV(data: ExportData, options: ExportOptions = { format: 'csv' }): Promise<string> {
    const { includeHeaders = true, dateFormat = 'YYYY-MM-DD', currencyFormat = 'USD' } = options;

    if (!data.data || !data.data.length) {
      return '';
    }

    // Get headers from first object
    const headers = Object.keys(data.data[0]);

    let csv = '';

    // Add headers if requested
    if (includeHeaders) {
      csv += headers.join(',') + '\n';
    }

    // Add data rows
    for (const row of data.data) {
      const values = headers.map(header => {
        let value = row[header];
        
        // Format dates
        if (value instanceof Date) {
          value = this.formatDate(value, dateFormat);
        }
        
        // Format currency
        if (header.toLowerCase().includes('amount') || header.toLowerCase().includes('revenue') || header.toLowerCase().includes('deposit')) {
          value = formatCurrencyWithSymbol(value || 0, currencyFormat);
        }
        
        // Handle null/undefined values
        if (value === null || value === undefined) {
          value = '';
        }
        
        // Escape commas and quotes in string values
        if (typeof value === 'string') {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
      });
      
      csv += values.join(',') + '\n';
    }

    return csv;
  }

  /**
   * Export data to JSON format
   */
  async exportToJSON(data: ExportData): Promise<string> {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Export data to Excel format (simplified CSV-based approach)
   */
  async exportToExcel(data: ExportData, options: ExportOptions = { format: 'excel' }): Promise<string> {
    // For a real implementation, you would use a library like xlsx
    // For now, we'll return CSV format which Excel can open
    return this.exportToCSV(data, options);
  }

  /**
   * Export data to PDF format (simplified HTML-based approach)
   */
  async exportToPDF(data: ExportData, options: ExportOptions = { format: 'pdf' }): Promise<string> {
    // For a real implementation, you would use a library like puppeteer or jsPDF
    // For now, we'll return HTML format which can be converted to PDF
    const { includeHeaders = true, dateFormat = 'YYYY-MM-DD', currencyFormat = 'USD' } = options;

    if (!data.data || !data.data.length) {
      return '<html><body><p>No data to export</p></body></html>';
    }

    // Get headers from first object
    const headers = Object.keys(data.data[0]);

    let html = `
      <html>
        <head>
          <title>${data.type} Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .metadata { margin-bottom: 20px; }
            .metadata p { margin: 5px 0; }
          </style>
        </head>
        <body>
          <h1>${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Report</h1>
    `;

    // Add metadata if available
    if (data.metadata) {
      html += `
        <div class="metadata">
          <p><strong>Generated:</strong> ${this.formatDate(data.metadata.generatedAt, dateFormat)}</p>
          <p><strong>Period:</strong> ${this.formatDate(data.metadata.period.start, dateFormat)} to ${this.formatDate(data.metadata.period.end, dateFormat)}</p>
        </div>
      `;
    }

    html += '<table>';

    // Add headers if requested
    if (includeHeaders) {
      html += '<tr><th>' + headers.join('</th><th>') + '</th></tr>';
    }

    // Add data rows
    for (const row of data.data) {
      html += '<tr>';
      for (const header of headers) {
        let value = row[header];
        
        // Format dates
        if (value instanceof Date) {
          value = this.formatDate(value, dateFormat);
        }
        
        // Format currency
        if (header.toLowerCase().includes('amount') || header.toLowerCase().includes('revenue') || header.toLowerCase().includes('deposit')) {
          value = formatCurrencyWithSymbol(value || 0, currencyFormat);
        }
        
        // Handle null/undefined values
        if (value === null || value === undefined) {
          value = '';
        }
        
        html += `<td>${value}</td>`;
      }
      html += '</tr>';
    }

    html += `
          </table>
        </body>
      </html>
    `;

    return html;
  }

  /**
   * Generic export method that delegates to specific format handlers
   */
  async export(data: ExportData, options: ExportOptions): Promise<string> {
    switch (options.format) {
      case 'csv':
        return this.exportToCSV(data, options);
      case 'json':
        return this.exportToJSON(data);
      case 'excel':
        return this.exportToExcel(data, options);
      case 'pdf':
        return this.exportToPDF(data, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Generate and download a file in the browser
   */
  async downloadFile(data: ExportData, options: ExportOptions): Promise<void> {
    const { format, filename = `${data.type}_export_${new Date().toISOString().split('T')[0]}` } = options;
    const content = await this.export(data, options);
    
    // Create a blob with the appropriate MIME type
    let mimeType: string;
    let fileExtension: string;
    
    switch (format) {
      case 'csv':
        mimeType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'json':
        mimeType = 'application/json';
        fileExtension = 'json';
        break;
      case 'excel':
        mimeType = 'application/vnd.ms-excel';
        fileExtension = 'xlsx';
        break;
      case 'pdf':
        mimeType = 'application/pdf';
        fileExtension = 'pdf';
        break;
      default:
        mimeType = 'text/plain';
        fileExtension = 'txt';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element and trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    URL.revokeObjectURL(url);
  }

  /**
   * Export reservations data
   */
  async exportReservations(filters: ReportFilters, options: ExportOptions): Promise<void> {
    const reportService = ReportService;
    const reportData = await reportService.generateReservationReport(filters);
    
    const exportData: ExportData = {
      type: 'reservations',
      data: reportData.data,
      metadata: {
        generatedAt: reportData.generatedAt,
        period: reportData.period,
        filters,
      },
    };
    
    await this.downloadFile(exportData, options);
  }

  /**
   * Export customers data
   */
  async exportCustomers(filters: ReportFilters, options: ExportOptions): Promise<void> {
    const reportService = ReportService;
    const reportData = await reportService.generateCustomerReport(filters);
    
    const exportData: ExportData = {
      type: 'customers',
      data: reportData.data,
      metadata: {
        generatedAt: reportData.generatedAt,
        period: reportData.period,
        filters,
      },
    };
    
    await this.downloadFile(exportData, options);
  }

  /**
   * Export financial data
   */
  async exportFinancial(filters: ReportFilters, options: ExportOptions): Promise<void> {
    const reportService = ReportService;
    const reportData = await reportService.generateFinancialReport(filters);
    
    const exportData: ExportData = {
      type: 'financial',
      data: reportData.data,
      metadata: {
        generatedAt: reportData.generatedAt,
        period: reportData.period,
        filters,
      },
    };
    
    await this.downloadFile(exportData, options);
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(analyticsData: any, options: ExportOptions): Promise<void> {
    const exportData: ExportData = {
      type: 'analytics',
      data: analyticsData,
      metadata: {
        generatedAt: new Date(),
        period: {
          start: new Date(),
          end: new Date(),
        },
        filters: {},
      },
    };
    
    await this.downloadFile(exportData, options);
  }

  /**
   * Format date according to specified format
   */
  private formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    switch (format) {
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      default:
        return date.toISOString();
    }
  }

  /**
   * Create a data URL for the export content
   */
  async createDataUrl(data: ExportData, options: ExportOptions): Promise<string> {
    const content = await this.export(data, options);
    let mimeType: string;
    
    switch (options.format) {
      case 'csv':
        mimeType = 'text/csv';
        break;
      case 'json':
        mimeType = 'application/json';
        break;
      case 'excel':
        mimeType = 'application/vnd.ms-excel';
        break;
      case 'pdf':
        mimeType = 'application/pdf';
        break;
      default:
        mimeType = 'text/plain';
    }
    
    return `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
  }

  /**
   * Export multiple data types to a single file
   */
  async exportMultiple(dataSets: Array<{ data: ExportData; options: ExportOptions }>): Promise<string> {
    // For simplicity, we'll combine all data into a single JSON file
    const combinedData = {
      exportedAt: new Date(),
      dataSets: dataSets.map(ds => ({
        type: ds.data.type,
        data: ds.data.data,
        metadata: ds.data.metadata,
      })),
    };
    
    return JSON.stringify(combinedData, null, 2);
  }
}

export default new ExportService();