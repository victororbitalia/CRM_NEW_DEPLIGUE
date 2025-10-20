import { useState, useEffect, useCallback } from 'react';

interface FinancialData {
  period: string;
  revenue: number;
  totalReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  noShowReservations: number;
  totalDeposits: number;
  paidDeposits: number;
  avgDepositAmount: number;
  avgPartySize: number;
}

interface UseFinancialAnalyticsOptions {
  startDate?: Date;
  endDate?: Date;
  restaurantId?: string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseFinancialAnalyticsReturn {
  data: FinancialData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  summary: {
    totalReservations: number;
    completedReservations: number;
    cancelledReservations: number;
    noShowReservations: number;
    totalRevenue: number;
    totalPotentialRevenue: number;
    avgRevenuePerCompletedReservation: number;
    avgRevenuePerGuest: number;
    completionRate: number;
    cancellationRate: number;
    noShowRate: number;
  } | null;
  paymentStatus: Array<{
    paymentStatus: string;
    count: number;
    totalAmount: number;
    avgAmount: number;
  }> | null;
  revenueByArea: Array<{
    id: string;
    name: string;
    revenue: number;
    totalReservations: number;
    completedReservations: number;
    avgDepositAmount: number;
    totalGuests: number;
    avgPartySize: number;
  }> | null;
  revenueByPartySize: Array<{
    partySize: number;
    revenue: number;
    totalReservations: number;
    completedReservations: number;
    revenuePerCompletedReservation: number;
  }> | null;
  revenueByTimeSlot: Array<{
    timeSlot: string;
    revenue: number;
    totalReservations: number;
    avgPartySize: number;
  }> | null;
  revenueByDayOfWeek: Array<{
    dayOfWeek: string;
    revenue: number;
    totalReservations: number;
    avgPartySize: number;
  }> | null;
  depositAnalysis: {
    totalReservations: number;
    reservationsWithDeposit: number;
    paidDeposits: number;
    unpaidDeposits: number;
    totalDepositAmount: number;
    paidDepositAmount: number;
    unpaidDepositAmount: number;
    avgDepositAmount: number;
    depositRate: number;
    paymentRate: number;
  } | null;
  cancellationImpact: Array<{
    cancellationReason: string;
    lostDeposits: number;
    totalCancelled: number;
    unpaidDeposits: number;
    paidDeposits: number;
  }> | null;
  noShowImpact: {
    totalNoShows: number;
    lostDeposits: number;
    unpaidDeposits: number;
    paidDeposits: number;
    uniqueCustomersAffected: number;
  } | null;
}

export const useFinancialAnalytics = ({
  startDate,
  endDate,
  restaurantId,
  groupBy = 'month',
  autoRefresh = false,
  refreshInterval = 15 * 60 * 1000, // 15 minutes
}: UseFinancialAnalyticsOptions = {}): UseFinancialAnalyticsReturn => {
  const [data, setData] = useState<FinancialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<UseFinancialAnalyticsReturn['summary']>(null);
  const [paymentStatus, setPaymentStatus] = useState<UseFinancialAnalyticsReturn['paymentStatus']>(null);
  const [revenueByArea, setRevenueByArea] = useState<UseFinancialAnalyticsReturn['revenueByArea']>(null);
  const [revenueByPartySize, setRevenueByPartySize] = useState<UseFinancialAnalyticsReturn['revenueByPartySize']>(null);
  const [revenueByTimeSlot, setRevenueByTimeSlot] = useState<UseFinancialAnalyticsReturn['revenueByTimeSlot']>(null);
  const [revenueByDayOfWeek, setRevenueByDayOfWeek] = useState<UseFinancialAnalyticsReturn['revenueByDayOfWeek']>(null);
  const [depositAnalysis, setDepositAnalysis] = useState<UseFinancialAnalyticsReturn['depositAnalysis']>(null);
  const [cancellationImpact, setCancellationImpact] = useState<UseFinancialAnalyticsReturn['cancellationImpact']>(null);
  const [noShowImpact, setNoShowImpact] = useState<UseFinancialAnalyticsReturn['noShowImpact']>(null);

  const fetchFinancialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Set default date range if not provided
      const now = new Date();
      const start = startDate || new Date(now);
      const end = endDate || new Date(now);

      if (!startDate || !endDate) {
        // Default to last 12 months for financial analytics
        start.setFullYear(now.getFullYear() - 1);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      }

      // Fetch financial analytics from the API
      const response = await fetch(
        `/api/analytics/financial?startDate=${start.toISOString()}&endDate=${end.toISOString()}&groupBy=${groupBy}${restaurantId ? `&restaurantId=${restaurantId}` : ''}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch financial analytics');
      }

      const result = await response.json();
      const financialSummary = result.data.summary;
      const financialTrends = result.data.trends || [];
      const paymentStatusData = result.data.paymentStatus || [];
      const revenueByAreaData = result.data.revenueByArea || [];
      const revenueByPartySizeData = result.data.revenueByPartySize || [];
      const revenueByTimeSlotData = result.data.revenueByTimeSlot || [];
      const revenueByDayOfWeekData = result.data.revenueByDayOfWeek || [];
      const depositAnalysisData = result.data.depositAnalysis;
      const cancellationImpactData = result.data.cancellationImpact || [];
      const noShowImpactData = result.data.noShowImpact;

      // Format trend data
      const formattedTrends = financialTrends.map((trend: any) => ({
        period: trend.period,
        revenue: trend.revenue,
        totalReservations: trend.totalReservations,
        completedReservations: trend.completedReservations,
        cancelledReservations: trend.cancelledReservations,
        noShowReservations: trend.noShowReservations,
        totalDeposits: trend.totalDeposits,
        paidDeposits: trend.paidDeposits,
        avgDepositAmount: trend.avgDepositAmount,
        avgPartySize: trend.avgPartySize,
      }));

      setData(formattedTrends);
      setSummary(financialSummary);
      setPaymentStatus(paymentStatusData);
      setRevenueByArea(revenueByAreaData);
      setRevenueByPartySize(revenueByPartySizeData);
      setRevenueByTimeSlot(revenueByTimeSlotData);
      setRevenueByDayOfWeek(revenueByDayOfWeekData);
      setDepositAnalysis(depositAnalysisData);
      setCancellationImpact(cancellationImpactData);
      setNoShowImpact(noShowImpactData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, restaurantId, groupBy]);

  const refresh = useCallback(async () => {
    await fetchFinancialData();
  }, [fetchFinancialData]);

  // Initial fetch
  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchFinancialData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchFinancialData]);

  return {
    data,
    loading,
    error,
    refresh,
    summary,
    paymentStatus,
    revenueByArea,
    revenueByPartySize,
    revenueByTimeSlot,
    revenueByDayOfWeek,
    depositAnalysis,
    cancellationImpact,
    noShowImpact,
  };
};