import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

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

interface PredictionData {
  date: string;
  predictedReservations: number;
  predictedRevenue: number;
  predictedGuests: number;
  confidence: 'low' | 'medium' | 'high';
}

interface GrowthRate {
  month: string;
  reservations: number;
  revenue: number;
  reservationGrowthRate: number;
  revenueGrowthRate: number;
}

interface PeakDemand {
  hour: string;
  dayOfWeek: string;
  reservationCount: number;
  totalGuests: number;
  occupiedTables: number;
}

interface TrendAnalysisProps {
  historicalData: HistoricalData[];
  patterns: {
    dayOfWeek: Array<{
      dayOfWeek: string;
      totalReservations: number;
      completedReservations: number;
      revenue: number;
      totalGuests: number;
      avgPartySize: number;
      occupiedTables: number;
    }>;
    monthly: Array<{
      month: string;
      totalReservations: number;
      completedReservations: number;
      revenue: number;
      totalGuests: number;
      avgPartySize: number;
      occupiedTables: number;
    }>;
    seasonal: Array<{
      quarter: string;
      totalReservations: number;
      completedReservations: number;
      revenue: number;
      totalGuests: number;
      avgPartySize: number;
      occupiedTables: number;
    }>;
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
  growthRates: GrowthRate[];
  peakDemandPeriods: PeakDemand[];
  trendAnalysis: {
    dataPoints: number;
    minReservations: number;
    maxReservations: number;
    avgReservations: number;
    minRevenue: number;
    maxRevenue: number;
    avgRevenue: number;
    reservationTrend: 'increasing' | 'decreasing' | 'stable';
    revenueTrend: 'increasing' | 'decreasing' | 'stable';
  };
  loading?: boolean;
  className?: string;
}

export const TrendAnalysis: React.FC<TrendAnalysisProps> = ({
  historicalData,
  patterns,
  predictions,
  growthRates,
  peakDemandPeriods,
  trendAnalysis,
  loading = false,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'predictions' | 'growth'>('overview');
  const [selectedMetric, setSelectedMetric] = useState<'reservations' | 'revenue'>('reservations');

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Trend Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Reservation Trend</p>
          <div className="flex items-center mt-2">
            {trendAnalysis.reservationTrend === 'increasing' && (
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            )}
            {trendAnalysis.reservationTrend === 'decreasing' && (
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            )}
            {trendAnalysis.reservationTrend === 'stable' && (
              <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M5 12h14" />
              </svg>
            )}
            <p className="text-xl font-bold text-gray-900 capitalize">
              {trendAnalysis.reservationTrend}
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Avg: {trendAnalysis.avgReservations?.toFixed(1) || 0} reservations/day
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Revenue Trend</p>
          <div className="flex items-center mt-2">
            {trendAnalysis.revenueTrend === 'increasing' && (
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            )}
            {trendAnalysis.revenueTrend === 'decreasing' && (
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            )}
            {trendAnalysis.revenueTrend === 'stable' && (
              <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M5 12h14" />
              </svg>
            )}
            <p className="text-xl font-bold text-gray-900 capitalize">
              {trendAnalysis.revenueTrend}
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Avg: {formatCurrency(trendAnalysis.avgRevenue || 0)}/day
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Peak Demand</p>
          <p className="text-xl font-bold text-purple-600">
            {peakDemandPeriods[0]?.dayOfWeek || 'N/A'}
          </p>
          <p className="text-sm text-gray-500">
            {peakDemandPeriods[0]?.hour || 'N/A'} - {peakDemandPeriods[0]?.reservationCount || 0} reservations
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Growth Rate</p>
          <p className="text-xl font-bold text-blue-600">
            {growthRates[growthRates.length - 2]?.reservationGrowthRate?.toFixed(1) || 0}%
          </p>
          <p className="text-sm text-gray-500">
            Month over month
          </p>
        </div>
      </div>

      {/* Historical Trend Chart */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Historical Trends</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedMetric('reservations')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                selectedMetric === 'reservations'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Reservations
            </button>
            <button
              onClick={() => setSelectedMetric('revenue')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                selectedMetric === 'revenue'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Revenue
            </button>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="h-64">
            {/* Simple Chart Visualization */}
            <div className="h-full flex items-end justify-between space-x-2">
              {historicalData.slice(-30).map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{
                      height: `${
                        selectedMetric === 'reservations'
                          ? (data.totalReservations / Math.max(...historicalData.map(d => d.totalReservations), 1)) * 100
                          : (data.revenue / Math.max(...historicalData.map(d => d.revenue), 1)) * 100
                      }%`
                    }}
                  ></div>
                  <div className="text-xs text-gray-500 mt-1 text-center transform rotate-45 origin-left">
                    {new Date(data.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Growth Rates */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Growth Rates</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reservations
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth Rate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {growthRates.slice(-6).map((rate, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {rate.month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rate.reservations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      rate.reservationGrowthRate > 0
                        ? 'bg-green-100 text-green-800'
                        : rate.reservationGrowthRate < 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rate.reservationGrowthRate > 0 && '+'}
                      {rate.reservationGrowthRate?.toFixed(1) || 0}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(rate.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      rate.revenueGrowthRate > 0
                        ? 'bg-green-100 text-green-800'
                        : rate.revenueGrowthRate < 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rate.revenueGrowthRate > 0 && '+'}
                      {rate.revenueGrowthRate?.toFixed(1) || 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPatterns = () => (
    <div className="space-y-6">
      {/* Day of Week Patterns */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Day of Week Patterns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {patterns.dayOfWeek.map((pattern, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-600 mb-2">{pattern.dayOfWeek}</h4>
              <p className="text-xl font-bold text-blue-600">{pattern.totalReservations}</p>
              <p className="text-sm text-gray-500">
                {formatCurrency(pattern.revenue)} revenue
              </p>
              <p className="text-sm text-gray-500">
                Avg party size: {pattern.avgPartySize?.toFixed(1) || 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Patterns */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Patterns</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
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
                  Avg Party Size
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patterns.monthly.map((pattern, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(2000, parseInt(pattern.month) - 1, 1).toLocaleDateString('en-US', { month: 'long' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pattern.totalReservations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pattern.completedReservations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(pattern.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pattern.avgPartySize?.toFixed(1) || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seasonal Patterns */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Seasonal Patterns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {patterns.seasonal.map((pattern, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-600 mb-2">{pattern.quarter}</h4>
              <p className="text-xl font-bold text-blue-600">{pattern.totalReservations}</p>
              <p className="text-sm text-gray-500">
                {formatCurrency(pattern.revenue)} revenue
              </p>
              <p className="text-sm text-gray-500">
                Avg party size: {pattern.avgPartySize?.toFixed(1) || 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Peak Demand Periods */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Peak Demand Periods</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {peakDemandPeriods.slice(0, 9).map((period, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                {period.dayOfWeek} at {period.hour}:00
              </h4>
              <p className="text-xl font-bold text-purple-600">{period.reservationCount}</p>
              <p className="text-sm text-gray-500">
                {period.totalGuests} total guests
              </p>
              <p className="text-sm text-gray-500">
                {period.occupiedTables} tables occupied
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPredictions = () => (
    <div className="space-y-6">
      {/* Moving Average Predictions */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Moving Average Predictions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actual Reservations
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Predicted Reservations
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actual Revenue
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Predicted Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {predictions.movingAverage.slice(0, 7).map((prediction, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(prediction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {prediction.reservations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                    {prediction.predictedReservations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(prediction.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                    {formatCurrency(prediction.predictedRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Future Predictions */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Future Predictions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {predictions.forecast.slice(0, 12).map((prediction, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                {new Date(prediction.date).toLocaleDateString()}
              </h4>
              <p className="text-xl font-bold text-blue-600">{prediction.predictedReservations}</p>
              <p className="text-sm text-gray-500">
                {formatCurrency(prediction.predictedRevenue)} revenue
              </p>
              <p className="text-sm text-gray-500">
                {prediction.predictedGuests} guests
              </p>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  prediction.confidence === 'high'
                    ? 'bg-green-100 text-green-800'
                    : prediction.confidence === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {prediction.confidence} confidence
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGrowth = () => (
    <div className="space-y-6">
      {/* Trend Analysis Summary */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Trend Analysis Summary</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Reservation Trends</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Data Points:</span>
                  <span className="text-sm font-medium">{trendAnalysis.dataPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Minimum:</span>
                  <span className="text-sm font-medium">{trendAnalysis.minReservations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Maximum:</span>
                  <span className="text-sm font-medium">{trendAnalysis.maxReservations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Average:</span>
                  <span className="text-sm font-medium">{trendAnalysis.avgReservations?.toFixed(1) || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Trend:</span>
                  <span className={`text-sm font-medium capitalize ${
                    trendAnalysis.reservationTrend === 'increasing' ? 'text-green-600' :
                    trendAnalysis.reservationTrend === 'decreasing' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {trendAnalysis.reservationTrend}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Revenue Trends</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Minimum:</span>
                  <span className="text-sm font-medium">{formatCurrency(trendAnalysis.minRevenue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Maximum:</span>
                  <span className="text-sm font-medium">{formatCurrency(trendAnalysis.maxRevenue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Average:</span>
                  <span className="text-sm font-medium">{formatCurrency(trendAnalysis.avgRevenue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Trend:</span>
                  <span className={`text-sm font-medium capitalize ${
                    trendAnalysis.revenueTrend === 'increasing' ? 'text-green-600' :
                    trendAnalysis.revenueTrend === 'decreasing' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {trendAnalysis.revenueTrend}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Rate Chart */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Growth Rate Trends</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="h-64">
            {/* Simple Chart Visualization */}
            <div className="h-full flex items-end justify-between space-x-2">
              {growthRates.slice(-12).map((rate, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{
                      height: `${Math.abs(rate.reservationGrowthRate) * 5}%`
                    }}
                  ></div>
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    {rate.month}
                  </div>
                </div>
              ))}
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
        <h3 className="text-lg font-medium text-gray-900">Trend Analysis</h3>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'patterns', label: 'Patterns' },
            { key: 'predictions', label: 'Predictions' },
            { key: 'growth', label: 'Growth Analysis' },
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
        {activeTab === 'patterns' && renderPatterns()}
        {activeTab === 'predictions' && renderPredictions()}
        {activeTab === 'growth' && renderGrowth()}
      </div>
    </Card>
  );
};

export default TrendAnalysis;