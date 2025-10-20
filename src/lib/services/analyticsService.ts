import { db } from '@/lib/db';

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  restaurantId?: string;
  areaId?: string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
}

export interface DashboardMetrics {
  totalReservations: number;
  confirmedReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  noShowReservations: number;
  totalCustomers: number;
  activeTables: number;
  totalRevenue: number;
  occupancyRate: number;
  confirmationRate: number;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
}

export interface DailyReservationData {
  day: string;
  count: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export interface HourlyReservationData {
  hour: string;
  count: number;
}

export interface AreaPerformanceData {
  id: string;
  name: string;
  reservationCount: number;
  avgPartySize: number;
  completedCount: number;
  cancelledCount: number;
}

export interface TopCustomerData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  reservationCount: number;
  totalGuests: number;
  lastVisit: string;
}

export interface AnalyticsData {
  summary: DashboardMetrics;
  charts: {
    dailyReservations: DailyReservationData[];
    hourlyReservations: HourlyReservationData[];
    areaPerformance: AreaPerformanceData[];
    topCustomers: TopCustomerData[];
  };
  period: {
    start: Date;
    end: Date;
    type: string;
  };
}

class AnalyticsService {
  /**
   * Get dashboard metrics with optional filtering
   */
  async getDashboardMetrics(filters: AnalyticsFilters = {}): Promise<AnalyticsData> {
    const {
      startDate = new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate = new Date(),
      restaurantId,
      areaId,
      groupBy = 'day'
    } = filters;

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
            gte: startDate,
            lte: endDate,
          },
          ...(restaurantId && {
            table: {
              area: {
                restaurantId,
              },
            },
          }),
          ...(areaId && {
            table: {
              areaId,
            },
          }),
        },
      }),
      
      // Confirmed reservations
      db.prisma.reservation.count({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
          status: 'confirmed',
          ...(restaurantId && {
            table: {
              area: {
                restaurantId,
              },
            },
          }),
          ...(areaId && {
            table: {
              areaId,
            },
          }),
        },
      }),
      
      // Completed reservations
      db.prisma.reservation.count({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
          status: 'completed',
          ...(restaurantId && {
            table: {
              area: {
                restaurantId,
              },
            },
          }),
          ...(areaId && {
            table: {
              areaId,
            },
          }),
        },
      }),
      
      // Cancelled reservations
      db.prisma.reservation.count({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
          status: 'cancelled',
          ...(restaurantId && {
            table: {
              area: {
                restaurantId,
              },
            },
          }),
          ...(areaId && {
            table: {
              areaId,
            },
          }),
        },
      }),
      
      // No-show reservations
      db.prisma.reservation.count({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
          status: 'no_show',
          ...(restaurantId && {
            table: {
              area: {
                restaurantId,
              },
            },
          }),
          ...(areaId && {
            table: {
              areaId,
            },
          }),
        },
      }),
      
      // Total unique customers
      db.prisma.reservation.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
          ...(restaurantId && {
            table: {
              area: {
                restaurantId,
              },
            },
          }),
          ...(areaId && {
            table: {
              areaId,
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
          ...(restaurantId && !areaId && {
            area: {
              restaurantId,
            },
          }),
          ...(areaId && {
            areaId,
          }),
        },
      }),
      
      // Total revenue (estimated from completed reservations)
      db.prisma.reservation.aggregate({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
          status: 'completed',
          ...(restaurantId && {
            table: {
              area: {
                restaurantId,
              },
            },
          }),
          ...(areaId && {
            table: {
              areaId,
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
        ...(restaurantId && !areaId && {
          area: {
            restaurantId,
          },
        }),
        ...(areaId && {
          areaId,
        }),
      },
    });

    const occupancyRate = totalTableCount > 0 ? (activeTables / totalTableCount) * 100 : 0;
    const confirmationRate = totalReservations > 0 ? (confirmedReservations / totalReservations) * 100 : 0;
    const completionRate = totalReservations > 0 ? (completedReservations / totalReservations) * 100 : 0;
    const cancellationRate = totalReservations > 0 ? (cancelledReservations / totalReservations) * 100 : 0;
    const noShowRate = totalReservations > 0 ? (noShowReservations / totalReservations) * 100 : 0;

    // Get daily reservation data for charts
    const dailyReservations = await this.getDailyReservationData(startDate, endDate, restaurantId, areaId);

    // Get hourly reservation data for today
    const hourlyReservations = await this.getHourlyReservationData(restaurantId, areaId);

    // Get area performance
    const areaPerformance = await this.getAreaPerformanceData(startDate, endDate, restaurantId);

    // Get top customers by reservation count
    const topCustomers = await this.getTopCustomersData(startDate, endDate, restaurantId);

    return {
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
        dailyReservations,
        hourlyReservations,
        areaPerformance,
        topCustomers,
      },
      period: {
        start: startDate,
        end: endDate,
        type: groupBy,
      },
    };
  }

  /**
   * Get daily reservation data
   */
  private async getDailyReservationData(
    startDate: Date,
    endDate: Date,
    restaurantId?: string,
    areaId?: string
  ): Promise<DailyReservationData[]> {
    return await db.prisma.$queryRaw`
      SELECT 
        DATE(date) as day,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as noShow
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
      ORDER BY day ASC
    ` as DailyReservationData[];
  }

  /**
   * Get hourly reservation data for today
   */
  private async getHourlyReservationData(
    restaurantId?: string,
    areaId?: string
  ): Promise<HourlyReservationData[]> {
    return await db.prisma.$queryRaw`
      SELECT 
        strftime('%H', startTime) as hour,
        COUNT(*) as count
      FROM reservations
      WHERE DATE(date) = DATE('now')
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
      GROUP BY strftime('%H', startTime)
      ORDER BY hour ASC
    ` as HourlyReservationData[];
  }

  /**
   * Get area performance data
   */
  private async getAreaPerformanceData(
    startDate: Date,
    endDate: Date,
    restaurantId?: string
  ): Promise<AreaPerformanceData[]> {
    return await db.prisma.$queryRaw`
      SELECT 
        a.id,
        a.name,
        COUNT(r.id) as reservationCount,
        AVG(r.partySize) as avgPartySize,
        SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completedCount,
        SUM(CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END) as cancelledCount
      FROM areas a
      LEFT JOIN tables t ON a.id = t.areaId
      LEFT JOIN reservations r ON t.id = r.tableId 
        AND r.date >= ${startDate} 
        AND r.date <= ${endDate}
      WHERE a.isActive = true
      ${restaurantId ? `AND a.restaurantId = ${restaurantId}` : ''}
      GROUP BY a.id, a.name
      ORDER BY reservationCount DESC
    ` as AreaPerformanceData[];
  }

  /**
   * Get top customers by reservation count
   */
  private async getTopCustomersData(
    startDate: Date,
    endDate: Date,
    restaurantId?: string
  ): Promise<TopCustomerData[]> {
    return await db.prisma.$queryRaw`
      SELECT 
        c.id,
        c.firstName,
        c.lastName,
        c.email,
        COUNT(r.id) as reservationCount,
        SUM(r.partySize) as totalGuests,
        MAX(r.date) as lastVisit
      FROM customers c
      JOIN reservations r ON c.id = r.customerId
      WHERE r.date >= ${startDate} AND r.date <= ${endDate}
      ${restaurantId ? 
        `AND r.tableId IN (
          SELECT id FROM tables 
          WHERE areaId IN (
            SELECT id FROM areas WHERE restaurantId = ${restaurantId}
          )
        )` : ''
      }
      GROUP BY c.id, c.firstName, c.lastName, c.email
      ORDER BY reservationCount DESC
      LIMIT 10
    ` as TopCustomerData[];
  }

  /**
   * Get metrics comparison between two periods
   */
  async getMetricsComparison(
    currentPeriod: AnalyticsFilters,
    previousPeriod: AnalyticsFilters
  ): Promise<{
    current: DashboardMetrics;
    previous: DashboardMetrics;
    changes: {
      totalReservations: number;
      confirmedReservations: number;
      completedReservations: number;
      cancelledReservations: number;
      noShowReservations: number;
      totalCustomers: number;
      activeTables: number;
      totalRevenue: number;
      occupancyRate: number;
      confirmationRate: number;
      completionRate: number;
      cancellationRate: number;
      noShowRate: number;
    };
  }> {
    const currentData = await this.getDashboardMetrics(currentPeriod);
    const previousData = await this.getDashboardMetrics(previousPeriod);

    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const changes = {
      totalReservations: calculateChange(
        currentData.summary.totalReservations,
        previousData.summary.totalReservations
      ),
      confirmedReservations: calculateChange(
        currentData.summary.confirmedReservations,
        previousData.summary.confirmedReservations
      ),
      completedReservations: calculateChange(
        currentData.summary.completedReservations,
        previousData.summary.completedReservations
      ),
      cancelledReservations: calculateChange(
        currentData.summary.cancelledReservations,
        previousData.summary.cancelledReservations
      ),
      noShowReservations: calculateChange(
        currentData.summary.noShowReservations,
        previousData.summary.noShowReservations
      ),
      totalCustomers: calculateChange(
        currentData.summary.totalCustomers,
        previousData.summary.totalCustomers
      ),
      activeTables: calculateChange(
        currentData.summary.activeTables,
        previousData.summary.activeTables
      ),
      totalRevenue: calculateChange(
        currentData.summary.totalRevenue,
        previousData.summary.totalRevenue
      ),
      occupancyRate: calculateChange(
        currentData.summary.occupancyRate,
        previousData.summary.occupancyRate
      ),
      confirmationRate: calculateChange(
        currentData.summary.confirmationRate,
        previousData.summary.confirmationRate
      ),
      completionRate: calculateChange(
        currentData.summary.completionRate,
        previousData.summary.completionRate
      ),
      cancellationRate: calculateChange(
        currentData.summary.cancellationRate,
        previousData.summary.cancellationRate
      ),
      noShowRate: calculateChange(
        currentData.summary.noShowRate,
        previousData.summary.noShowRate
      ),
    };

    return {
      current: currentData.summary,
      previous: previousData.summary,
      changes,
    };
  }
}

export default new AnalyticsService();