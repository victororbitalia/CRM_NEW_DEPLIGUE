import { useState, useEffect, useCallback } from 'react';

interface HistoricalData {
  date: string;
  totalReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  noShowReservations: number;
  revenue: number;
  totalGuests: number;
  occupiedTables: number;
}

interface PatternData {
  dayOfWeek?: string;
  month?: string;
  quarter?: string;
  totalReservations: number;
  completedReservations: number;
  revenue: number;
  totalGuests: number;
  avgPartySize: number;
  occupiedTables: number;
}

interface PredictionData {
  date: string;
  predictedReservations: number;
  predictedRevenue: number;
  predictedGuests: number;
  confidence: 'low' | 'medium' | 'high';
}

interface GrowthRateData {
  month: string;
  reservations: number;
  revenue: number;
  reservationGrowthRate: number;
  revenueGrowthRate: number;
}

interface PeakDemandData {
  hour: string;
  dayOfWeek: string;
  reservationCount: number;
  totalGuests: number;
  occupiedTables: number;
}

interface TrendAnalysisResult {
  dataPoints: number;
  minReservations: number;
  maxReservations: number;
  avgReservations: number;
  minRevenue: number;
  maxRevenue: number;
  avgRevenue: number;
  reservationTrend: 'increasing' | 'decreasing' | 'stable';
  revenueTrend: 'increasing' | 'decreasing' | 'stable';
}

interface UseTrendAnalyticsOptions {
  startDate?: Date;
  endDate?: Date;
  restaurantId?: string;
  metric?: 'reservations' | 'revenue';
  predictionDays?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseTrendAnalyticsReturn {
  data: {
    historicalData: HistoricalData[];
    patterns: {
      dayOfWeek: PatternData[];
      monthly: PatternData[];
      seasonal: PatternData[];
    };
    predictions: {
      movingAverage: Array<{
        date: string;
        reservations: number;
        revenue: number;
        predictedReservations: number;
        predictedRevenue: number;
      }>;
      forecast: PredictionData[];
    };
    growthRates: GrowthRateData[];
    peakDemandPeriods: PeakDemandData[];
    trendAnalysis: TrendAnalysisResult;
  } | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  seasonalityAnalysis: {
    overallSeasonality: number;
    peakSeason: string;
    lowSeason: string;
    seasonalFactors: Array<{
      period: string;
      factor: number;
    }>;
  } | null;
}

export const useTrendAnalytics = ({
  startDate,
  endDate,
  restaurantId,
  metric = 'reservations',
  predictionDays = 30,
  autoRefresh = false,
  refreshInterval = 30 * 60 * 1000, // 30 minutes
}: UseTrendAnalyticsOptions = {}): UseTrendAnalyticsReturn => {
  const [data, setData] = useState<UseTrendAnalyticsReturn['data']>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seasonalityAnalysis, setSeasonalityAnalysis] = useState<UseTrendAnalyticsReturn['seasonalityAnalysis']>(null);

  const fetchTrendData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Set default date range if not provided
      const now = new Date();
      const start = startDate || new Date(now);
      const end = endDate || new Date(now);

      if (!startDate || !endDate) {
        // Default to last 90 days for trend analysis
        start.setDate(now.getDate() - 90);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      }

      // Fetch trend analytics from the API
      const response = await fetch(
        `/api/analytics/trends?startDate=${start.toISOString()}&endDate=${end.toISOString()}&metric=${metric}&predictionDays=${predictionDays}${restaurantId ? `&restaurantId=${restaurantId}` : ''}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch trend analytics');
      }

      const result = await response.json();
      const trendData = result.data;
      
      setData(trendData);

      // Fetch seasonality analysis
      const seasonalityResponse = await fetch(
        `/api/analytics/trends/seasonality?startDate=${start.toISOString()}&endDate=${end.toISOString()}${restaurantId ? `&restaurantId=${restaurantId}` : ''}`
      );

      if (seasonalityResponse.ok) {
        const seasonalityResult = await seasonalityResponse.json();
        setSeasonalityAnalysis(seasonalityResult.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, restaurantId, metric, predictionDays]);

  const refresh = useCallback(async () => {
    await fetchTrendData();
  }, [fetchTrendData]);

  // Initial fetch
  useEffect(() => {
    fetchTrendData();
  }, [fetchTrendData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchTrendData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchTrendData]);

  return {
    data,
    loading,
    error,
    refresh,
    seasonalityAnalysis,
  };
};