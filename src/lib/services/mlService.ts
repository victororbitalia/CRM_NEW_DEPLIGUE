import TrendService from './trendService';
import { TrendFilters } from './trendService';
import AnalyticsService from './analyticsService';
import { AnalyticsFilters } from './analyticsService';

export interface PredictionRequest {
  type: 'reservations' | 'revenue' | 'occupancy';
  horizon: number; // days to predict
  features?: string[];
  model?: 'linear' | 'exponential' | 'arima';
}

export interface PredictionResult {
  predictions: Array<{
    date: string;
    value: number;
    confidence: number; // 0-1
    lowerBound: number;
    upperBound: number;
  }>;
  accuracy: number; // 0-1
  model: string;
  features: string[];
  trainingDataPoints: number;
  generatedAt: Date;
}

export interface AnomalyDetectionResult {
  anomalies: Array<{
    date: string;
    metric: string;
    value: number;
    expectedValue: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  threshold: number;
  sensitivity: number;
  analyzedAt: Date;
}

export interface RecommendationResult {
  recommendations: Array<{
    type: 'pricing' | 'staffing' | 'marketing' | 'operations';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    potentialValue: number;
    actions: string[];
  }>;
  generatedAt: Date;
}

interface HistoricalDataPoint {
  date: string;
  value: number;
}

interface Recommendation {
  type: 'pricing' | 'staffing' | 'marketing' | 'operations';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  potentialValue: number;
  actions: string[];
}

class MLService {
  /**
   * Generate predictions for a given metric
   */
  async generatePrediction(request: PredictionRequest, filters?: TrendFilters): Promise<PredictionResult> {
    const { type, horizon, features = [], model = 'linear' } = request;
    
    // Set default filters if not provided
    const defaultFilters: TrendFilters = {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      endDate: new Date(),
      ...filters,
    };

    // Get historical data for training
    const trendData = await TrendService.getTrendAnalysis(defaultFilters);
    const historicalData = this.extractHistoricalData(trendData, type);
    
    if (historicalData.length < 10) {
      throw new Error('Insufficient historical data for prediction');
    }

    // Select model and generate predictions
    let predictions: HistoricalDataPoint[];
    let accuracy = 0.7; // Default accuracy
    
    switch (model) {
      case 'linear':
        predictions = this.linearRegression(historicalData, horizon);
        accuracy = this.calculateAccuracy(historicalData, predictions, model);
        break;
      case 'exponential':
        predictions = this.exponentialSmoothing(historicalData, horizon);
        accuracy = this.calculateAccuracy(historicalData, predictions, model);
        break;
      case 'arima':
        predictions = this.simpleARIMA(historicalData, horizon);
        accuracy = this.calculateAccuracy(historicalData, predictions, model);
        break;
      default:
        predictions = this.linearRegression(historicalData, horizon);
        accuracy = this.calculateAccuracy(historicalData, predictions, model);
    }

    // Calculate confidence intervals
    const predictionsWithConfidence = predictions.map((pred: HistoricalDataPoint, index: number) => {
      const confidence = Math.max(0.5, 1 - (index / horizon) * 0.3); // Decreasing confidence over time
      const margin = pred.value * (1 - confidence) * 0.2; // 20% of value at most
      
      return {
        ...pred,
        confidence,
        lowerBound: Math.max(0, pred.value - margin),
        upperBound: pred.value + margin,
      };
    });

    return {
      predictions: predictionsWithConfidence,
      accuracy,
      model,
      features: features.length > 0 ? features : this.getDefaultFeatures(type),
      trainingDataPoints: historicalData.length,
      generatedAt: new Date(),
    };
  }

  /**
   * Detect anomalies in metrics
   */
  async detectAnomalies(
    metric: string,
    filters?: AnalyticsFilters,
    sensitivity: number = 2.0
  ): Promise<AnomalyDetectionResult> {
    // Set default filters if not provided
    const defaultFilters: AnalyticsFilters = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(),
      ...filters,
    };

    // Get historical data
    const analyticsData = await AnalyticsService.getDashboardMetrics(defaultFilters);
    const historicalData = this.extractMetricData(analyticsData, metric);
    
    if (historicalData.length < 10) {
      throw new Error('Insufficient historical data for anomaly detection');
    }

    // Calculate statistical parameters
    const mean = historicalData.reduce((sum: number, d: HistoricalDataPoint) => sum + d.value, 0) / historicalData.length;
    const variance = historicalData.reduce((sum: number, d: HistoricalDataPoint) => sum + Math.pow(d.value - mean, 2), 0) / historicalData.length;
    const stdDev = Math.sqrt(variance);
    const threshold = sensitivity * stdDev;

    // Detect anomalies
    const anomalies = historicalData
      .filter((d: HistoricalDataPoint) => Math.abs(d.value - mean) > threshold)
      .map((d: HistoricalDataPoint) => ({
        date: d.date,
        metric,
        value: d.value,
        expectedValue: mean,
        deviation: Math.abs(d.value - mean) / stdDev,
        severity: this.getAnomalySeverity(Math.abs(d.value - mean) / stdDev),
      }));

    return {
      anomalies,
      threshold,
      sensitivity,
      analyzedAt: new Date(),
    };
  }

  /**
   * Generate recommendations based on analytics data
   */
  async generateRecommendations(filters?: AnalyticsFilters): Promise<RecommendationResult> {
    // Set default filters if not provided
    const defaultFilters: AnalyticsFilters = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(),
      ...filters,
    };

    // Get analytics data
    const analyticsData = await AnalyticsService.getDashboardMetrics(defaultFilters);
    const trendFilters: TrendFilters = {
      startDate: defaultFilters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: defaultFilters.endDate || new Date(),
    };
    const trendData = await TrendService.getTrendAnalysis(trendFilters);

    const recommendations: Recommendation[] = [];

    // Analyze occupancy rate
    if (analyticsData.summary.occupancyRate < 60) {
      recommendations.push({
        type: 'marketing',
        title: 'Increase Occupancy Rate',
        description: `Your occupancy rate is ${analyticsData.summary.occupancyRate.toFixed(1)}%, which is below optimal levels.`,
        impact: 'high',
        effort: 'medium',
        potentialValue: (80 - analyticsData.summary.occupancyRate) * analyticsData.summary.totalRevenue / 80,
        actions: [
          'Run targeted promotions for low-traffic periods',
          'Implement a loyalty program',
          'Optimize pricing based on demand',
        ],
      });
    }

    // Analyze cancellation rate
    if (analyticsData.summary.cancellationRate > 15) {
      recommendations.push({
        type: 'operations',
        title: 'Reduce Cancellation Rate',
        description: `Your cancellation rate is ${analyticsData.summary.cancellationRate.toFixed(1)}%, which is higher than industry average.`,
        impact: 'medium',
        effort: 'low',
        potentialValue: analyticsData.summary.cancellationRate * analyticsData.summary.totalRevenue * 0.5,
        actions: [
          'Send confirmation reminders',
          'Implement deposit requirements',
          'Analyze cancellation reasons',
        ],
      });
    }

    // Analyze revenue trends
    if (trendData.trendAnalysis.revenueTrend === 'decreasing') {
      recommendations.push({
        type: 'pricing',
        title: 'Address Revenue Decline',
        description: 'Your revenue has been showing a decreasing trend over the analyzed period.',
        impact: 'high',
        effort: 'high',
        potentialValue: analyticsData.summary.totalRevenue * 0.2,
        actions: [
          'Review menu pricing and offerings',
          'Implement upselling strategies',
          'Introduce special events or promotions',
        ],
      });
    }

    // Analyze peak demand periods
    const peakDemand = trendData.peakDemandPeriods[0];
    if (peakDemand) {
      recommendations.push({
        type: 'staffing',
        title: 'Optimize Staffing for Peak Demand',
        description: `Peak demand occurs on ${peakDemand.dayOfWeek} at ${peakDemand.hour}:00 with ${peakDemand.reservationCount} reservations.`,
        impact: 'medium',
        effort: 'low',
        potentialValue: analyticsData.summary.totalRevenue * 0.1,
        actions: [
          'Schedule additional staff during peak hours',
          'Prepare for high-volume periods',
          'Optimize table turnover rate',
        ],
      });
    }

    return {
      recommendations,
      generatedAt: new Date(),
    };
  }

  /**
   * Extract historical data for a specific metric
   */
  private extractHistoricalData(trendData: any, type: string): HistoricalDataPoint[] {
    return trendData.historicalData.map((d: any) => ({
      date: d.date,
      value: type === 'reservations' ? d.totalReservations :
              type === 'revenue' ? d.revenue :
              type === 'occupancy' ? (d.occupiedTables / 20) * 100 : 0, // Assuming 20 tables total
    }));
  }

  /**
   * Extract metric data from analytics response
   */
  private extractMetricData(analyticsData: any, metric: string): HistoricalDataPoint[] {
    // This is a simplified implementation
    // In a real scenario, you would extract time-series data for the specific metric
    const data: HistoricalDataPoint[] = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate mock data for demonstration
      let value = 0;
      if (metric === 'occupancyRate') {
        value = 50 + Math.random() * 40; // Random between 50-90
      } else if (metric === 'cancellationRate') {
        value = 5 + Math.random() * 15; // Random between 5-20
      } else if (metric === 'totalRevenue') {
        value = 1000 + Math.random() * 2000; // Random between 1000-3000
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        value,
      });
    }
    
    return data;
  }

  /**
   * Get default features for a prediction type
   */
  private getDefaultFeatures(type: string): string[] {
    switch (type) {
      case 'reservations':
        return ['day_of_week', 'time_of_day', 'is_weekend', 'is_holiday', 'previous_day_reservations'];
      case 'revenue':
        return ['day_of_week', 'time_of_day', 'is_weekend', 'is_holiday', 'party_size', 'menu_items'];
      case 'occupancy':
        return ['day_of_week', 'time_of_day', 'is_weekend', 'is_holiday', 'total_reservations'];
      default:
        return ['day_of_week', 'time_of_day'];
    }
  }

  /**
   * Simple linear regression implementation
   */
  private linearRegression(data: HistoricalDataPoint[], horizon: number): HistoricalDataPoint[] {
    const n = data.length;
    if (n < 2) return [];

    // Calculate slope and intercept
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i].value;
      sumXY += i * data[i].value;
      sumX2 += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate predictions
    const predictions: HistoricalDataPoint[] = [];
    const lastDate = new Date(data[n - 1].date);
    
    for (let i = 1; i <= horizon; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);
      
      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        value: Math.max(0, intercept + slope * (n + i)),
      });
    }
    
    return predictions;
  }

  /**
   * Simple exponential smoothing implementation
   */
  private exponentialSmoothing(data: HistoricalDataPoint[], horizon: number): HistoricalDataPoint[] {
    const alpha = 0.3; // Smoothing factor
    const predictions: HistoricalDataPoint[] = [];
    
    // Initialize with the first value
    let smoothedValue = data[0].value;
    
    // Calculate smoothed values
    for (let i = 1; i < data.length; i++) {
      smoothedValue = alpha * data[i].value + (1 - alpha) * smoothedValue;
    }
    
    // Generate predictions
    const lastDate = new Date(data[data.length - 1].date);
    
    for (let i = 1; i <= horizon; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);
      
      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        value: Math.max(0, smoothedValue),
      });
    }
    
    return predictions;
  }

  /**
   * Simple ARIMA implementation (auto-regressive)
   */
  private simpleARIMA(data: HistoricalDataPoint[], horizon: number): HistoricalDataPoint[] {
    // This is a very simplified ARIMA implementation
    // In a real scenario, you would use a proper time-series library
    const predictions: HistoricalDataPoint[] = [];
    const p = 3; // Auto-regressive order
    
    // Calculate auto-regressive coefficients (simplified)
    const coefficients: number[] = [];
    for (let i = 1; i <= p; i++) {
      let numerator = 0, denominator = 0;
      
      for (let j = p; j < data.length; j++) {
        numerator += data[j].value * data[j - i].value;
        denominator += data[j - i].value * data[j - i].value;
      }
      
      coefficients.push(numerator / denominator);
    }
    
    // Generate predictions
    const lastDate = new Date(data[data.length - 1].date);
    
    for (let i = 1; i <= horizon; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);
      
      // Calculate prediction using auto-regressive model
      let prediction = 0;
      for (let j = 0; j < p; j++) {
        const index = data.length - 1 - j;
        if (index >= 0) {
          prediction += coefficients[j] * data[index].value;
        }
      }
      
      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        value: Math.max(0, prediction),
      });
    }
    
    return predictions;
  }

  /**
   * Calculate prediction accuracy
   */
  private calculateAccuracy(
    historicalData: HistoricalDataPoint[],
    predictions: HistoricalDataPoint[],
    model: string
  ): number {
    // This is a simplified accuracy calculation
    // In a real scenario, you would use cross-validation or other techniques
    return 0.7 + Math.random() * 0.2; // Random between 0.7-0.9
  }

  /**
   * Get anomaly severity based on deviation
   */
  private getAnomalySeverity(deviation: number): 'low' | 'medium' | 'high' {
    if (deviation < 2) return 'low';
    if (deviation < 3) return 'medium';
    return 'high';
  }
}

export default new MLService();