import { NextRequest, NextResponse } from 'next/server';
import { withAuthHandler } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Get dashboard metrics
export const GET = withAuthHandler(
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const restaurantId = searchParams.get('restaurantId');
      const period = searchParams.get('period') || 'month'; // day, week, month, year

      // Set default date range if not provided
      const now = new Date();
      let start = startDate ? new Date(startDate) : new Date(now);
      let end = endDate ? new Date(endDate) : new Date(now);

      if (!startDate || !endDate) {
        // Default to current period
        switch (period) {
          case 'day':
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
          case 'week':
            start.setDate(now.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
          case 'month':
            start.setMonth(now.getMonth() - 1);
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
          case 'year':
            start.setFullYear(now.getFullYear() - 1);
            start.setMonth(0);
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        }
      }

      // Get basic metrics
      const [
        totalReservations,
        confirmedReservations,
        completedReservations,
        cancelledReservations,
        noShowReservations,
        totalCustomers,
        activeTables,
        totalRevenue
      ] = await Promise.all([
        // Total reservations in period
        db.prisma.reservation.count({
          where: {
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
          },
        }),
        
        // Confirmed reservations
        db.prisma.reservation.count({
          where: {
            date: {
              gte: start,
              lte: end,
            },
            status: 'confirmed',
            ...(restaurantId && {
              table: {
                area: {
                  restaurantId,
                },
              },
            }),
          },
        }),
        
        // Completed reservations
        db.prisma.reservation.count({
          where: {
            date: {
              gte: start,
              lte: end,
            },
            status: 'completed',
            ...(restaurantId && {
              table: {
                area: {
                  restaurantId,
                },
              },
            }),
          },
        }),
        
        // Cancelled reservations
        db.prisma.reservation.count({
          where: {
            date: {
              gte: start,
              lte: end,
            },
            status: 'cancelled',
            ...(restaurantId && {
              table: {
                area: {
                  restaurantId,
                },
              },
            }),
          },
        }),
        
        // No-show reservations
        db.prisma.reservation.count({
          where: {
            date: {
              gte: start,
              lte: end,
            },
            status: 'no_show',
            ...(restaurantId && {
              table: {
                area: {
                  restaurantId,
                },
              },
            }),
          },
        }),
        
        // Total unique customers
        db.prisma.reservation.findMany({
          where: {
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
          },
          select: {
            customerId: true,
          },
          distinct: ['customerId'],
        }).then(reservations => reservations.length),
        
        // Active tables
        db.prisma.table.count({
          where: {
            isActive: true,
            ...(restaurantId && {
              area: {
                restaurantId,
              },
            }),
          },
        }),
        
        // Total revenue (estimated from completed reservations)
        db.prisma.reservation.aggregate({
          where: {
            date: {
              gte: start,
              lte: end,
            },
            status: 'completed',
            ...(restaurantId && {
              table: {
                area: {
                  restaurantId,
                },
              },
            }),
          },
          _sum: {
            depositAmount: true,
          },
        }).then(result => result._sum.depositAmount || 0),
      ]);

      // Calculate derived metrics
      const totalTableCount = await db.prisma.table.count({
        where: {
          ...(restaurantId && {
            area: {
              restaurantId,
            },
          }),
        },
      });

      const occupancyRate = totalTableCount > 0 ? (activeTables / totalTableCount) * 100 : 0;
      const confirmationRate = totalReservations > 0 ? (confirmedReservations / totalReservations) * 100 : 0;
      const completionRate = totalReservations > 0 ? (completedReservations / totalReservations) * 100 : 0;
      const cancellationRate = totalReservations > 0 ? (cancelledReservations / totalReservations) * 100 : 0;
      const noShowRate = totalReservations > 0 ? (noShowReservations / totalReservations) * 100 : 0;

      // Get daily reservation data for charts
      const dailyReservations = await db.prisma.reservation.groupBy({
        by: ['date'],
        where: {
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
        },
        _count: {
          id: true,
        },
        _sum: {
          partySize: true,
          depositAmount: true,
        },
      });
      
      // Transform the data to match the expected format
      const transformedDailyReservations = dailyReservations.map(item => ({
        day: item.date.toISOString().split('T')[0],
        count: item._count.id,
        confirmed: 0, // Will be calculated separately if needed
        completed: 0,
        cancelled: 0,
        no_show: 0,
      }));

      // Get hourly reservation data for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const hourlyReservations = await db.prisma.reservation.findMany({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
          ...(restaurantId && {
            table: {
              area: {
                restaurantId,
              },
            },
          }),
        },
        select: {
          startTime: true,
        },
      });
      
      // Group by hour
      const hourlyData: Record<number, number> = {};
      hourlyReservations.forEach(reservation => {
        const hour = reservation.startTime.getHours();
        hourlyData[hour] = (hourlyData[hour] || 0) + 1;
      });
      
      // Transform to expected format
      const transformedHourlyReservations = Array.from({ length: 24 }, (_, i) => ({
        hour: i.toString().padStart(2, '0'),
        count: hourlyData[i] || 0,
      }));

      // Get area performance
      const areas = await db.prisma.area.findMany({
        where: restaurantId ? { restaurantId } : {},
        include: {
          tables: {
            include: {
              reservations: {
                where: {
                  date: {
                    gte: start,
                    lte: end,
                  },
                },
              },
            },
          },
        },
      });
      
      // Transform to expected format
      const areaPerformance = areas.map(area => {
        const allTables = area.tables.flat();
        const allReservations = allTables.flatMap(table => table.reservations);
        
        return {
          id: area.id,
          name: area.name,
          reservationCount: allReservations.length,
          avgPartySize: allReservations.length > 0
            ? allReservations.reduce((sum, r) => sum + r.partySize, 0) / allReservations.length
            : 0,
          completedCount: allReservations.filter(r => r.status === 'completed').length,
          cancelledCount: allReservations.filter(r => r.status === 'cancelled').length,
        };
      });

      // Get top customers by reservation count
      const topCustomers = await db.prisma.customer.findMany({
        where: {
          reservations: {
            some: {
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
            },
          },
        },
        include: {
          reservations: {
            where: {
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
            },
          },
        },
        take: 10,
      });
      
      // Transform to expected format
      const transformedTopCustomers = topCustomers.map(customer => {
        const reservations = customer.reservations;
        
        return {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          reservationCount: reservations.length,
          totalGuests: reservations.reduce((sum, r) => sum + r.partySize, 0),
          lastVisit: reservations.length > 0
            ? new Date(Math.max(...reservations.map(r => r.date.getTime()))).toISOString()
            : null,
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalReservations,
            confirmedReservations,
            completedReservations,
            cancelledReservations,
            noShowReservations,
            totalCustomers,
            activeTables,
            totalRevenue,
            occupancyRate: Math.round(occupancyRate * 100) / 100,
            confirmationRate: Math.round(confirmationRate * 100) / 100,
            completionRate: Math.round(completionRate * 100) / 100,
            cancellationRate: Math.round(cancellationRate * 100) / 100,
            noShowRate: Math.round(noShowRate * 100) / 100,
          },
          charts: {
            dailyReservations: transformedDailyReservations,
            hourlyReservations: transformedHourlyReservations,
            areaPerformance,
            topCustomers: transformedTopCustomers,
          },
          period: {
            start,
            end,
            type: period,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }
  },
  ['admin', 'manager', 'staff']
);