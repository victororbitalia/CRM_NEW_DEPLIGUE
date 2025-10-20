import React, { useState } from 'react';
import Card from '@/components/ui/Card';

interface ReservationData {
  period: string;
  total: number;
  confirmed?: number;
  completed?: number;
  cancelled?: number;
  noShow?: number;
  pending?: number;
}

interface ReservationChartProps {
  data: ReservationData[];
  title?: string;
  metrics?: ('total' | 'confirmed' | 'completed' | 'cancelled' | 'noShow' | 'pending')[];
  type?: 'line' | 'bar' | 'stacked';
  height?: number;
  loading?: boolean;
  className?: string;
}

export const ReservationChart: React.FC<ReservationChartProps> = ({
  data,
  title = 'Reservation Trends',
  metrics = ['total', 'confirmed', 'completed', 'cancelled'],
  type = 'line',
  height = 300,
  loading = false,
  className = '',
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState(metrics);

  const colors = {
    total: '#3b82f6',     // blue
    confirmed: '#10b981', // green
    completed: '#8b5cf6', // purple
    cancelled: '#ef4444', // red
    noShow: '#f59e0b',    // amber
    pending: '#6b7280',   // gray
  };

  const toggleMetric = (metric: typeof metrics[0]) => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No data available</p>
        </div>
      );
    }

    // Calculate max values for scaling
    const maxValues = selectedMetrics.map(metric => 
      Math.max(...data.map(d => d[metric] || 0))
    );
    const maxValue = Math.max(...maxValues, 1);

    // Chart dimensions
    const chartWidth = 100;
    const chartHeight = 100;
    const padding = 5;

    return (
      <div className="relative h-full">
        {/* Simple SVG Chart */}
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((value) => (
            <g key={value}>
              <line
                x1={padding}
                y1={chartHeight - padding - (value / 100) * (chartHeight - 2 * padding)}
                x2={chartWidth - padding}
                y2={chartHeight - padding - (value / 100) * (chartHeight - 2 * padding)}
                stroke="#e5e7eb"
                strokeWidth="0.5"
              />
              <text
                x={padding - 2}
                y={chartHeight - padding - (value / 100) * (chartHeight - 2 * padding)}
                fontSize="3"
                textAnchor="end"
                fill="#6b7280"
              >
                {Math.round(maxValue * value / 100)}
              </text>
            </g>
          ))}

          {/* Chart data */}
          {type === 'bar' ? (
            // Bar chart
            data.map((point, index) => {
              const barGroupWidth = (chartWidth - 2 * padding) / data.length;
              const barWidth = barGroupWidth / selectedMetrics.length * 0.8;
              
              return selectedMetrics.map((metric, metricIndex) => {
                const value = point[metric] || 0;
                const barHeight = (value / maxValue) * (chartHeight - 2 * padding);
                const barX = padding + (index * barGroupWidth) + (metricIndex * barGroupWidth / selectedMetrics.length) + (barGroupWidth / selectedMetrics.length - barWidth) / 2;
                const barY = chartHeight - padding - barHeight;

                return (
                  <rect
                    key={`${index}-${metric}`}
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    fill={colors[metric]}
                    opacity="0.8"
                  />
                );
              });
            })
          ) : type === 'stacked' ? (
            // Stacked bar chart
            data.map((point, index) => {
              const barGroupWidth = (chartWidth - 2 * padding) / data.length;
              const barWidth = barGroupWidth * 0.8;
              const barX = padding + (index * barGroupWidth) + (barGroupWidth - barWidth) / 2;
              
              let stackHeight = 0;
              
              return selectedMetrics.map((metric, metricIndex) => {
                const value = point[metric] || 0;
                const barHeight = (value / maxValue) * (chartHeight - 2 * padding);
                const barY = chartHeight - padding - stackHeight - barHeight;
                
                stackHeight += barHeight;
                
                return (
                  <rect
                    key={`${index}-${metric}`}
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    fill={colors[metric]}
                    opacity="0.8"
                  />
                );
              });
            })
          ) : (
            // Line chart
            selectedMetrics.map((metric) => {
              const pathData = data.map((point, index) => {
                const x = padding + (index * (chartWidth - 2 * padding) / (data.length - 1));
                const y = chartHeight - padding - ((point[metric] || 0) / maxValue) * (chartHeight - 2 * padding);
                return `${x},${y}`;
              }).join(' L ');

              return (
                <g key={metric}>
                  <path
                    d={`M ${pathData}`}
                    fill="none"
                    stroke={colors[metric]}
                    strokeWidth="1"
                  />
                  {/* Data points */}
                  {data.map((point, index) => {
                    // Avoid division by zero when there's only one data point
                    const x = data.length > 1
                      ? padding + (index * (chartWidth - 2 * padding) / (data.length - 1))
                      : chartWidth / 2;
                    const y = chartHeight - padding - ((point[metric] || 0) / maxValue) * (chartHeight - 2 * padding);
                     
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r="1.5"
                        fill={colors[metric]}
                      />
                    );
                  })}
                </g>
              );
            })
          )}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 px-1">
          {data.map((point, index) => (
            <div
              key={index}
              className="text-xs text-gray-500 truncate"
              style={{ maxWidth: `${100 / data.length}%` }}
              title={point.period}
            >
              {index % Math.ceil(data.length / 5) === 0 ? point.period : ''}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      
      {/* Metrics selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {metrics.map((metric) => (
          <button
            key={metric}
            onClick={() => toggleMetric(metric)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedMetrics.includes(metric)
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span
              className="inline-block w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: colors[metric] }}
            />
            {metric.charAt(0).toUpperCase() + metric.slice(1)}
          </button>
        ))}
      </div>
      
      <div style={{ height: `${height}px` }}>
        {renderChart()}
      </div>
      
      {data && data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {selectedMetrics.map((metric) => {
              const total = data.reduce((sum, d) => sum + (d[metric] || 0), 0);
              const average = total / data.length;
              const max = Math.max(...data.map(d => d[metric] || 0));
              
              return (
                <div key={metric} className="flex items-center">
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: colors[metric] }}
                  />
                  <div>
                    <span className="text-gray-500 capitalize">{metric}:</span>
                    <span className="ml-1 font-medium">{average.toFixed(1)} avg</span>
                    <span className="ml-1 text-gray-400">({max} max)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ReservationChart;