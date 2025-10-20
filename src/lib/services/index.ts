// Export all services
export { default as ReservationService } from './reservationService';
export { default as NotificationService } from './notificationService';
export { default as AutomationService } from './automationService';
export { default as ReportService } from './reportService';
export { default as AnalyticsService } from './analyticsService';
export { default as TrendService } from './trendService';
export { default as ExportService } from './exportService';
export { default as RealtimeService } from './realtimeService';
export { default as AlertService } from './alertService';
export { default as MLService } from './mlService';

// Re-export types for convenience
export type {
  NotificationData,
  NotificationTemplate,
} from './notificationService';

export type {
  AutomationRule,
  TimeBasedTask,
} from './automationService';

export type {
  ReportData,
  ReservationReportData,
  CustomerReportData,
  WaitlistReportData,
  FinancialReportData,
  ReportFilters,
} from './reportService';

export type {
  AnalyticsFilters,
  DashboardMetrics,
  AnalyticsData,
} from './analyticsService';

export type {
  TrendFilters,
  TrendData,
  HistoricalData,
  PatternData,
  PredictionData,
} from './trendService';

export type {
  ExportOptions,
  ExportData,
} from './exportService';

export type {
  RealtimeSubscription,
  RealtimeEvent,
} from './realtimeService';

export type {
  Alert,
  AlertRule,
  NotificationChannel,
} from './alertService';

export type {
  PredictionRequest,
  PredictionResult,
  AnomalyDetectionResult,
  RecommendationResult,
} from './mlService';