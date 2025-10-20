import { useState, useEffect, useCallback } from 'react';

interface ReservationData {
  period: string;
  total: number;
  confirmed?: number;
  completed?: number;
  cancelled?: number;
  noShow?: number;
  pending?: number;
}

interface UseReservationAnalyticsOptions {
  startDate?: Date;
  endDate?: Date;
  restaurantId?: string;
  status?: string;
  groupBy?: 'day' | 'week' | 'month';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseReservationAnalyticsReturn {
  data: ReservationData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }> | null;
  partySizeDistribution: Array<{
    partySize: number;
    count: number;
    percentage: number;
  }> | null;
  sourceDistribution: Array<{
    source: string;
    count: number;
    percentage: number;
  }> | null;
  summary: {
    totalReservations: number;
    confirmedReservations: number;
    completedReservations: number;
    cancelledReservations: number;
    noShowReservations: number;
    confirmationRate: number;
    completionRate: number;
    cancellationRate: number;
    noShowRate: number;
  } | null;
}

export const useReservationAnalytics = ({
  startDate,
  endDate,
  restaurantId,
  status,
  groupBy = 'day',
  autoRefresh = false,
  refreshInterval = 5 * 60 * 1000, // 5 minutes
}: UseReservationAnalyticsOptions = {}): UseReservationAnalyticsReturn => {
  const [data, setData] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusDistribution, setStatusDistribution] = useState<UseReservationAnalyticsReturn['statusDistribution']>(null);
  const [partySizeDistribution, setPartySizeDistribution] = useState<UseReservationAnalyticsReturn['partySizeDistribution']>(null);
  const [sourceDistribution, setSourceDistribution] = useState<UseReservationAnalyticsReturn['sourceDistribution']>(null);
  const [summary, setSummary] = useState<UseReservationAnalyticsReturn['summary']>(null);

  const fetchReservationData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Set default date range if not provided
      const now = new Date();
      const start = startDate || new Date(now);
      const end = endDate || new Date(now);

      if (!startDate || !endDate) {
        // Default to last 30 days
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      }

      // Fetch reservation analytics from the API
      const response = await fetch(
        `/api/analytics/reservations?startDate=${start.toISOString()}&endDate=${end.toISOString()}&groupBy=${groupBy}${restaurantId ? `&restaurantId=${restaurantId}` : ''}${status ? `&status=${status}` : ''}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reservation analytics');
      }

      const result = await response.json();
      const reservationData = result.data.trends || [];
      const statusDist = result.data.statusDistribution || [];
      const partySizeDist = result.data.partySizeDistribution || [];
      const sourceDist = result.data.sourceDistribution || [];

      setData(reservationData);
      setStatusDistribution(statusDist);
      setPartySizeDistribution(partySizeDist);
      setSourceDistribution(sourceDist);

      // Calculate summary
      if (reservationData.length > 0) {
        const totalReservations = reservationData.reduce((sum: number, d: ReservationData) => sum + d.total, 0);
        const confirmedReservations = reservationData.reduce((sum: number, d: ReservationData) => sum + (d.confirmed || 0), 0);
        const completedReservations = reservationData.reduce((sum: number, d: ReservationData) => sum + (d.completed || 0), 0);
        const cancelledReservations = reservationData.reduce((sum: number, d: ReservationData) => sum + (d.cancelled || 0), 0);
        const noShowReservations = reservationData.reduce((sum: number, d: ReservationData) => sum + (d.noShow || 0), 0);

        const confirmationRate = totalReservations > 0 ? (confirmedReservations / totalReservations) * 100 : 0;
        const completionRate = totalReservations > 0 ? (completedReservations / totalReservations) * 100 : 0;
        const cancellationRate = totalReservations > 0 ? (cancelledReservations / totalReservations) * 100 : 0;
        const noShowRate = totalReservations > 0 ? (noShowReservations / totalReservations) * 100 : 0;

        setSummary({
          totalReservations,
          confirmedReservations,
          completedReservations,
          cancelledReservations,
          noShowReservations,
          confirmationRate,
          completionRate,
          cancellationRate,
          noShowRate,
        });
      } else {
        setSummary(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, restaurantId, status, groupBy]);

  const refresh = useCallback(async () => {
    await fetchReservationData();
  }, [fetchReservationData]);

  // Initial fetch
  useEffect(() => {
    fetchReservationData();
  }, [fetchReservationData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchReservationData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchReservationData]);

  return {
    data,
    loading,
    error,
    refresh,
    statusDistribution,
    partySizeDistribution,
    sourceDistribution,
    summary,
  };
};