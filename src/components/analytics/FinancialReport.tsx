import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

interface RevenueData {
  period: string;
  revenue: number;
  totalReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  noShowReservations: number;
}

interface PaymentStatusData {
  paymentStatus: string;
  count: number;
  totalAmount: number;
  avgAmount: number;
}

interface RevenueByAreaData {
  id: string;
  name: string;
  revenue: number;
  totalReservations: number;
  completedReservations: number;
  avgDepositAmount: number;
  totalGuests: number;
  avgPartySize: number;
}

interface FinancialSummary {
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
}

interface FinancialReportProps {
  summary: FinancialSummary;
  trends: RevenueData[];
  paymentStatus: PaymentStatusData[];
  revenueByArea: RevenueByAreaData[];
  revenueByPartySize: Array<{
    partySize: number;
    revenue: number;
    totalReservations: number;
    completedReservations: number;
  }>;
  revenueByTimeSlot: Array<{
    timeSlot: string;
    revenue: number;
    totalReservations: number;
    avgPartySize: number;
  }>;
  revenueByDayOfWeek: Array<{
    dayOfWeek: string;
    revenue: number;
    totalReservations: number;
    avgPartySize: number;
  }>;
  depositAnalysis: Record<string, any>;
  cancellationImpact: Array<{
    cancellationReason: string;
    lostDeposits: number;
    totalCancelled: number;
  }>;
  noShowImpact: Record<string, any>;
  loading?: boolean;
  className?: string;
}

export const FinancialReport: React.FC<FinancialReportProps> = ({
  summary,
  trends,
  paymentStatus,
  revenueByArea,
  revenueByPartySize,
  revenueByTimeSlot,
  revenueByDayOfWeek,
  depositAnalysis,
  cancellationImpact,
  noShowImpact,
  loading = false,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'payments' | 'analysis'>('overview');

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.totalRevenue || 0)}
          </p>
          <p className="text-sm text-gray-500">
            From {summary.completedReservations || 0} completed reservations
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Potential Revenue</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(summary.totalPotentialRevenue || 0)}
          </p>
          <p className="text-sm text-gray-500">
            Including cancelled and no-show
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Avg Revenue per Reservation</p>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(summary.avgRevenuePerCompletedReservation || 0)}
          </p>
          <p className="text-sm text-gray-500">
            Per completed reservation
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Completion Rate</p>
          <p className="text-2xl font-bold text-green-600">
            {summary.completionRate ? `${summary.completionRate}%` : '0%'}
          </p>
          <p className="text-sm text-gray-500">
            {summary.cancellationRate ? `${summary.cancellationRate}%` : '0%'} cancelled
          </p>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="h-64">
            {/* Simple Chart Visualization */}
            <div className="h-full flex items-end justify-between space-x-2">
              {trends.slice(-12).map((trend, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{
                      height: `${(trend.revenue / Math.max(...trends.map(t => t.revenue), 1)) * 100}%`
                    }}
                  ></div>
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    {trend.period}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Revenue Areas */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Area</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {revenueByArea.slice(0, 6).map((area, index) => (
            <div key={area.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">{area.name}</h4>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(area.revenue)}
              </p>
              <p className="text-sm text-gray-500">
                {area.completedReservations} completed reservations
              </p>
              <p className="text-sm text-gray-500">
                Avg party size: {area.avgPartySize?.toFixed(1) || 0}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRevenue = () => (
    <div className="space-y-6">
      {/* Revenue by Party Size */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Party Size</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Party Size
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Reservations
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed Reservations
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue per Completed
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {revenueByPartySize.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.partySize} {item.partySize === 1 ? 'Person' : 'People'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.totalReservations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.completedReservations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.revenue / Math.max(item.completedReservations, 1))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue by Time Slot */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Time Slot</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {revenueByTimeSlot.map((slot, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-600 mb-2">{slot.timeSlot}</h4>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(slot.revenue)}
              </p>
              <p className="text-sm text-gray-500">
                {slot.totalReservations} reservations
              </p>
              <p className="text-sm text-gray-500">
                Avg party size: {slot.avgPartySize?.toFixed(1) || 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue by Day of Week */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Day of Week</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {revenueByDayOfWeek.map((day, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-600 mb-2">{day.dayOfWeek}</h4>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(day.revenue)}
              </p>
              <p className="text-sm text-gray-500">
                {day.totalReservations} reservations
              </p>
              <p className="text-sm text-gray-500">
                Avg party size: {day.avgPartySize?.toFixed(1) || 0}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6">
      {/* Payment Status */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentStatus.map((status, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-600 mb-2">{status.paymentStatus}</h4>
              <p className="text-xl font-bold text-gray-900">{status.count}</p>
              <p className="text-sm text-gray-500">
                {formatCurrency(status.totalAmount)}
              </p>
              <p className="text-sm text-gray-500">
                Avg: {formatCurrency(status.avgAmount)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Deposit Analysis */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Deposit Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Total Reservations</h4>
            <p className="text-xl font-bold text-gray-900">{depositAnalysis.totalReservations || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">With Deposit</h4>
            <p className="text-xl font-bold text-blue-600">{depositAnalysis.reservationsWithDeposit || 0}</p>
            <p className="text-sm text-gray-500">
              {depositAnalysis.depositRate ? `${depositAnalysis.depositRate}%` : '0%'} of total
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Paid Deposits</h4>
            <p className="text-xl font-bold text-green-600">{depositAnalysis.paidDeposits || 0}</p>
            <p className="text-sm text-gray-500">
              {depositAnalysis.paymentRate ? `${depositAnalysis.paymentRate}%` : '0%'} payment rate
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Total Deposit Amount</h4>
            <p className="text-xl font-bold text-purple-600">
              {formatCurrency(depositAnalysis.totalDepositAmount || 0)}
            </p>
            <p className="text-sm text-gray-500">
              Avg: {formatCurrency(depositAnalysis.avgDepositAmount || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalysis = () => (
    <div className="space-y-6">
      {/* Cancellation Impact */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cancellation Financial Impact</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cancellation Reason
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cancelled
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lost Deposits
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unpaid Deposits
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Deposits
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cancellationImpact.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.cancellationReason || 'No reason provided'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.totalCancelled}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.lostDeposits)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(0)} {/* This would need to be added to the API response */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(0)} {/* This would need to be added to the API response */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No-Show Impact */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">No-Show Financial Impact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Total No-Shows</h4>
            <p className="text-xl font-bold text-red-600">{noShowImpact.totalNoShows || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Lost Deposits</h4>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(noShowImpact.lostDeposits || 0)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Unpaid Deposits</h4>
            <p className="text-xl font-bold text-yellow-600">
              {formatCurrency(noShowImpact.unpaidDeposits || 0)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Unique Customers Affected</h4>
            <p className="text-xl font-bold text-gray-900">
              {noShowImpact.uniqueCustomersAffected || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Financial Performance Summary */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Summary</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">Revenue Recovery Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {((summary.totalRevenue / Math.max(summary.totalPotentialRevenue, 1)) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">
                {formatCurrency(summary.totalRevenue)} of {formatCurrency(summary.totalPotentialRevenue)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">Revenue per Guest</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(summary.avgRevenuePerGuest || 0)}
              </p>
              <p className="text-sm text-gray-500">
                Average revenue per guest
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">Completion vs Cancellation</p>
              <p className="text-2xl font-bold text-blue-600">
                {((summary.completedReservations / Math.max(summary.totalReservations, 1)) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">
                {summary.completedReservations} of {summary.totalReservations}
              </p>
            </div>
          </div>
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
        <h3 className="text-lg font-medium text-gray-900">Financial Report</h3>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'revenue', label: 'Revenue Analysis' },
            { key: 'payments', label: 'Payments' },
            { key: 'analysis', label: 'Financial Analysis' },
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
        {activeTab === 'revenue' && renderRevenue()}
        {activeTab === 'payments' && renderPayments()}
        {activeTab === 'analysis' && renderAnalysis()}
      </div>
    </Card>
  );
};

export default FinancialReport;