import { db } from '@/lib/db';

export interface TrendFilters {
  startDate: Date;
  endDate: Date;
  restaurantId?: string;
  areaId?: string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
}

export interface HistoricalData {
  date: string;
  totalReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  noShowReservations: number;
  revenue: number;
  totalGuests: number;
  occupiedTables: number;
}

export interface PatternData {
  dayOfWeek?: string;
  month?: string;
  quarter?: string;
  totalReservations: number;
  completedReservations: number;
  revenue: number;
  totalGuests: number;
  avgPartySize: number;
  occupiedTables: number;
}

export interface PredictionData {
  date: string;
  predictedReservations: number;
  predictedRevenue: number;
  predictedGuests: number;
  confidence: 'low' | 'medium' | 'high';
}

export interface GrowthRateData {
  month: string;
  reservations: number;
  revenue: number;
  reservationGrowthRate: number;
  revenueGrowthRate: number;
}

export interface PeakDemandData {
  hour: string;
  dayOfWeek: string;
  reservationCount: number;
  totalGuests: number;
  occupiedTables: number;
}

export interface TrendAnalysisResult {
  dataPoints: number;
  minReservations: number;
  maxReservations: number;
  avgReservations: number;
  minRevenue: number;
  maxRevenue: number;
  avgRevenue: number;
  reservationTrend: 'increasing' | 'decreasing' | 'stable';
  revenueTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface TrendData {
  historicalData: HistoricalData[];
  patterns: {
    dayOfWeek: PatternData[];
    monthly: PatternData[];
    seasonal: PatternData[];
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
  growthRates: GrowthRateData[];
  peakDemandPeriods: PeakDemandData[];
  trendAnalysis: TrendAnalysisResult;
  period: {
    start: Date;
    end: Date;
    groupBy: string;
  };
}

class TrendService {
  /**
   * Get comprehensive trend analysis
   */
  async getTrendAnalysis(filters: TrendFilters): Promise<TrendData> {
    const {
      startDate = new Date(new Date().setDate(new Date().getDate() - 90)),
      endDate = new Date(),
      restaurantId,
      areaId,
      groupBy = 'month'
    } = filters;

    // Get historical data for trend analysis
    const historicalData = await this.getHistoricalData(startDate, endDate, restaurantId, areaId);

    // Get day of week patterns
    const dayOfWeekPatterns = await this.getDayOfWeekPatterns(startDate, endDate, restaurantId, areaId);

    // Get monthly patterns
    const monthlyPatterns = await this.getMonthlyPatterns(startDate, endDate, restaurantId, areaId);

    // Get seasonal patterns (by quarter)
    const seasonalPatterns = await this.getSeasonalPatterns(startDate, endDate, restaurantId, areaId);

    // Simple moving average prediction
    const movingAveragePrediction = await this.getMovingAveragePrediction(restaurantId, areaId);

    // Generate simple predictions based on historical patterns
    const forecast = this.generateForecast(dayOfWeekPatterns, 30);

    // Get growth rates
    const growthRates = await this.getGrowthRates(startDate, endDate, restaurantId, areaId);

    // Get peak demand periods
    const peakDemandPeriods = await this.getPeakDemandPeriods(startDate, endDate, restaurantId, areaId);

    // Get trend analysis
    const trendAnalysis = await this.getTrendAnalysisResult(historicalData);

    return {
      historicalData,
      patterns: {
        dayOfWeek: dayOfWeekPatterns,
        monthly: monthlyPatterns,
        seasonal: seasonalPatterns,
      },
      predictions: {
        movingAverage: movingAveragePrediction,
        forecast,
      },
      growthRates,
      peakDemandPeriods,
      trendAnalysis,
      period: {
        start: startDate,
        end: endDate,
        groupBy,
      },
    };
  }

  /**
   * Get historical data for trend analysis
   */
  private async getHistoricalData(
    startDate: Date,
    endDate: Date,
    restaurantId?: string,
    areaId?: string
  ): Promise<HistoricalData[]> {
    return await db.prisma.$queryRaw`
      SELECT 
        DATE(date) as date,
        COUNT(*) as totalReservations,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedReservations,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelledReservations,
        SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as noShowReservations,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN depositAmount ELSE 0 END), 0) as revenue,
        SUM(partySize) as totalGuests,
        COUNT(DISTINCT tableId) as occupiedTables
      FROM reservations
      WHERE date >= ${startDate} AND date <= ${endDate}
      ${restaurantId && !areaId ? 
        `AND tableId IN (
          SELECT id FROM tables 
          WHERE areaId IN (
            SELECT id FROM areas WHERE restaurantId = ${restaurantId}
          )
        )` : ''
      }
      ${areaId ? 
        `AND tableId IN (
          SELECT id FROM tables 
          WHERE areaId = ${areaId}
        )` : ''
      }
      GROUP BY DATE(date)
      ORDER BY date ASC
    ` as HistoricalData[];
  }

  /**
   * Get day of week patterns
   */
  private async getDayOfWeekPatterns(
    startDate: Date,
    endDate: Date,
    restaurantId?: string,
    areaId?: string
  ): Promise<PatternData[]> {
    return await db.prisma.$queryRaw`
      SELECT 
        strftime('%w', date) as dayOfWeek,
        COUNT(*) as totalReservations,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedReservations,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN depositAmount ELSE 0 END), 0) as revenue,
        SUM(partySize) as totalGuests,
        AVG(partySize) as avgPartySize,
        COUNT(DISTINCT tableId) as occupiedTables
      FROM reservations
      WHERE date >= ${startDate} AND date <= ${endDate}
      ${restaurantId && !areaId ? 
        `AND tableId IN (
          SELECT id FROM tables 
          WHERE areaId IN (
            SELECT id FROM areas WHERE restaurantId = ${restaurantId}
          )
        )` : ''
      }
      ${areaId ? 
        `AND tableId IN (
          SELECT id FROM tables 
          WHERE areaId = ${areaId}
        )` : ''
      }
      GROUP BY strftime('%w', date)
      ORDER BY dayOfWeek
    ` as PatternData[];
  }

  /**
   * Get monthly patterns
   */
  private async getMonthlyPatterns(
    startDate: Date,
    endDate: Date,
    restaurantId?: string,
    areaId?: string
  ): Promise<PatternData[]> {
    return await db.prisma.$queryRaw`
      SELECT 
        strftime('%m', date) as month,
        COUNT(*) as totalReservations,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedReservations,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN depositAmount ELSE 0 END), 0) as revenue,
        SUM(partySize) as totalGuests,
        AVG(partySize) as avgPartySize,
        COUNT(DISTINCT tableId) as occupiedTables
      FROM reservations
      WHERE date >= ${startDate} AND date <= ${endDate}
      ${restaurantId && !areaId ? 
        `AND tableId IN (
          SELECT id FROM tables 
          WHERE areaId IN (
            SELECT id FROM areas WHERE restaurantId = ${restaurantId}
          )
        )` : ''
      }
      ${areaId ? 
        `AND tableId IN (
          SELECT id FROM tables 
          WHERE areaId = ${areaId}
        )` : ''
      }
      GROUP BY strftime('%m', date)
      ORDER BY month
    ` as PatternData[];
  }

  /**
   * Get seasonal patterns (by quarter)
   */
  private async getSeasonalPatterns(
    startDate: Date,
    endDate: Date,
    restaurantId?: string,
    areaId?: string
  ): Promise<PatternData[]> {
    return await db.prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN CAST(strftime('%m', date) AS INTEGER) BETWEEN 1 AND 3 THEN 'Q1 (Jan-Mar)'
          WHEN CAST(strftime('%m', date) AS INTEGER) BETWEEN 4 AND 6 THEN 'Q2 (Apr-Jun)'
          WHEN CAST(strftime('%m', date) AS INTEGER) BETWEEN 7 AND 9 THEN 'Q3 (Jul-Sep)'
          ELSE 'Q4 (Oct-Dec)'
        END as quarter,
        COUNT(*) as totalReservations,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedReservations,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN depositAmount ELSE 0 END), 0) as revenue,
        SUM(partySize) as totalGuests,
        AVG(partySize) as avgPartySize,
        COUNT(DISTINCT tableId) as occupiedTables
      FROM reservations
      WHERE date >= ${startDate} AND date <= ${endDate}
      ${restaurantId && !areaId ? 
        `AND tableId IN (
          SELECT id FROM tables 
          WHERE areaId IN (
            SELECT id FROM areas WHERE restaurantId = ${restaurantId}
          )
        )` : ''
      }
      ${areaId ? 
        `AND tableId IN (
          SELECT id FROM tables 
          WHERE areaId = ${areaId}
        )` : ''
      }
      GROUP BY quarter
      ORDER BY quarter
    ` as PatternData[];
  }

  /**
   * Get moving average prediction
   */
  private async getMovingAveragePrediction(
    restaurantId?: string,
    areaId?: string
  ): Promise<Array<{
    date: string;
    reservations: number;
    revenue: number;
    predictedReservations: number;
    predictedRevenue: number;
  }>> {
    return await db.prisma.$queryRaw`
      WITH daily_data AS (
        SELECT 
          DATE(date) as date,
          COUNT(*) as reservations,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN depositAmount ELSE 0 END), 0) as revenue
        FROM reservations
        WHERE date >= date('now', '-30 days') AND date <= date('now', '-1 day')
        ${restaurantId && !areaId ? 
          `AND tableId IN (
            SELECT id FROM tables 
            WHERE areaId IN (
              SELECT id FROM areas WHERE restaurantId = ${restaurantId}
            )
          )` : ''
        }
        ${areaId ? 
          `AND tableId IN (
            SELECT id FROM tables 
            WHERE areaId = ${areaId}
          )` : ''
        }
        GROUP BY DATE(date)
      ),
      moving_averages AS (
        SELECT 
          date,
          reservations,
          revenue,
          AVG(reservations) OVER (
            ORDER BY date 
            ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
          ) as predictedReservations,
          AVG(revenue) OVER (
            ORDER BY date 
            ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
          ) as predictedRevenue
        FROM daily_data
      )
      SELECT 
        date,
        reservations,
        revenue,
        ROUND(predictedReservations, 2) as predictedReservations,
        ROUND(predictedRevenue, 2) as predictedRevenue
      FROM moving_averages
      ORDER BY date DESC
      LIMIT 7
    ` as Array<{
      date: string;
      reservations: number;
      revenue: number;
      predictedReservations: number;
      predictedRevenue: number;
    }>;
  }

  /**
   * Generate simple predictions based on historical patterns
   */
  private generateForecast(
    dayOfWeekPatterns: PatternData[],
    predictionDays: number
  ): PredictionData[] {
    const predictions: PredictionData[] = [];
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    
    // Simple prediction logic based on day of week patterns
    for (let i = 0; i < predictionDays; i++) {
      const predictionDate = new Date(currentDate);
      predictionDate.setDate(currentDate.getDate() + i);
      const dayOfWeek = predictionDate.getDay();
      
      // Find the pattern for this day of week
      const dayPattern = dayOfWeekPatterns.find(p => parseInt(p.dayOfWeek || '0') === dayOfWeek);
      
      if (dayPattern) {
        predictions.push({
          date: predictionDate.toISOString().split('T')[0],
          predictedReservations: Math.round(dayPattern.totalReservations),
          predictedRevenue: parseFloat(dayPattern.revenue?.toString() || '0'),
          predictedGuests: Math.round(dayPattern.totalGuests || 0),
          confidence: 'medium', // Simple prediction confidence
        });
      } else {
        // Fallback prediction
        predictions.push({
          date: predictionDate.toISOString().split('T')[0],
          predictedReservations: 0,
          predictedRevenue: 0,
          predictedGuests: 0,
          confidence: 'low',
        });
      }
    }
    
    return predictions;
  }

  /**
   * Get growth rates
   */
  private async getGrowthRates(
    startDate: Date,
    endDate: Date,
    restaurantId?: string,
    areaId?: string
  ): Promise<GrowthRateData[]> {
    return await db.prisma.$queryRaw`
      WITH monthly_data AS (
        SELECT 
          strftime('%Y-%m', date) as month,
          COUNT(*) as reservations,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN depositAmount ELSE 0 END), 0) as revenue
        FROM reservations
        WHERE date >= ${startDate} AND date <= ${endDate}
        ${restaurantId && !areaId ? 
          `AND tableId IN (
            SELECT id FROM tables 
            WHERE areaId IN (
              SELECT id FROM areas WHERE restaurantId = ${restaurantId}
            )
          )` : ''
        }
        ${areaId ? 
          `AND tableId IN (
            SELECT id FROM tables 
            WHERE areaId = ${areaId}
          )` : ''
        }
        GROUP BY strftime('%Y-%m', date)
        ORDER BY month
      )
      SELECT 
        month,
        reservations,
        revenue,
        LAG(reservations) OVER (ORDER BY month) as prevReservations,
        LAG(revenue) OVER (ORDER BY month) as prevRevenue,
        ROUND(
          (reservations - LAG(reservations) OVER (ORDER BY month)) * 100.0 / 
          NULLIF(LAG(reservations) OVER (ORDER BY month), 0), 2
        ) as reservationGrowthRate,
        ROUND(
          (revenue - LAG(revenue) OVER (ORDER BY month)) * 100.0 / 
          NULLIF(LAG(revenue) OVER (ORDER BY month), 0), 2
        ) as revenueGrowthRate
      FROM monthly_data
      ORDER BY month
    ` as GrowthRateData[];
  }

  /**
   * Get peak demand periods
   */
  private async getPeakDemandPeriods(
    startDate: Date,
    endDate: Date,
    restaurantId?: string,
    areaId?: string
  ): Promise<PeakDemandData[]> {
    return await db.prisma.$queryRaw`
      SELECT 
        strftime('%H', startTime) as hour,
        strftime('%w', date) as dayOfWeek,
        COUNT(*) as reservationCount,
        SUM(partySize) as totalGuests,
        COUNT(DISTINCT tableId) as occupiedTables
      FROM reservations
      WHERE date >= ${startDate} AND date <= ${endDate}
        AND status IN ('confirmed', 'seated', 'completed')
      ${restaurantId && !areaId ? 
        `AND tableId IN (
          SELECT id FROM tables 
          WHERE areaId IN (
            SELECT id FROM areas WHERE restaurantId = ${restaurantId}
          )
        )` : ''
      }
      ${areaId ? 
        `AND tableId IN (
          SELECT id FROM tables 
          WHERE areaId = ${areaId}
        )` : ''
      }
      GROUP BY hour, dayOfWeek
      HAVING reservationCount > 0
      ORDER BY reservationCount DESC
      LIMIT 20
    ` as PeakDemandData[];
  }

  /**
   * Get trend analysis result
   */
  private async getTrendAnalysisResult(
    historicalData: HistoricalData[]
  ): Promise<TrendAnalysisResult> {
    if (!historicalData.length) {
      return {
        dataPoints: 0,
        minReservations: 0,
        maxReservations: 0,
        avgReservations: 0,
        minRevenue: 0,
        maxRevenue: 0,
        avgRevenue: 0,
        reservationTrend: 'stable',
        revenueTrend: 'stable',
      };
    }

    const dataPoints = historicalData.length;
    const totalReservations = historicalData.reduce((sum, d) => sum + d.totalReservations, 0);
    const totalRevenue = historicalData.reduce((sum, d) => sum + d.revenue, 0);
    const minReservations = Math.min(...historicalData.map(d => d.totalReservations));
    const maxReservations = Math.max(...historicalData.map(d => d.totalReservations));
    const minRevenue = Math.min(...historicalData.map(d => d.revenue));
    const maxRevenue = Math.max(...historicalData.map(d => d.revenue));
    const avgReservations = totalReservations / dataPoints;
    const avgRevenue = totalRevenue / dataPoints;

    // Simple trend analysis
    const firstHalf = historicalData.slice(0, Math.floor(dataPoints / 2));
    const secondHalf = historicalData.slice(Math.floor(dataPoints / 2));

    const firstHalfAvgReservations = firstHalf.reduce((sum, d) => sum + d.totalReservations, 0) / firstHalf.length;
    const secondHalfAvgReservations = secondHalf.reduce((sum, d) => sum + d.totalReservations, 0) / secondHalf.length;

    const firstHalfAvgRevenue = firstHalf.reduce((sum, d) => sum + d.revenue, 0) / firstHalf.length;
    const secondHalfAvgRevenue = secondHalf.reduce((sum, d) => sum + d.revenue, 0) / secondHalf.length;

    const reservationTrend = 
      secondHalfAvgReservations > firstHalfAvgReservations * 1.1 ? 'increasing' :
      secondHalfAvgReservations < firstHalfAvgReservations * 0.9 ? 'decreasing' : 'stable';

    const revenueTrend = 
      secondHalfAvgRevenue > firstHalfAvgRevenue * 1.1 ? 'increasing' :
      secondHalfAvgRevenue < firstHalfAvgRevenue * 0.9 ? 'decreasing' : 'stable';

    return {
      dataPoints,
      minReservations,
      maxReservations,
      avgReservations,
      minRevenue,
      maxRevenue,
      avgRevenue,
      reservationTrend: reservationTrend as 'increasing' | 'decreasing' | 'stable',
      revenueTrend: revenueTrend as 'increasing' | 'decreasing' | 'stable',
    };
  }

  /**
   * Get seasonality analysis
   */
  async getSeasonalityAnalysis(filters: TrendFilters): Promise<{
    overallSeasonality: number; // 0-1, higher means more seasonal
    peakSeason: string;
    lowSeason: string;
    seasonalFactors: Array<{
      period: string;
      factor: number; // Multiplier for average demand
    }>;
  }> {
    const { startDate, endDate, restaurantId, areaId } = filters;

    // Get monthly average reservations
    const monthlyAverages = await db.prisma.$queryRaw`
      SELECT 
        strftime('%m', date) as month,
        AVG(COUNT(*)) OVER (PARTITION BY strftime('%m', date)) as avgReservations
      FROM reservations
      WHERE date >= ${startDate} AND date <= ${endDate}
      ${restaurantId && !areaId ? 
        `AND tableId IN (
          SELECT id FROM tables 
          WHERE areaId IN (
            SELECT id FROM areas WHERE restaurantId = ${restaurantId}
          )
        )` : ''
      }
      ${areaId ? 
        `AND tableId IN (
          SELECT id FROM tables 
          WHERE areaId = ${areaId}
        )` : ''
      }
      GROUP BY strftime('%Y-%m', date), strftime('%m', date)
      ORDER BY month
    ` as Array<{ month: string; avgReservations: number }>;

    // Calculate overall average
    const overallAvg = monthlyAverages.reduce((sum, m) => sum + m.avgReservations, 0) / monthlyAverages.length;

    // Calculate seasonal factors
    const seasonalFactors = monthlyAverages.map(m => ({
      period: m.month,
      factor: m.avgReservations / overallAvg,
    }));

    // Calculate seasonality (coefficient of variation)
    const variance = seasonalFactors.reduce((sum, f) => sum + Math.pow(f.factor - 1, 2), 0) / seasonalFactors.length;
    const overallSeasonality = Math.sqrt(variance);

    // Find peak and low seasons
    const peakSeason = seasonalFactors.reduce((max, f) => f.factor > max.factor ? f : max, seasonalFactors[0]);
    const lowSeason = seasonalFactors.reduce((min, f) => f.factor < min.factor ? f : min, seasonalFactors[0]);

    return {
      overallSeasonality,
      peakSeason: peakSeason.period,
      lowSeason: lowSeason.period,
      seasonalFactors,
    };
  }
}

export default new TrendService();