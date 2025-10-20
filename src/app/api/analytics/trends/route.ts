import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

// Get trends and predictions
export const GET = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const restaurantId = searchParams.get('restaurantId');
      const predictionDays = parseInt(searchParams.get('predictionDays') || '30');
      const metric = searchParams.get('metric') || 'reservations'; // reservations, revenue, occupancy

      // Set default date range if not provided
      const now = new Date();
      let start = startDate ? new Date(startDate) : new Date(now);
      let end = endDate ? new Date(endDate) : new Date(now);

      if (!startDate || !endDate) {
        // Default to last 90 days for trend analysis
        start.setDate(now.getDate() - 90);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      }

      // Get historical data for trend analysis
      const historicalData = await db.prisma.$queryRaw`
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
        WHERE date >= ${start} AND date <= ${end}
        ${restaurantId ? 
          `AND tableId IN (
            SELECT id FROM tables 
            WHERE areaId IN (
              SELECT id FROM areas WHERE restaurantId = ${restaurantId}
            )
          )` : ''
        }
        GROUP BY DATE(date)
        ORDER BY date ASC
      `;

      // Get day of week patterns
      const dayOfWeekPatterns = await db.prisma.$queryRaw`
        SELECT 
          strftime('%w', date) as dayOfWeek,
          COUNT(*) as totalReservations,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedReservations,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN depositAmount ELSE 0 END), 0) as revenue,
          SUM(partySize) as totalGuests,
          AVG(partySize) as avgPartySize,
          COUNT(DISTINCT tableId) as occupiedTables
        FROM reservations
        WHERE date >= ${start} AND date <= ${end}
        ${restaurantId ? 
          `AND tableId IN (
            SELECT id FROM tables 
            WHERE areaId IN (
              SELECT id FROM areas WHERE restaurantId = ${restaurantId}
            )
          )` : ''
        }
        GROUP BY strftime('%w', date)
        ORDER BY dayOfWeek
      `;

      // Get monthly patterns
      const monthlyPatterns = await db.prisma.$queryRaw`
        SELECT 
          strftime('%m', date) as month,
          COUNT(*) as totalReservations,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedReservations,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN depositAmount ELSE 0 END), 0) as revenue,
          SUM(partySize) as totalGuests,
          AVG(partySize) as avgPartySize,
          COUNT(DISTINCT tableId) as occupiedTables
        FROM reservations
        WHERE date >= ${start} AND date <= ${end}
        ${restaurantId ? 
          `AND tableId IN (
            SELECT id FROM tables 
            WHERE areaId IN (
              SELECT id FROM areas WHERE restaurantId = ${restaurantId}
            )
          )` : ''
        }
        GROUP BY strftime('%m', date)
        ORDER BY month
      `;

      // Get seasonal patterns (by quarter)
      const seasonalPatterns = await db.prisma.$queryRaw`
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
        WHERE date >= ${start} AND date <= ${end}
        ${restaurantId ? 
          `AND tableId IN (
            SELECT id FROM tables 
            WHERE areaId IN (
              SELECT id FROM areas WHERE restaurantId = ${restaurantId}
            )
          )` : ''
        }
        GROUP BY quarter
        ORDER BY quarter
      `;

      // Simple moving average prediction
      const movingAveragePrediction = await db.prisma.$queryRaw`
        WITH daily_data AS (
          SELECT 
            DATE(date) as date,
            COUNT(*) as reservations,
            COALESCE(SUM(CASE WHEN status = 'completed' THEN depositAmount ELSE 0 END), 0) as revenue
          FROM reservations
          WHERE date >= date('now', '-30 days') AND date <= date('now', '-1 day')
          ${restaurantId ? 
            `AND tableId IN (
              SELECT id FROM tables 
              WHERE areaId IN (
                SELECT id FROM areas WHERE restaurantId = ${restaurantId}
              )
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
            ) as ma_reservations,
            AVG(revenue) OVER (
              ORDER BY date 
              ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
            ) as ma_revenue
          FROM daily_data
        )
        SELECT 
          date,
          reservations,
          revenue,
          ROUND(ma_reservations, 2) as predictedReservations,
          ROUND(ma_revenue, 2) as predictedRevenue
        FROM moving_averages
        ORDER BY date DESC
        LIMIT 7
      `;

      // Get growth rates
      const growthRates = await db.prisma.$queryRaw`
        WITH monthly_data AS (
          SELECT 
            strftime('%Y-%m', date) as month,
            COUNT(*) as reservations,
            COALESCE(SUM(CASE WHEN status = 'completed' THEN depositAmount ELSE 0 END), 0) as revenue
          FROM reservations
          WHERE date >= ${start} AND date <= ${end}
          ${restaurantId ? 
            `AND tableId IN (
              SELECT id FROM tables 
              WHERE areaId IN (
                SELECT id FROM areas WHERE restaurantId = ${restaurantId}
              )
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
      `;

      // Get peak demand periods
      const peakDemandPeriods = await db.prisma.$queryRaw`
        SELECT 
          strftime('%H', startTime) as hour,
          strftime('%w', date) as dayOfWeek,
          COUNT(*) as reservationCount,
          SUM(partySize) as totalGuests,
          COUNT(DISTINCT tableId) as occupiedTables
        FROM reservations
        WHERE date >= ${start} AND date <= ${end}
          AND status IN ('confirmed', 'seated', 'completed')
        ${restaurantId ? 
          `AND tableId IN (
            SELECT id FROM tables 
            WHERE areaId IN (
              SELECT id FROM areas WHERE restaurantId = ${restaurantId}
            )
          )` : ''
        }
        GROUP BY hour, dayOfWeek
        HAVING reservationCount > 0
        ORDER BY reservationCount DESC
        LIMIT 20
      `;

      // Generate simple predictions based on historical patterns
      const generatePredictions = () => {
        const predictions = [];
        const currentDate = new Date(end);
        currentDate.setDate(currentDate.getDate() + 1);
        
        // Simple prediction logic based on day of week patterns
        for (let i = 0; i < predictionDays; i++) {
          const predictionDate = new Date(currentDate);
          predictionDate.setDate(currentDate.getDate() + i);
          const dayOfWeek = predictionDate.getDay();
          
          // Find the pattern for this day of week
          const dayPattern = Array.isArray(dayOfWeekPatterns) 
            ? dayOfWeekPatterns.find(p => parseInt(p.dayOfWeek) === dayOfWeek)
            : null;
          
          if (dayPattern) {
            predictions.push({
              date: predictionDate.toISOString().split('T')[0],
              predictedReservations: Math.round(dayPattern.totalReservations),
              predictedRevenue: parseFloat(dayPattern.revenue || '0'),
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
      };

      const predictions = generatePredictions();

      // Get trend analysis (simple linear regression approximation)
      const trendAnalysis = await db.prisma.$queryRaw`
        WITH daily_data AS (
          SELECT 
            DATE(date) as date,
            COUNT(*) as reservations,
            COALESCE(SUM(CASE WHEN status = 'completed' THEN depositAmount ELSE 0 END), 0) as revenue
          FROM reservations
          WHERE date >= ${start} AND date <= ${end}
          ${restaurantId ? 
            `AND tableId IN (
              SELECT id FROM tables 
              WHERE areaId IN (
                SELECT id FROM areas WHERE restaurantId = ${restaurantId}
              )
            )` : ''
          }
          GROUP BY DATE(date)
          ORDER BY date
        ),
        numbered_data AS (
          SELECT 
            date,
            reservations,
            revenue,
            ROW_NUMBER() OVER (ORDER BY date) as dayNumber
          FROM daily_data
        )
        SELECT 
          COUNT(*) as dataPoints,
          MIN(reservations) as minReservations,
          MAX(reservations) as maxReservations,
          AVG(reservations) as avgReservations,
          MIN(revenue) as minRevenue,
          MAX(revenue) as maxRevenue,
          AVG(revenue) as avgRevenue,
          CASE 
            WHEN FIRST_VALUE(reservations) OVER (ORDER BY dayNumber) < LAST_VALUE(reservations) OVER (ORDER BY dayNumber) 
            THEN 'increasing' 
            WHEN FIRST_VALUE(reservations) OVER (ORDER BY dayNumber) > LAST_VALUE(reservations) OVER (ORDER BY dayNumber) 
            THEN 'decreasing' 
            ELSE 'stable' 
          END as reservationTrend,
          CASE 
            WHEN FIRST_VALUE(revenue) OVER (ORDER BY dayNumber) < LAST_VALUE(revenue) OVER (ORDER BY dayNumber) 
            THEN 'increasing' 
            WHEN FIRST_VALUE(revenue) OVER (ORDER BY dayNumber) > LAST_VALUE(revenue) OVER (ORDER BY dayNumber) 
            THEN 'decreasing' 
            ELSE 'stable' 
          END as revenueTrend
        FROM numbered_data
      `;

      return NextResponse.json({
        success: true,
        data: {
          historicalData,
          patterns: {
            dayOfWeek: dayOfWeekPatterns,
            monthly: monthlyPatterns,
            seasonal: seasonalPatterns,
          },
          predictions: {
            movingAverage: movingAveragePrediction,
            forecast: predictions,
          },
          growthRates,
          peakDemandPeriods,
          trendAnalysis: Array.isArray(trendAnalysis) ? trendAnalysis[0] : trendAnalysis,
          period: {
            start,
            end,
            predictionDays,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching trends and predictions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trends and predictions' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager']
);