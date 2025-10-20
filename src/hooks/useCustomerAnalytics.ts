import { useState, useEffect, useCallback } from 'react';

interface CustomerData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isVip: boolean;
  totalReservations: number;
  totalGuests: number;
  avgPartySize: number;
  completedReservations: number;
  lastVisit: string;
}

interface UseCustomerAnalyticsOptions {
  startDate?: Date;
  endDate?: Date;
  restaurantId?: string;
  segment?: 'new' | 'returning' | 'vip' | 'at-risk';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseCustomerAnalyticsReturn {
  data: CustomerData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  segmentation: {
    totalCustomers: number;
    vipCustomers: number;
    newCustomers: number;
    occasionalCustomers: number;
    regularCustomers: number;
    loyalCustomers: number;
    atRiskCustomers: number;
    retentionRate: number;
    avgVisitsPerCustomer: number;
    avgCustomerLifespanDays: number;
  } | null;
  behavior: Array<{
    timeOfDay: string;
    dayOfWeek: string;
    uniqueCustomers: number;
    totalReservations: number;
    avgPartySize: number;
  }> | null;
  preferences: Array<{
    occasion: string;
    uniqueCustomers: number;
    totalReservations: number;
    avgPartySize: number;
  }> | null;
  churn: Array<{
    activityStatus: string;
    customerCount: number;
    percentage: number;
    avgVisits: number;
  }> | null;
  topCustomers: CustomerData[];
  topCustomersBySpending: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    totalReservations: number;
    totalSpent: number;
    avgSpentPerVisit: number;
    lastVisit: string;
  }> | null;
}

export const useCustomerAnalytics = ({
  startDate,
  endDate,
  restaurantId,
  segment,
  autoRefresh = false,
  refreshInterval = 10 * 60 * 1000, // 10 minutes
}: UseCustomerAnalyticsOptions = {}): UseCustomerAnalyticsReturn => {
  const [data, setData] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [segmentation, setSegmentation] = useState<UseCustomerAnalyticsReturn['segmentation']>(null);
  const [behavior, setBehavior] = useState<UseCustomerAnalyticsReturn['behavior']>(null);
  const [preferences, setPreferences] = useState<UseCustomerAnalyticsReturn['preferences']>(null);
  const [churn, setChurn] = useState<UseCustomerAnalyticsReturn['churn']>(null);
  const [topCustomers, setTopCustomers] = useState<CustomerData[]>([]);
  const [topCustomersBySpending, setTopCustomersBySpending] = useState<UseCustomerAnalyticsReturn['topCustomersBySpending']>(null);

  const fetchCustomerData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Set default date range if not provided
      const now = new Date();
      const start = startDate || new Date(now);
      const end = endDate || new Date(now);

      if (!startDate || !endDate) {
        // Default to last 90 days for customer analytics
        start.setDate(now.getDate() - 90);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      }

      // Fetch customer analytics from the API
      const response = await fetch(
        `/api/analytics/customers?startDate=${start.toISOString()}&endDate=${end.toISOString()}${restaurantId ? `&restaurantId=${restaurantId}` : ''}${segment ? `&segment=${segment}` : ''}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch customer analytics');
      }

      const result = await response.json();
      const customerSegmentation = result.data.segmentation;
      const customerBehavior = result.data.behavior;
      const customerPreferences = result.data.preferences;
      const customerChurn = result.data.churn;
      const topCustomersData = result.data.topCustomers.byReservations || [];
      const topCustomersSpendingData = result.data.topCustomers.bySpending || [];

      // Format top customers data
      const formattedTopCustomers = topCustomersData.map((customer: any) => ({
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        isVip: customer.isVip,
        totalReservations: customer.totalReservations,
        totalGuests: customer.totalGuests,
        avgPartySize: customer.avgPartySize,
        completedReservations: customer.completedReservations,
        lastVisit: customer.lastVisit,
      }));

      // Format top customers by spending data
      const formattedTopCustomersBySpending = topCustomersSpendingData.map((customer: any) => ({
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        totalReservations: customer.totalReservations,
        totalSpent: customer.totalSpent,
        avgSpentPerVisit: customer.avgSpentPerVisit,
        lastVisit: customer.lastVisit,
      }));

      setData(formattedTopCustomers);
      setTopCustomers(formattedTopCustomers);
      setTopCustomersBySpending(formattedTopCustomersBySpending);
      setSegmentation(customerSegmentation);
      setBehavior(customerBehavior);
      setPreferences(customerPreferences);
      setChurn(customerChurn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, restaurantId, segment]);

  const refresh = useCallback(async () => {
    await fetchCustomerData();
  }, [fetchCustomerData]);

  // Initial fetch
  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchCustomerData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchCustomerData]);

  return {
    data,
    loading,
    error,
    refresh,
    segmentation,
    behavior,
    preferences,
    churn,
    topCustomers,
    topCustomersBySpending,
  };
};