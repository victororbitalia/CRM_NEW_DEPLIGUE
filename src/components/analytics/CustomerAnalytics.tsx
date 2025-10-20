import React, { useState } from 'react';
import Card from '@/components/ui/Card';

interface CustomerData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isVip: boolean;
  totalReservations: number;
  totalGuests: number;
  avgPartySize: number;
  lastVisit: string;
  completedReservations: number;
}

interface CustomerSegment {
  segment: string;
  count: number;
  percentage: number;
}

interface CustomerBehavior {
  timeOfDay: string;
  dayOfWeek: string;
  uniqueCustomers: number;
  totalReservations: number;
  avgPartySize: number;
}

interface CustomerAnalyticsProps {
  topCustomers: CustomerData[];
  segmentation: Record<string, any>;
  behavior: CustomerBehavior[];
  retention: Record<string, any>;
  preferences: Array<{ occasion: string; uniqueCustomers: number; totalReservations: number }>;
  churn: Array<{ activityStatus: string; customerCount: number; percentage: number }>;
  loading?: boolean;
  className?: string;
}

export const CustomerAnalytics: React.FC<CustomerAnalyticsProps> = ({
  topCustomers,
  segmentation,
  behavior,
  retention,
  preferences,
  churn,
  loading = false,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'segments' | 'behavior' | 'retention'>('overview');

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900">
            {segmentation.totalCustomers || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-600">VIP Customers</p>
          <p className="text-2xl font-bold text-purple-600">
            {segmentation.vipCustomers || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-600">New Customers</p>
          <p className="text-2xl font-bold text-blue-600">
            {segmentation.newCustomers || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Retention Rate</p>
          <p className="text-2xl font-bold text-green-600">
            {segmentation.retentionRate ? `${segmentation.retentionRate}%` : '0%'}
          </p>
        </div>
      </div>

      {/* Top Customers Table */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Customers by Reservations</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reservations
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Guests
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Party Size
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Visit
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topCustomers.slice(0, 10).map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.firstName} {customer.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                        {customer.isVip && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            VIP
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.totalReservations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.totalGuests}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.avgPartySize?.toFixed(1) || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(customer.lastVisit).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSegments = () => (
    <div className="space-y-6">
      {/* Customer Segments */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Segments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">New Customers</h4>
            <p className="text-2xl font-bold text-blue-600">{segmentation.newCustomers || 0}</p>
            <p className="text-sm text-gray-500">
              {((segmentation.newCustomers || 0) / (segmentation.totalCustomers || 1) * 100).toFixed(1)}% of total
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Occasional Customers</h4>
            <p className="text-2xl font-bold text-yellow-600">{segmentation.occasionalCustomers || 0}</p>
            <p className="text-sm text-gray-500">
              {((segmentation.occasionalCustomers || 0) / (segmentation.totalCustomers || 1) * 100).toFixed(1)}% of total
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Regular Customers</h4>
            <p className="text-2xl font-bold text-green-600">{segmentation.regularCustomers || 0}</p>
            <p className="text-sm text-gray-500">
              {((segmentation.regularCustomers || 0) / (segmentation.totalCustomers || 1) * 100).toFixed(1)}% of total
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Loyal Customers</h4>
            <p className="text-2xl font-bold text-purple-600">{segmentation.loyalCustomers || 0}</p>
            <p className="text-sm text-gray-500">
              {((segmentation.loyalCustomers || 0) / (segmentation.totalCustomers || 1) * 100).toFixed(1)}% of total
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">VIP Customers</h4>
            <p className="text-2xl font-bold text-indigo-600">{segmentation.vipCustomers || 0}</p>
            <p className="text-sm text-gray-500">
              {((segmentation.vipCustomers || 0) / (segmentation.totalCustomers || 1) * 100).toFixed(1)}% of total
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">At Risk Customers</h4>
            <p className="text-2xl font-bold text-red-600">{segmentation.atRiskCustomers || 0}</p>
            <p className="text-sm text-gray-500">
              {((segmentation.atRiskCustomers || 0) / (segmentation.totalCustomers || 1) * 100).toFixed(1)}% of total
            </p>
          </div>
        </div>
      </div>

      {/* Customer Preferences */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Preferences</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Occasion
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unique Customers
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Reservations
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Reservations per Customer
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {preferences.map((preference, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {preference.occasion || 'Regular'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {preference.uniqueCustomers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {preference.totalReservations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(preference.totalReservations / preference.uniqueCustomers).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBehavior = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Behavior Patterns</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Period
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Day
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unique Customers
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Reservations
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Party Size
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {behavior.slice(0, 10).map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.timeOfDay}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.dayOfWeek}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.uniqueCustomers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.totalReservations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.avgPartySize?.toFixed(1) || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRetention = () => (
    <div className="space-y-6">
      {/* Retention Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Returning Customers</p>
          <p className="text-2xl font-bold text-green-600">
            {retention.totalReturningCustomers || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Avg Visits per Customer</p>
          <p className="text-2xl font-bold text-blue-600">
            {retention.avgVisitsPerCustomer?.toFixed(1) || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Avg Customer Lifespan</p>
          <p className="text-2xl font-bold text-purple-600">
            {retention.avgCustomerLifespanDays?.toFixed(0) || 0} days
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Single Visit Customers</p>
          <p className="text-2xl font-bold text-yellow-600">
            {retention.singleVisitCustomers || 0}
          </p>
        </div>
      </div>

      {/* Customer Churn Analysis */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Churn Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {churn.map((item, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-600 mb-2">{item.activityStatus}</h4>
              <p className="text-2xl font-bold text-gray-900">{item.customerCount}</p>
              <p className="text-sm text-gray-500">{item.percentage}% of total</p>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Customer Analytics</h3>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'segments', label: 'Segments' },
            { key: 'behavior', label: 'Behavior' },
            { key: 'retention', label: 'Retention' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'segments' && renderSegments()}
        {activeTab === 'behavior' && renderBehavior()}
        {activeTab === 'retention' && renderRetention()}
      </div>
    </Card>
  );
};

export default CustomerAnalytics;