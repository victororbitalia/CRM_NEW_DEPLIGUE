import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

// Get financial analytics
export const GET = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const restaurantId = searchParams.get('restaurantId');
      const groupBy = searchParams.get('groupBy') || 'month'; // day, week, month, year

      // Set default date range if not provided
      const now = new Date();
      let start = startDate ? new Date(startDate) : new Date(now);
      let end = endDate ? new Date(endDate) : new Date(now);

      if (!startDate || !endDate) {
        // Default to last 12 months
        start.setFullYear(now.getFullYear() - 1);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      }

      // Calculate date format based on groupBy
      let dateFormat;
      switch (groupBy) {
        case 'day':
          dateFormat = "%Y-%m-%d";
          break;
        case 'week':
          dateFormat = "%Y-%W";
          break;
        case 'year':
          dateFormat = "%Y";
          break;
        case 'month':
        default:
          dateFormat = "%Y-%m";
          break;
      }

      // Get revenue trends
      const revenueTrends = await db.prisma.$queryRaw`
        SELECT 
          strftime(${dateFormat}, r.date) as period,
          COUNT(r.id) as totalReservations,
          SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completedReservations,
          SUM(CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END) as cancelledReservations,
          SUM(CASE WHEN r.status = 'no_show' THEN 1 ELSE 0 END) as noShowReservations,
          COALESCE(SUM(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE 0 END), 0) as revenue,
          COALESCE(SUM(r.depositAmount), 0) as totalDeposits,
          COALESCE(SUM(CASE WHEN r.depositPaid = true THEN r.depositAmount ELSE 0 END), 0) as paidDeposits,
          COALESCE(AVG(CASE WHEN r.status = 'completed' THEN r.partySize ELSE NULL END), 0) as avgPartySize,
          COALESCE(AVG(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE NULL END), 0) as avgDepositAmount
        FROM reservations r
        LEFT JOIN tables t ON r.tableId = t.id
        LEFT JOIN areas a ON t.areaId = a.id
        WHERE r.date >= ${start} AND r.date <= ${end}
        ${restaurantId ? `AND a.restaurantId = ${restaurantId}` : ''}
        GROUP BY strftime(${dateFormat}, r.date)
        ORDER BY period ASC
      `;

      // Get payment status analysis
      const paymentStatus = await db.prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN r.depositPaid = true AND r.status = 'completed' THEN 'Paid & Completed'
            WHEN r.depositPaid = true AND r.status != 'completed' THEN 'Paid & Not Completed'
            WHEN r.depositPaid = false AND r.status = 'completed' THEN 'Not Paid & Completed'
            WHEN r.depositPaid = false AND r.status = 'cancelled' THEN 'Not Paid & Cancelled'
            WHEN r.depositPaid = false AND r.status = 'no_show' THEN 'Not Paid & No Show'
            ELSE 'Other'
          END as paymentStatus,
          COUNT(r.id) as count,
          COALESCE(SUM(r.depositAmount), 0) as totalAmount,
          COALESCE(AVG(r.depositAmount), 0) as avgAmount
        FROM reservations r
        LEFT JOIN tables t ON r.tableId = t.id
        LEFT JOIN areas a ON t.areaId = a.id
        WHERE r.date >= ${start} AND r.date <= ${end}
        ${restaurantId ? `AND a.restaurantId = ${restaurantId}` : ''}
        GROUP BY paymentStatus
        ORDER BY totalAmount DESC
      `;

      // Get revenue by area
      const revenueByArea = await db.prisma.$queryRaw`
        SELECT 
          a.id,
          a.name,
          COUNT(r.id) as totalReservations,
          SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completedReservations,
          COALESCE(SUM(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE 0 END), 0) as revenue,
          COALESCE(AVG(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE NULL END), 0) as avgDepositAmount,
          SUM(r.partySize) as totalGuests,
          COALESCE(AVG(CASE WHEN r.status = 'completed' THEN r.partySize ELSE NULL END), 0) as avgPartySize,
          COUNT(DISTINCT t.id) as totalTables
        FROM areas a
        LEFT JOIN tables t ON a.id = t.areaId AND t.isActive = true
        LEFT JOIN reservations r ON t.id = r.tableId AND r.date >= ${start} AND r.date <= ${end}
        WHERE a.isActive = true
        ${restaurantId ? `AND a.restaurantId = ${restaurantId}` : ''}
        GROUP BY a.id, a.name
        ORDER BY revenue DESC
      `;

      // Get revenue by party size
      const revenueByPartySize = await db.prisma.$queryRaw`
        SELECT 
          r.partySize,
          COUNT(r.id) as totalReservations,
          SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completedReservations,
          COALESCE(SUM(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE 0 END), 0) as revenue,
          COALESCE(AVG(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE NULL END), 0) as avgDepositAmount,
          COALESCE(SUM(r.depositAmount), 0) as totalDeposits,
          ROUND(
            (SUM(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE 0 END) / 
             NULLIF(SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END), 0)), 2
          ) as revenuePerCompletedReservation
        FROM reservations r
        LEFT JOIN tables t ON r.tableId = t.id
        LEFT JOIN areas a ON t.areaId = a.id
        WHERE r.date >= ${start} AND r.date <= ${end}
        ${restaurantId ? `AND a.restaurantId = ${restaurantId}` : ''}
        GROUP BY r.partySize
        ORDER BY r.partySize ASC
      `;

      // Get revenue by time slot
      const revenueByTimeSlot = await db.prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN strftime('%H', r.startTime) BETWEEN '06' AND '11' THEN 'Morning (6AM-12PM)'
            WHEN strftime('%H', r.startTime) BETWEEN '12' AND '17' THEN 'Afternoon (12PM-6PM)'
            WHEN strftime('%H', r.startTime) BETWEEN '18' AND '23' THEN 'Evening (6PM-12AM)'
            ELSE 'Late Night (12AM-6AM)'
          END as timeSlot,
          COUNT(r.id) as totalReservations,
          SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completedReservations,
          COALESCE(SUM(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE 0 END), 0) as revenue,
          COALESCE(AVG(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE NULL END), 0) as avgDepositAmount,
          SUM(r.partySize) as totalGuests,
          COALESCE(AVG(CASE WHEN r.status = 'completed' THEN r.partySize ELSE NULL END), 0) as avgPartySize
        FROM reservations r
        LEFT JOIN tables t ON r.tableId = t.id
        LEFT JOIN areas a ON t.areaId = a.id
        WHERE r.date >= ${start} AND r.date <= ${end}
        ${restaurantId ? `AND a.restaurantId = ${restaurantId}` : ''}
        GROUP BY timeSlot
        ORDER BY revenue DESC
      `;

      // Get revenue by day of week
      const revenueByDayOfWeek = await db.prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN strftime('%w', r.date) = '0' THEN 'Sunday'
            WHEN strftime('%w', r.date) = '1' THEN 'Monday'
            WHEN strftime('%w', r.date) = '2' THEN 'Tuesday'
            WHEN strftime('%w', r.date) = '3' THEN 'Wednesday'
            WHEN strftime('%w', r.date) = '4' THEN 'Thursday'
            WHEN strftime('%w', r.date) = '5' THEN 'Friday'
            WHEN strftime('%w', r.date) = '6' THEN 'Saturday'
          END as dayOfWeek,
          COUNT(r.id) as totalReservations,
          SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completedReservations,
          COALESCE(SUM(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE 0 END), 0) as revenue,
          COALESCE(AVG(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE NULL END), 0) as avgDepositAmount,
          SUM(r.partySize) as totalGuests,
          COALESCE(AVG(CASE WHEN r.status = 'completed' THEN r.partySize ELSE NULL END), 0) as avgPartySize
        FROM reservations r
        LEFT JOIN tables t ON r.tableId = t.id
        LEFT JOIN areas a ON t.areaId = a.id
        WHERE r.date >= ${start} AND r.date <= ${end}
        ${restaurantId ? `AND a.restaurantId = ${restaurantId}` : ''}
        GROUP BY dayOfWeek
        ORDER BY revenue DESC
      `;

      // Get deposit analysis
      const depositAnalysis = await db.prisma.$queryRaw`
        SELECT 
          COUNT(r.id) as totalReservations,
          SUM(CASE WHEN r.depositAmount > 0 THEN 1 ELSE 0 END) as reservationsWithDeposit,
          SUM(CASE WHEN r.depositPaid = true THEN 1 ELSE 0 END) as paidDeposits,
          SUM(CASE WHEN r.depositPaid = false AND r.depositAmount > 0 THEN 1 ELSE 0 END) as unpaidDeposits,
          COALESCE(SUM(r.depositAmount), 0) as totalDepositAmount,
          COALESCE(SUM(CASE WHEN r.depositPaid = true THEN r.depositAmount ELSE 0 END), 0) as paidDepositAmount,
          COALESCE(SUM(CASE WHEN r.depositPaid = false THEN r.depositAmount ELSE 0 END), 0) as unpaidDepositAmount,
          COALESCE(AVG(CASE WHEN r.depositAmount > 0 THEN r.depositAmount ELSE NULL END), 0) as avgDepositAmount,
          ROUND(
            (SUM(CASE WHEN r.depositAmount > 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(r.id)), 2
          ) as depositRate,
          ROUND(
            (SUM(CASE WHEN r.depositPaid = true THEN 1 ELSE 0 END) * 100.0 / 
             NULLIF(SUM(CASE WHEN r.depositAmount > 0 THEN 1 ELSE 0 END), 0)), 2
          ) as paymentRate
        FROM reservations r
        LEFT JOIN tables t ON r.tableId = t.id
        LEFT JOIN areas a ON t.areaId = a.id
        WHERE r.date >= ${start} AND r.date <= ${end}
        ${restaurantId ? `AND a.restaurantId = ${restaurantId}` : ''}
      `;

      // Get cancellation financial impact
      const cancellationImpact = await db.prisma.$queryRaw`
        SELECT 
          COUNT(r.id) as totalCancelled,
          COALESCE(SUM(r.depositAmount), 0) as lostDeposits,
          COALESCE(SUM(CASE WHEN r.depositPaid = false THEN r.depositAmount ELSE 0 END), 0) as unpaidDeposits,
          COALESCE(SUM(CASE WHEN r.depositPaid = true THEN r.depositAmount ELSE 0 END), 0) as paidDeposits,
          COALESCE(AVG(r.partySize), 0) as avgPartySize,
          r.cancellationReason,
          COUNT(DISTINCT r.customerId) as uniqueCustomersAffected
        FROM reservations r
        LEFT JOIN tables t ON r.tableId = t.id
        LEFT JOIN areas a ON t.areaId = a.id
        WHERE r.date >= ${start} AND r.date <= ${end}
          AND r.status = 'cancelled'
        ${restaurantId ? `AND a.restaurantId = ${restaurantId}` : ''}
        GROUP BY r.cancellationReason
        ORDER BY lostDeposits DESC
      `;

      // Get no-show financial impact
      const noShowImpact = await db.prisma.$queryRaw`
        SELECT 
          COUNT(r.id) as totalNoShows,
          COALESCE(SUM(r.depositAmount), 0) as lostDeposits,
          COALESCE(SUM(CASE WHEN r.depositPaid = false THEN r.depositAmount ELSE 0 END), 0) as unpaidDeposits,
          COALESCE(SUM(CASE WHEN r.depositPaid = true THEN r.depositAmount ELSE 0 END), 0) as paidDeposits,
          COALESCE(AVG(r.partySize), 0) as avgPartySize,
          COUNT(DISTINCT r.customerId) as uniqueCustomersAffected
        FROM reservations r
        LEFT JOIN tables t ON r.tableId = t.id
        LEFT JOIN areas a ON t.areaId = a.id
        WHERE r.date >= ${start} AND r.date <= ${end}
          AND r.status = 'no_show'
        ${restaurantId ? `AND a.restaurantId = ${restaurantId}` : ''}
      `;

      // Get financial summary
      const financialSummary = await db.prisma.$queryRaw`
        SELECT 
          COUNT(r.id) as totalReservations,
          SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completedReservations,
          SUM(CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END) as cancelledReservations,
          SUM(CASE WHEN r.status = 'no_show' THEN 1 ELSE 0 END) as noShowReservations,
          COALESCE(SUM(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE 0 END), 0) as totalRevenue,
          COALESCE(SUM(r.depositAmount), 0) as totalPotentialRevenue,
          COALESCE(SUM(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE 0 END), 0) / 
          NULLIF(SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END), 0) as avgRevenuePerCompletedReservation,
          COALESCE(SUM(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE 0 END), 0) / 
          NULLIF(SUM(r.partySize), 0) as avgRevenuePerGuest,
          ROUND(
            (SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(r.id)), 2
          ) as completionRate,
          ROUND(
            (SUM(CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END) * 100.0 / COUNT(r.id)), 2
          ) as cancellationRate,
          ROUND(
            (SUM(CASE WHEN r.status = 'no_show' THEN 1 ELSE 0 END) * 100.0 / COUNT(r.id)), 2
          ) as noShowRate
        FROM reservations r
        LEFT JOIN tables t ON r.tableId = t.id
        LEFT JOIN areas a ON t.areaId = a.id
        WHERE r.date >= ${start} AND r.date <= ${end}
        ${restaurantId ? `AND a.restaurantId = ${restaurantId}` : ''}
      `;

      return NextResponse.json({
        success: true,
        data: {
          summary: Array.isArray(financialSummary) ? financialSummary[0] : financialSummary,
          trends: revenueTrends,
          paymentStatus,
          revenueByArea,
          revenueByPartySize,
          revenueByTimeSlot,
          revenueByDayOfWeek,
          depositAnalysis: Array.isArray(depositAnalysis) ? depositAnalysis[0] : depositAnalysis,
          cancellationImpact,
          noShowImpact: Array.isArray(noShowImpact) ? noShowImpact[0] : noShowImpact,
          period: {
            start,
            end,
            groupBy,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching financial analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch financial analytics' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager']
);