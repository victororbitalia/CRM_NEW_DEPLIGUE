import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

// Get occupancy analytics
export const GET = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const restaurantId = searchParams.get('restaurantId');
      const areaId = searchParams.get('areaId');
      const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month

      // Set default date range if not provided
      const now = new Date();
      let start = startDate ? new Date(startDate) : new Date(now);
      let end = endDate ? new Date(endDate) : new Date(now);

      if (!startDate || !endDate) {
        // Default to last 30 days
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      }

      // Get basic table and area information
      const [totalTables, areas] = await Promise.all([
        db.prisma.table.count({
          where: {
            isActive: true,
            ...(areaId && { id: areaId }),
            ...(restaurantId && !areaId && {
              area: {
                restaurantId,
              },
            }),
          },
        }),
        db.prisma.area.findMany({
          where: {
            isActive: true,
            ...(restaurantId && { restaurantId }),
          },
          include: {
            tables: {
              where: { isActive: true },
            },
          },
        }),
      ]);

      // Calculate occupancy trends based on groupBy
      let dateFormat;
      switch (groupBy) {
        case 'week':
          dateFormat = "%Y-%W";
          break;
        case 'month':
          dateFormat = "%Y-%m";
          break;
        case 'day':
        default:
          dateFormat = "%Y-%m-%d";
          break;
      }

      // Get occupancy trends
      const occupancyTrends = await db.prisma.$queryRaw`
        SELECT 
          strftime(${dateFormat}, date) as period,
          COUNT(DISTINCT t.id) as totalTables,
          COUNT(DISTINCT r.tableId) as occupiedTables,
          ROUND(
            (COUNT(DISTINCT r.tableId) * 100.0 / COUNT(DISTINCT t.id)), 2
          ) as occupancyRate,
          SUM(r.partySize) as totalGuests,
          SUM(t.capacity) as totalCapacity,
          ROUND(
            (SUM(r.partySize) * 100.0 / SUM(t.capacity)), 2
          ) as capacityUtilization
        FROM tables t
        LEFT JOIN areas a ON t.areaId = a.id
        LEFT JOIN reservations r ON t.id = r.tableId 
          AND r.date >= ${start} 
          AND r.date <= ${end}
          AND r.status IN ('confirmed', 'seated', 'completed')
        WHERE t.isActive = true
        ${restaurantId && !areaId ? `AND a.restaurantId = ${restaurantId}` : ''}
        ${areaId ? `AND t.areaId = ${areaId}` : ''}
        GROUP BY strftime(${dateFormat}, date)
        ORDER BY period ASC
      `;

      // Get hourly occupancy for today
      const hourlyOccupancy = await db.prisma.$queryRaw`
        SELECT 
          strftime('%H', r.startTime) as hour,
          COUNT(DISTINCT t.id) as totalTables,
          COUNT(DISTINCT r.tableId) as occupiedTables,
          ROUND(
            (COUNT(DISTINCT r.tableId) * 100.0 / COUNT(DISTINCT t.id)), 2
          ) as occupancyRate,
          SUM(r.partySize) as totalGuests,
          AVG(r.partySize) as avgPartySize
        FROM tables t
        LEFT JOIN areas a ON t.areaId = a.id
        LEFT JOIN reservations r ON t.id = r.tableId 
          AND DATE(r.date) = DATE('now')
          AND r.status IN ('confirmed', 'seated', 'completed')
        WHERE t.isActive = true
        ${restaurantId && !areaId ? `AND a.restaurantId = ${restaurantId}` : ''}
        ${areaId ? `AND t.areaId = ${areaId}` : ''}
        GROUP BY strftime('%H', r.startTime)
        ORDER BY hour ASC
      `;

      // Get area performance
      const areaPerformance = await db.prisma.$queryRaw`
        SELECT 
          a.id,
          a.name,
          COUNT(DISTINCT t.id) as totalTables,
          COUNT(DISTINCT r.tableId) as occupiedTables,
          ROUND(
            (COUNT(DISTINCT r.tableId) * 100.0 / COUNT(DISTINCT t.id)), 2
          ) as occupancyRate,
          SUM(r.partySize) as totalGuests,
          SUM(t.capacity) as totalCapacity,
          ROUND(
            (SUM(r.partySize) * 100.0 / SUM(t.capacity)), 2
          ) as capacityUtilization,
          COUNT(r.id) as totalReservations,
          SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completedReservations,
          AVG(r.partySize) as avgPartySize
        FROM areas a
        LEFT JOIN tables t ON a.id = t.areaId AND t.isActive = true
        LEFT JOIN reservations r ON t.id = r.tableId 
          AND r.date >= ${start} 
          AND r.date <= ${end}
          AND r.status IN ('confirmed', 'seated', 'completed')
        WHERE a.isActive = true
        ${restaurantId ? `AND a.restaurantId = ${restaurantId}` : ''}
        GROUP BY a.id, a.name
        ORDER BY occupancyRate DESC
      `;

      // Get table performance
      const tablePerformance = await db.prisma.$queryRaw`
        SELECT 
          t.id,
          t.number,
          a.name as areaName,
          t.capacity,
          COUNT(r.id) as totalReservations,
          SUM(r.partySize) as totalGuests,
          AVG(r.partySize) as avgPartySize,
          SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completedReservations,
          SUM(CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END) as cancelledReservations,
          SUM(CASE WHEN r.status = 'no_show' THEN 1 ELSE 0 END) as noShowReservations,
          ROUND(
            (SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(r.id)), 2
          ) as completionRate,
          ROUND(
            (SUM(r.partySize) * 100.0 / (COUNT(r.id) * t.capacity)), 2
          ) as efficiency
        FROM tables t
        LEFT JOIN areas a ON t.areaId = a.id
        LEFT JOIN reservations r ON t.id = r.tableId 
          AND r.date >= ${start} 
          AND r.date <= ${end}
        WHERE t.isActive = true
        ${restaurantId ? `AND a.restaurantId = ${restaurantId}` : ''}
        ${areaId ? `AND t.areaId = ${areaId}` : ''}
        GROUP BY t.id, t.number, a.name, t.capacity
        HAVING COUNT(r.id) > 0
        ORDER BY totalReservations DESC
        LIMIT 50
      `;

      // Get peak hours analysis
      const peakHours = await db.prisma.$queryRaw`
        SELECT 
          strftime('%H', r.startTime) as hour,
          COUNT(DISTINCT r.tableId) as occupiedTables,
          COUNT(r.id) as reservationCount,
          SUM(r.partySize) as totalGuests,
          AVG(r.partySize) as avgPartySize,
          COUNT(DISTINCT DATE(r.date)) as daysActive
        FROM reservations r
        LEFT JOIN tables t ON r.tableId = t.id
        LEFT JOIN areas a ON t.areaId = a.id
        WHERE r.date >= ${start} 
          AND r.date <= ${end}
          AND r.status IN ('confirmed', 'seated', 'completed')
          AND t.isActive = true
        ${restaurantId ? `AND a.restaurantId = ${restaurantId}` : ''}
        ${areaId ? `AND t.areaId = ${areaId}` : ''}
        GROUP BY strftime('%H', r.startTime)
        ORDER BY occupiedTables DESC, reservationCount DESC
      `;

      // Get table size utilization
      const tableSizeUtilization = await db.prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN t.capacity <= 2 THEN 'Small (1-2)'
            WHEN t.capacity <= 4 THEN 'Medium (3-4)'
            WHEN t.capacity <= 6 THEN 'Large (5-6)'
            ELSE 'Extra Large (7+)'
          END as tableSize,
          COUNT(DISTINCT t.id) as totalTables,
          COUNT(r.id) as totalReservations,
          SUM(r.partySize) as totalGuests,
          AVG(r.partySize) as avgPartySize,
          ROUND(
            (SUM(r.partySize) * 100.0 / (COUNT(r.id) * AVG(t.capacity))), 2
          ) as utilizationRate
        FROM tables t
        LEFT JOIN areas a ON t.areaId = a.id
        LEFT JOIN reservations r ON t.id = r.tableId 
          AND r.date >= ${start} 
          AND r.date <= ${end}
          AND r.status IN ('confirmed', 'seated', 'completed')
        WHERE t.isActive = true
        ${restaurantId ? `AND a.restaurantId = ${restaurantId}` : ''}
        ${areaId ? `AND t.areaId = ${areaId}` : ''}
        GROUP BY tableSize
        ORDER BY totalTables DESC
      `;

      // Get occupancy forecast (simple moving average)
      const occupancyForecast = await db.prisma.$queryRaw`
        WITH daily_occupancy AS (
          SELECT 
            DATE(date) as day,
            COUNT(DISTINCT r.tableId) as occupiedTables,
            (SELECT COUNT(*) FROM tables t2 
             LEFT JOIN areas a2 ON t2.areaId = a2.id
             WHERE t2.isActive = true
             ${restaurantId ? `AND a2.restaurantId = ${restaurantId}` : ''}
             ${areaId ? `AND t2.areaId = ${areaId}` : ''}) as totalTables
          FROM reservations r
          LEFT JOIN tables t ON r.tableId = t.id
          LEFT JOIN areas a ON t.areaId = a.id
          WHERE r.date >= date('now', '-14 days') 
            AND r.date <= date('now', '-1 day')
            AND r.status IN ('confirmed', 'seated', 'completed')
            AND t.isActive = true
          ${restaurantId ? `AND a.restaurantId = ${restaurantId}` : ''}
          ${areaId ? `AND t.areaId = ${areaId}` : ''}
          GROUP BY DATE(date)
        )
        SELECT 
          day,
          occupiedTables,
          totalTables,
          ROUND(
            (occupiedTables * 100.0 / totalTables), 2
          ) as occupancyRate,
          ROUND(AVG(occupancyRate) OVER (
            ORDER BY day 
            ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
          ), 2) as movingAverage
        FROM daily_occupancy
        ORDER BY day ASC
      `;

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalTables,
            totalAreas: areas.length,
          },
          trends: occupancyTrends,
          hourlyOccupancy,
          areaPerformance,
          tablePerformance,
          peakHours,
          tableSizeUtilization,
          occupancyForecast,
          period: {
            start,
            end,
            groupBy,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching occupancy analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch occupancy analytics' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff']
);