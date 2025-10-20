// Analytics hooks
export { useDashboardMetrics } from '../useDashboardMetrics';
export { useOccupancyData } from '../useOccupancyData';
export { useReservationAnalytics } from '../useReservationAnalytics';
export { useCustomerAnalytics } from '../useCustomerAnalytics';
export { useFinancialAnalytics } from '../useFinancialAnalytics';
export { useTrendAnalytics } from '../useTrendAnalytics';

// Re-export types for convenience
export type {
  DashboardMetrics,
  AnalyticsFilters,
  TrendFilters,
  TrendData,
  HistoricalData,
  PatternData,
  PredictionData,
  ExportOptions,
  ExportData,
} from '@/lib/services';