import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

// Get customer analytics
export const GET = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const restaurantId = searchParams.get('restaurantId');
      const segment = searchParams.get('segment'); // new, returning, vip, at-risk
      const groupBy = searchParams.get('groupBy') || 'month'; // day, week, month

      // Set default date range if not provided
      const now = new Date();
      let start = startDate ? new Date(startDate) : new Date(now);
      let end = endDate ? new Date(endDate) : new Date(now);

      if (!startDate || !endDate) {
        // Default to last 90 days
        start.setDate(now.getDate() - 90);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      }

      // Get customer acquisition trends
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

      const customerAcquisition = await db.prisma.$queryRaw`
        SELECT 
          strftime(${dateFormat}, c.createdAt) as period,
          COUNT(DISTINCT c.id) as newCustomers,
          COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN c.id END) as activeCustomers,
          COUNT(DISTINCT CASE WHEN c.isVip = true THEN c.id END) as vipCustomers,
          COUNT(DISTINCT CASE WHEN c.isBlacklisted = true THEN c.id END) as blacklistedCustomers
        FROM customers c
        LEFT JOIN reservations r ON c.id = r.customerId 
          AND r.date >= ${start} 
          AND r.date <= ${end}
        WHERE c.createdAt >= ${start} AND c.createdAt <= ${end}
        GROUP BY strftime(${dateFormat}, c.createdAt)
        ORDER BY period ASC
      `;

      // Get customer segmentation
      const customerSegmentation = await db.prisma.$queryRaw`
        WITH customer_stats AS (
          SELECT 
            c.id,
            c.firstName,
            c.lastName,
            c.email,
            c.isVip,
            c.isBlacklisted,
            COUNT(r.id) as totalReservations,
            SUM(r.partySize) as totalGuests,
            MIN(r.date) as firstVisit,
            MAX(r.date) as lastVisit,
            AVG(r.partySize) as avgPartySize,
            SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completedReservations,
            SUM(CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END) as cancelledReservations,
            SUM(CASE WHEN r.status = 'no_show' THEN 1 ELSE 0 END) as noShowReservations,
            SUM(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE 0 END) as totalSpent,
            julianday('now') - julianday(MAX(r.date)) as daysSinceLastVisit
          FROM customers c
          LEFT JOIN reservations r ON c.id = r.customerId
            AND r.date <= ${end}
            ${restaurantId ? 
              `AND r.tableId IN (
                SELECT id FROM tables 
                WHERE areaId IN (
                  SELECT id FROM areas WHERE restaurantId = ${restaurantId}
                )
              )` : ''
            }
          GROUP BY c.id, c.firstName, c.lastName, c.email, c.isVip, c.isBlacklisted
        )
        SELECT 
          COUNT(*) as totalCustomers,
          SUM(CASE WHEN isVip = true THEN 1 ELSE 0 END) as vipCustomers,
          SUM(CASE WHEN isBlacklisted = true THEN 1 ELSE 0 END) as blacklistedCustomers,
          SUM(CASE WHEN totalReservations = 0 THEN 1 ELSE 0 END) as newCustomers,
          SUM(CASE WHEN totalReservations BETWEEN 1 AND 3 THEN 1 ELSE 0 END) as occasionalCustomers,
          SUM(CASE WHEN totalReservations BETWEEN 4 AND 10 THEN 1 ELSE 0 END) as regularCustomers,
          SUM(CASE WHEN totalReservations > 10 THEN 1 ELSE 0 END) as loyalCustomers,
          SUM(CASE WHEN daysSinceLastVisit > 90 AND totalReservations > 0 THEN 1 ELSE 0 END) as atRiskCustomers,
          AVG(totalReservations) as avgReservationsPerCustomer,
          AVG(totalSpent) as avgSpentPerCustomer,
          AVG(avgPartySize) as avgPartySizePerCustomer
        FROM customer_stats
      `;

      // Get top customers by various metrics
      const topCustomersByReservations = await db.prisma.$queryRaw`
        SELECT 
          c.id,
          c.firstName,
          c.lastName,
          c.email,
          c.isVip,
          COUNT(r.id) as totalReservations,
          SUM(r.partySize) as totalGuests,
          MAX(r.date) as lastVisit,
          AVG(r.partySize) as avgPartySize,
          SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completedReservations
        FROM customers c
        JOIN reservations r ON c.id = r.customerId
        WHERE r.date >= ${start} AND r.date <= ${end}
        ${restaurantId ? 
          `AND r.tableId IN (
            SELECT id FROM tables 
            WHERE areaId IN (
              SELECT id FROM areas WHERE restaurantId = ${restaurantId}
            )
          )` : ''
        }
        GROUP BY c.id, c.firstName, c.lastName, c.email, c.isVip
        ORDER BY totalReservations DESC
        LIMIT 20
      `;

      const topCustomersBySpending = await db.prisma.$queryRaw`
        SELECT 
          c.id,
          c.firstName,
          c.lastName,
          c.email,
          c.isVip,
          COUNT(r.id) as totalReservations,
          SUM(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE 0 END) as totalSpent,
          AVG(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE 0 END) as avgSpentPerVisit,
          MAX(r.date) as lastVisit
        FROM customers c
        JOIN reservations r ON c.id = r.customerId
        WHERE r.date >= ${start} AND r.date <= ${end}
          AND r.status = 'completed'
          AND r.depositAmount > 0
        ${restaurantId ? 
          `AND r.tableId IN (
            SELECT id FROM tables 
            WHERE areaId IN (
              SELECT id FROM areas WHERE restaurantId = ${restaurantId}
            )
          )` : ''
        }
        GROUP BY c.id, c.firstName, c.lastName, c.email, c.isVip
        ORDER BY totalSpent DESC
        LIMIT 20
      `;

      // Get customer retention analysis
      const customerRetention = await db.prisma.$queryRaw`
        WITH customer_visits AS (
          SELECT 
            c.id,
            c.createdAt as customerSince,
            COUNT(r.id) as totalVisits,
            MIN(r.date) as firstVisit,
            MAX(r.date) as lastVisit,
            julianday(MAX(r.date)) - julianday(MIN(r.date)) as daysBetweenFirstAndLast
          FROM customers c
          LEFT JOIN reservations r ON c.id = r.customerId
            AND r.date >= ${start} 
            AND r.date <= ${end}
            AND r.status = 'completed'
          ${restaurantId ? 
            `AND r.tableId IN (
              SELECT id FROM tables 
              WHERE areaId IN (
                SELECT id FROM areas WHERE restaurantId = ${restaurantId}
              )
            )` : ''
          }
          GROUP BY c.id, c.createdAt
          HAVING totalVisits > 0
        )
        SELECT 
          COUNT(*) as totalReturningCustomers,
          AVG(totalVisits) as avgVisitsPerCustomer,
          AVG(daysBetweenFirstAndLast) as avgCustomerLifespanDays,
          SUM(CASE WHEN totalVisits = 1 THEN 1 ELSE 0 END) as singleVisitCustomers,
          SUM(CASE WHEN totalVisits BETWEEN 2 AND 5 THEN 1 ELSE 0 END) as occasionalCustomers,
          SUM(CASE WHEN totalVisits BETWEEN 6 AND 15 THEN 1 ELSE 0 END) as regularCustomers,
          SUM(CASE WHEN totalVisits > 15 THEN 1 ELSE 0 END) as loyalCustomers,
          ROUND(
            (SUM(CASE WHEN totalVisits > 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
          ) as retentionRate
        FROM customer_visits
      `;

      // Get customer behavior patterns
      const customerBehavior = await db.prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN strftime('%H', r.startTime) BETWEEN '06' AND '11' THEN 'Morning'
            WHEN strftime('%H', r.startTime) BETWEEN '12' AND '17' THEN 'Afternoon'
            WHEN strftime('%H', r.startTime) BETWEEN '18' AND '23' THEN 'Evening'
            ELSE 'Late Night'
          END as timeOfDay,
          CASE 
            WHEN strftime('%w', r.date) = '0' THEN 'Sunday'
            WHEN strftime('%w', r.date) = '6' THEN 'Saturday'
            WHEN strftime('%w', r.date) = '5' THEN 'Friday'
            ELSE 'Weekday'
          END as dayOfWeek,
          COUNT(DISTINCT c.id) as uniqueCustomers,
          COUNT(r.id) as totalReservations,
          AVG(r.partySize) as avgPartySize,
          SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completedReservations
        FROM reservations r
        JOIN customers c ON r.customerId = c.id
        WHERE r.date >= ${start} AND r.date <= ${end}
        ${restaurantId ? 
          `AND r.tableId IN (
            SELECT id FROM tables 
            WHERE areaId IN (
              SELECT id FROM areas WHERE restaurantId = ${restaurantId}
            )
          )` : ''
        }
        GROUP BY timeOfDay, dayOfWeek
        ORDER BY totalReservations DESC
      `;

      // Get customer preferences analysis
      const customerPreferences = await db.prisma.$queryRaw`
        SELECT 
          r.occasion,
          COUNT(DISTINCT c.id) as uniqueCustomers,
          COUNT(r.id) as totalReservations,
          AVG(r.partySize) as avgPartySize,
          SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completedReservations
        FROM reservations r
        JOIN customers c ON r.customerId = c.id
        WHERE r.date >= ${start} 
          AND r.date <= ${end}
          AND r.occasion IS NOT NULL
        ${restaurantId ? 
          `AND r.tableId IN (
            SELECT id FROM tables 
            WHERE areaId IN (
              SELECT id FROM areas WHERE restaurantId = ${restaurantId}
            )
          )` : ''
        }
        GROUP BY r.occasion
        ORDER BY totalReservations DESC
      `;

      // Get customer churn analysis
      const customerChurn = await db.prisma.$queryRaw`
        WITH customer_activity AS (
          SELECT 
            c.id,
            c.createdAt,
            MAX(r.date) as lastVisitDate,
            COUNT(r.id) as totalVisits,
            CASE 
              WHEN MAX(r.date) IS NULL THEN 'Never Visited'
              WHEN julianday('now') - julianday(MAX(r.date)) > 90 THEN 'Churned'
              WHEN julianday('now') - julianday(MAX(r.date)) > 60 THEN 'At Risk'
              WHEN julianday('now') - julianday(MAX(r.date)) > 30 THEN 'Inactive'
              ELSE 'Active'
            END as activityStatus
          FROM customers c
          LEFT JOIN reservations r ON c.id = r.customerId
            ${restaurantId ? 
              `AND r.tableId IN (
                SELECT id FROM tables 
                WHERE areaId IN (
                  SELECT id FROM areas WHERE restaurantId = ${restaurantId}
                )
              )` : ''
            }
          GROUP BY c.id, c.createdAt
        )
        SELECT 
          activityStatus,
          COUNT(*) as customerCount,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM customer_activity), 2) as percentage,
          AVG(totalVisits) as avgVisits
        FROM customer_activity
        GROUP BY activityStatus
        ORDER BY customerCount DESC
      `;

      // Get customer lifetime value (CLV)
      const customerLifetimeValue = await db.prisma.$queryRaw`
        WITH customer_clv AS (
          SELECT 
            c.id,
            c.firstName,
            c.lastName,
            c.email,
            COUNT(r.id) as totalReservations,
            SUM(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE 0 END) as totalSpent,
            AVG(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE 0 END) as avgSpentPerVisit,
            SUM(r.partySize) as totalGuests,
            julianday(MAX(r.date)) - julianday(MIN(r.date)) as customerLifespanDays
          FROM customers c
          JOIN reservations r ON c.id = r.customerId
            AND r.status = 'completed'
          WHERE r.date <= ${end}
          ${restaurantId ? 
            `AND r.tableId IN (
              SELECT id FROM tables 
              WHERE areaId IN (
                SELECT id FROM areas WHERE restaurantId = ${restaurantId}
              )
            )` : ''
          }
          GROUP BY c.id, c.firstName, c.lastName, c.email
          HAVING totalReservations > 0
        )
        SELECT 
          COUNT(*) as totalCustomers,
          AVG(totalSpent) as avgCustomerValue,
          AVG(avgSpentPerVisit) as avgValuePerVisit,
          AVG(totalReservations) as avgVisitsPerCustomer,
          AVG(customerLifespanDays) as avgCustomerLifespanDays,
          AVG(totalSpent / (customerLifespanDays / 30)) as avgMonthlyValue,
          SUM(totalSpent) as totalValue
        FROM customer_clv
      `;

      return NextResponse.json({
        success: true,
        data: {
          acquisition: customerAcquisition,
          segmentation: Array.isArray(customerSegmentation) ? customerSegmentation[0] : customerSegmentation,
          topCustomers: {
            byReservations: topCustomersByReservations,
            bySpending: topCustomersBySpending,
          },
          retention: Array.isArray(customerRetention) ? customerRetention[0] : customerRetention,
          behavior: customerBehavior,
          preferences: customerPreferences,
          churn: customerChurn,
          lifetimeValue: Array.isArray(customerLifetimeValue) ? customerLifetimeValue[0] : customerLifetimeValue,
          period: {
            start,
            end,
            groupBy,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch customer analytics' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff']
);