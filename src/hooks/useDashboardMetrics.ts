import { useState, useEffect, useCallback } from 'react';
import { AnalyticsService, AnalyticsFilters, DashboardMetrics } from '@/lib/services';

interface UseDashboardMetricsOptions {
  initialFilters?: AnalyticsFilters;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseDashboardMetricsReturn {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateFilters: (filters: Partial<AnalyticsFilters>) => void;
  filters: AnalyticsFilters;
}

export const useDashboardMetrics = ({
  initialFilters = {},
  autoRefresh = false,
  refreshInterval = 5 * 60 * 1000, // 5 minutes
}: UseDashboardMetricsOptions = {}): UseDashboardMetricsReturn => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AnalyticsService.getDashboardMetrics(filters);
      setMetrics(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const refresh = useCallback(async () => {
    await fetchMetrics();
  }, [fetchMetrics]);

  const updateFilters = useCallback((newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refresh,
    updateFilters,
    filters,
  };
};