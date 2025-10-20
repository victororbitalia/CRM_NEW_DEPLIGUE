import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

// Get reservation analytics
export const GET = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const restaurantId = searchParams.get('restaurantId');
      const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month
      const status = searchParams.get('status');

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

      // Build where clause
      let whereClause: any = {
        date: {
          gte: start,
          lte: end,
        },
        ...(restaurantId && {
          table: {
            area: {
              restaurantId,
            },
          },
        }),
        ...(status && { status }),
      };

      // Get reservation trends based on groupBy
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

      const reservationTrends = await db.prisma.$queryRaw`
        SELECT 
          strftime(${dateFormat}, date) as period,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
          SUM(CASE WHEN status = 'seated' THEN 1 ELSE 0 END) as seated,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as noShow,
          AVG(partySize) as avgPartySize,
          SUM(partySize) as totalGuests
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
        ${status ? `AND status = ${status}` : ''}
        GROUP BY strftime(${dateFormat}, date)
        ORDER BY period ASC
      `;

      // Get reservation status distribution
      const statusDistribution = await db.prisma.$queryRaw`
        SELECT 
          status,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reservations 
            WHERE date >= ${start} AND date <= ${end}
            ${restaurantId ? 
              `AND tableId IN (
                SELECT id FROM tables 
                WHERE areaId IN (
                  SELECT id FROM areas WHERE restaurantId = ${restaurantId}
                )
              )` : ''
            }), 2) as percentage
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
        GROUP BY status
        ORDER BY count DESC
      `;

      // Get party size distribution
      const partySizeDistribution = await db.prisma.$queryRaw`
        SELECT 
          partySize,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reservations 
            WHERE date >= ${start} AND date <= ${end}
            ${restaurantId ? 
              `AND tableId IN (
                SELECT id FROM tables 
                WHERE areaId IN (
                  SELECT id FROM areas WHERE restaurantId = ${restaurantId}
                )
              )` : ''
            }), 2) as percentage
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
        GROUP BY partySize
        ORDER BY partySize ASC
      `;

      // Get source distribution
      const sourceDistribution = await db.prisma.$queryRaw`
        SELECT 
          source,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reservations 
            WHERE date >= ${start} AND date <= ${end}
            ${restaurantId ? 
              `AND tableId IN (
                SELECT id FROM tables 
                WHERE areaId IN (
                  SELECT id FROM areas WHERE restaurantId = ${restaurantId}
                )
              )` : ''
            }), 2) as percentage
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
        GROUP BY source
        ORDER BY count DESC
      `;

      // Get time slot distribution
      const timeSlotDistribution = await db.prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN strftime('%H', startTime) BETWEEN '06' AND '11' THEN 'Morning (6AM-12PM)'
            WHEN strftime('%H', startTime) BETWEEN '12' AND '17' THEN 'Afternoon (12PM-6PM)'
            WHEN strftime('%H', startTime) BETWEEN '18' AND '23' THEN 'Evening (6PM-12AM)'
            ELSE 'Late Night (12AM-6AM)'
          END as timeSlot,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reservations 
            WHERE date >= ${start} AND date <= ${end}
            ${restaurantId ? 
              `AND tableId IN (
                SELECT id FROM tables 
                WHERE areaId IN (
                  SELECT id FROM areas WHERE restaurantId = ${restaurantId}
                )
              )` : ''
            }), 2) as percentage
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
        GROUP BY timeSlot
        ORDER BY count DESC
      `;

      // Get reservation duration analysis
      const durationAnalysis = await db.prisma.$queryRaw`
        SELECT 
          AVG(
            CASE 
              WHEN status = 'completed' THEN 
                (julianday(endTime) - julianday(startTime)) * 24 * 60
              ELSE NULL
            END
          ) as avgDurationMinutes,
          MIN(
            CASE 
              WHEN status = 'completed' THEN 
                (julianday(endTime) - julianday(startTime)) * 24 * 60
              ELSE NULL
            END
          ) as minDurationMinutes,
          MAX(
            CASE 
              WHEN status = 'completed' THEN 
                (julianday(endTime) - julianday(startTime)) * 24 * 60
              ELSE NULL
            END
          ) as maxDurationMinutes
        FROM reservations
        WHERE date >= ${start} AND date <= ${end}
        AND status = 'completed'
        ${restaurantId ? 
          `AND tableId IN (
            SELECT id FROM tables 
            WHERE areaId IN (
              SELECT id FROM areas WHERE restaurantId = ${restaurantId}
            )
          )` : ''
        }
      `;

      // Get cancellation reasons
      const cancellationReasons = await db.prisma.$queryRaw`
        SELECT 
          cancellationReason,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reservations 
            WHERE date >= ${start} AND date <= ${end}
            AND status = 'cancelled'
            ${restaurantId ? 
              `AND tableId IN (
                SELECT id FROM tables 
                WHERE areaId IN (
                  SELECT id FROM areas WHERE restaurantId = ${restaurantId}
                )
              )` : ''
            }), 2) as percentage
        FROM reservations
        WHERE date >= ${start} AND date <= ${end}
        AND status = 'cancelled'
        ${restaurantId ? 
          `AND tableId IN (
            SELECT id FROM tables 
            WHERE areaId IN (
              SELECT id FROM areas WHERE restaurantId = ${restaurantId}
            )
          )` : ''
        }
        GROUP BY cancellationReason
        ORDER BY count DESC
      `;

      // Get special occasions
      const specialOccasions = await db.prisma.$queryRaw`
        SELECT 
          occasion,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reservations 
            WHERE date >= ${start} AND date <= ${end}
            ${restaurantId ? 
              `AND tableId IN (
                SELECT id FROM tables 
                WHERE areaId IN (
                  SELECT id FROM areas WHERE restaurantId = ${restaurantId}
                )
              )` : ''
            }), 2) as percentage
        FROM reservations
        WHERE date >= ${start} AND date <= ${end}
        AND occasion IS NOT NULL
        ${restaurantId ? 
          `AND tableId IN (
            SELECT id FROM tables 
            WHERE areaId IN (
              SELECT id FROM areas WHERE restaurantId = ${restaurantId}
            )
          )` : ''
        }
        GROUP BY occasion
        ORDER BY count DESC
      `;

      return NextResponse.json({
        success: true,
        data: {
          trends: reservationTrends,
          statusDistribution,
          partySizeDistribution,
          sourceDistribution,
          timeSlotDistribution,
          durationAnalysis: Array.isArray(durationAnalysis) ? durationAnalysis[0] : durationAnalysis,
          cancellationReasons,
          specialOccasions,
          period: {
            start,
            end,
            groupBy,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching reservation analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reservation analytics' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff']
);