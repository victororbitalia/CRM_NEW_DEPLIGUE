import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';

interface OccupancyData {
  period: string;
  occupancyRate: number;
  totalTables: number;
  occupiedTables: number;
  capacityUtilization?: number;
}

interface UseOccupancyDataOptions {
  startDate?: Date;
  endDate?: Date;
  restaurantId?: string;
  areaId?: string;
  groupBy?: 'day' | 'week' | 'month';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseOccupancyDataReturn {
  data: OccupancyData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  summary: {
    avgOccupancyRate: number;
    peakOccupancyRate: number;
    lowestOccupancyRate: number;
    totalTables: number;
  } | null;
}

export const useOccupancyData = ({
  startDate,
  endDate,
  restaurantId,
  areaId,
  groupBy = 'day',
  autoRefresh = false,
  refreshInterval = 5 * 60 * 1000, // 5 minutes
}: UseOccupancyDataOptions = {}): UseOccupancyDataReturn => {
  const [data, setData] = useState<OccupancyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<UseOccupancyDataReturn['summary']>(null);

  const fetchOccupancyData = useCallback(async () => {
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

      // Calculate date format based on groupBy
      let dateFormat;
      switch (groupBy) {
        case 'week':
          dateFormat = "%Y-%W";
          break;
        case 'month':
          dateFormat = "%Y-%m";
          break;
        case 'day':
        default:
          dateFormat = "%Y-%m-%d";
          break;
      }

      // Fetch occupancy trends from the API
      const response = await fetch(
        `/api/analytics/occupancy?startDate=${start.toISOString()}&endDate=${end.toISOString()}&groupBy=${groupBy}${restaurantId ? `&restaurantId=${restaurantId}` : ''}${areaId ? `&areaId=${areaId}` : ''}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch occupancy data');
      }

      const result = await response.json();
      const occupancyData = result.data.occupancyTrends || [];

      setData(occupancyData);

      // Calculate summary
      if (occupancyData.length > 0) {
        const occupancyRates = occupancyData.map((d: OccupancyData) => d.occupancyRate);
        const avgOccupancyRate = occupancyRates.reduce((sum: number, rate: number) => sum + rate, 0) / occupancyRates.length;
        const peakOccupancyRate = Math.max(...occupancyRates);
        const lowestOccupancyRate = Math.min(...occupancyRates);
        const totalTables = occupancyData[0]?.totalTables || 0;

        setSummary({
          avgOccupancyRate,
          peakOccupancyRate,
          lowestOccupancyRate,
          totalTables,
        });
      } else {
        setSummary(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, restaurantId, areaId, groupBy]);

  const refresh = useCallback(async () => {
    await fetchOccupancyData();
  }, [fetchOccupancyData]);

  // Initial fetch
  useEffect(() => {
    fetchOccupancyData();
  }, [fetchOccupancyData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchOccupancyData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchOccupancyData]);

  return {
    data,
    loading,
    error,
    refresh,
    summary,
  };
};