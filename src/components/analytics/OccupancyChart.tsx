import React from 'react';
import Card from '@/components/ui/Card';

interface OccupancyData {
  period: string;
  occupancyRate: number;
  totalTables: number;
  occupiedTables: number;
  capacityUtilization?: number;
}

interface OccupancyChartProps {
  data: OccupancyData[];
  title?: string;
  type?: 'line' | 'bar' | 'area';
  height?: number;
  loading?: boolean;
  className?: string;
}

export const OccupancyChart: React.FC<OccupancyChartProps> = ({
  data,
  title = 'Occupancy Rate',
  type = 'line',
  height = 300,
  loading = false,
  className = '',
}) => {
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
    const maxOccupancyRate = Math.max(...data.map(d => d.occupancyRate));
    const maxOccupiedTables = Math.max(...data.map(d => d.occupiedTables));
    
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
                {value}%
              </text>
            </g>
          ))}

          {/* Chart data */}
          {type === 'bar' ? (
            // Bar chart
            data.map((point, index) => {
              const barWidth = (chartWidth - 2 * padding) / data.length * 0.8;
              const barX = padding + (index * (chartWidth - 2 * padding) / data.length) + ((chartWidth - 2 * padding) / data.length - barWidth) / 2;
              const barHeight = (point.occupancyRate / 100) * (chartHeight - 2 * padding);
              const barY = chartHeight - padding - barHeight;

              return (
                <rect
                  key={index}
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill="#3b82f6"
                  opacity="0.8"
                />
              );
            })
          ) : (
            // Line/Area chart
            <>
              {type === 'area' && (
                <path
                  d={`M ${data.map((point, index) => {
                    const x = padding + (index * (chartWidth - 2 * padding) / Math.max(data.length - 1, 1));
                    const y = chartHeight - padding - (point.occupancyRate / 100) * (chartHeight - 2 * padding);
                    return `${x},${y}`;
                  }).join(' L ')} L ${chartWidth - padding},${chartHeight - padding} L ${padding},${chartHeight - padding} Z`}
                  fill="#3b82f6"
                  opacity="0.2"
                />
              )}
              <path
                d={`M ${data.map((point, index) => {
                  const x = padding + (index * (chartWidth - 2 * padding) / Math.max(data.length - 1, 1));
                  const y = chartHeight - padding - (point.occupancyRate / 100) * (chartHeight - 2 * padding);
                  return `${x},${y}`;
                }).join(' L ')}`}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1"
              />
              {/* Data points */}
              {data.map((point, index) => {
                const x = padding + (index * (chartWidth - 2 * padding) / Math.max(data.length - 1, 1));
                const y = chartHeight - padding - (point.occupancyRate / 100) * (chartHeight - 2 * padding);
                
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="1.5"
                    fill="#3b82f6"
                  />
                );
              })}
            </>
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
      <div style={{ height: `${height}px` }}>
        {renderChart()}
      </div>
      {data && data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <div>
              <span className="text-gray-500">Average Occupancy Rate:</span>
              <span className="ml-2 font-medium">
                {(data.reduce((sum, d) => sum + d.occupancyRate, 0) / data.length).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Peak Occupancy:</span>
              <span className="ml-2 font-medium">
                {Math.max(...data.map(d => d.occupancyRate)).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default OccupancyChart;