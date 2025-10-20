import { db } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';

export interface ReportFilters {
  startDate: Date;
  endDate: Date;
  restaurantId?: string;
  areaId?: string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
  format?: 'json' | 'csv' | 'pdf' | 'excel';
}

export interface ReservationReportData {
  id: string;
  customerName: string;
  customerEmail: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  partySize: number;
  status: string;
  tableName?: string;
  areaName?: string;
  specialRequests?: string;
  occasion?: string;
  source: string;
  depositAmount?: number;
  depositPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerReportData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  totalReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  noShowReservations: number;
  totalGuests: number;
  avgPartySize: number;
  totalSpent: number;
  avgSpentPerVisit: number;
  firstVisit: Date;
  lastVisit: Date;
  isVip: boolean;
  isBlacklisted: boolean;
  blacklistReason?: string;
}

export interface WaitlistReportData {
  id: string;
  customerName: string;
  customerEmail: string;
  date: Date;
  partySize: number;
  preferredTime?: string;
  areaName?: string;
  specialRequests?: string;
  status: string;
  priority: number;
  offeredAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialReportData {
  period: string;
  totalReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  noShowReservations: number;
  totalRevenue: number;
  totalDeposits: number;
  paidDeposits: number;
  unpaidDeposits: number;
  avgDepositAmount: number;
  avgPartySize: number;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
  revenuePerReservation: number;
  revenuePerGuest: number;
}

export interface ReportData {
  title: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalReservations: number;
    totalCustomers: number;
    totalRevenue: number;
    avgPartySize: number;
    completionRate: number;
  };
  data: ReservationReportData[] | CustomerReportData[] | WaitlistReportData[] | FinancialReportData[];
}

class ReportService {
  /**
   * Generate a reservation report
   */
  async generateReservationReport(filters: ReportFilters): Promise<ReportData> {
    const { startDate, endDate, restaurantId, areaId } = filters;

    const reservations = await db.prisma.reservation.findMany({
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
      include: {
        customer: true,
        table: {
          include: {
            area: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    const reportData: ReservationReportData[] = reservations.map(reservation => ({
      id: reservation.id,
      customerName: `${reservation.customer.firstName} ${reservation.customer.lastName}`,
      customerEmail: reservation.customer.email,
      date: reservation.date,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      partySize: reservation.partySize,
      status: reservation.status,
      tableName: reservation.table?.number,
      areaName: reservation.table?.area.name,
      specialRequests: reservation.specialRequests || undefined,
      occasion: reservation.occasion || undefined,
      source: reservation.source,
      depositAmount: reservation.depositAmount || undefined,
      depositPaid: reservation.depositPaid,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    }));

    const totalReservations = reservations.length;
    const completedReservations = reservations.filter(r => r.status === 'completed').length;
    const totalRevenue = reservations
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.depositAmount || 0), 0);
    const avgPartySize = totalReservations > 0 
      ? reservations.reduce((sum, r) => sum + r.partySize, 0) / totalReservations 
      : 0;
    const completionRate = totalReservations > 0 ? (completedReservations / totalReservations) * 100 : 0;

    return {
      title: 'Reservation Report',
      generatedAt: new Date(),
      period: {
        start: startDate,
        end: endDate,
      },
      summary: {
        totalReservations,
        totalCustomers: new Set(reservations.map(r => r.customerId)).size,
        totalRevenue,
        avgPartySize,
        completionRate,
      },
      data: reportData,
    };
  }

  /**
   * Generate a customer report
   */
  async generateCustomerReport(filters: ReportFilters): Promise<ReportData> {
    const { startDate, endDate, restaurantId } = filters;

    // Get customers with reservation data in the specified period
    const customersWithReservations = await db.prisma.customer.findMany({
      where: {
        reservations: {
          some: {
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
          },
        },
      },
      include: {
        reservations: {
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
          },
        },
      },
    });

    const reportData: CustomerReportData[] = customersWithReservations.map(customer => {
      const reservations = customer.reservations;
      const totalReservations = reservations.length;
      const completedReservations = reservations.filter(r => r.status === 'completed').length;
      const cancelledReservations = reservations.filter(r => r.status === 'cancelled').length;
      const noShowReservations = reservations.filter(r => r.status === 'no_show').length;
      const totalGuests = reservations.reduce((sum, r) => sum + r.partySize, 0);
      const avgPartySize = totalReservations > 0 ? totalGuests / totalReservations : 0;
      const totalSpent = reservations
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + (r.depositAmount || 0), 0);
      const avgSpentPerVisit = completedReservations > 0 ? totalSpent / completedReservations : 0;
      const firstVisit = new Date(Math.min(...reservations.map(r => r.date.getTime())));
      const lastVisit = new Date(Math.max(...reservations.map(r => r.date.getTime())));

      return {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone || undefined,
        totalReservations,
        completedReservations,
        cancelledReservations,
        noShowReservations,
        totalGuests,
        avgPartySize,
        totalSpent,
        avgSpentPerVisit,
        firstVisit,
        lastVisit,
        isVip: customer.isVip,
        isBlacklisted: customer.isBlacklisted,
        blacklistReason: customer.blacklistReason || undefined,
      };
    });

    const totalCustomers = customersWithReservations.length;
    const totalReservations = reportData.reduce((sum, c) => sum + c.totalReservations, 0);
    const completedReservations = reportData.reduce((sum, c) => sum + c.completedReservations, 0);
    const totalRevenue = reportData.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgPartySize = totalReservations > 0 
      ? reportData.reduce((sum, c) => sum + c.totalGuests, 0) / totalReservations 
      : 0;
    const completionRate = totalReservations > 0 ? (completedReservations / totalReservations) * 100 : 0;

    return {
      title: 'Customer Report',
      generatedAt: new Date(),
      period: {
        start: startDate,
        end: endDate,
      },
      summary: {
        totalReservations,
        totalCustomers,
        totalRevenue,
        avgPartySize,
        completionRate,
      },
      data: reportData,
    };
  }

  /**
   * Generate a waitlist report
   */
  async generateWaitlistReport(filters: ReportFilters): Promise<ReportData> {
    const { startDate, endDate, restaurantId, areaId } = filters;

    const waitlistEntries = await db.prisma.waitlistEntry.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        ...(restaurantId && {
          area: {
            restaurantId,
          },
        }),
        ...(areaId && {
          areaId,
        }),
      },
      include: {
        customer: true,
        area: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const reportData: WaitlistReportData[] = waitlistEntries.map(entry => ({
      id: entry.id,
      customerName: `${entry.customer.firstName} ${entry.customer.lastName}`,
      customerEmail: entry.customer.email,
      date: entry.date,
      partySize: entry.partySize,
      preferredTime: entry.preferredTime || undefined,
      areaName: entry.area?.name,
      specialRequests: entry.specialRequests || undefined,
      status: entry.status,
      priority: entry.priority,
      offeredAt: entry.offeredAt || undefined,
      expiresAt: entry.expiresAt,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

    const totalReservations = waitlistEntries.length;
    const totalCustomers = new Set(waitlistEntries.map(e => e.customerId)).size;
    const completedReservations = waitlistEntries.filter(e => e.status === 'offered').length;
    const avgPartySize = totalReservations > 0 
      ? waitlistEntries.reduce((sum, e) => sum + e.partySize, 0) / totalReservations 
      : 0;
    const completionRate = totalReservations > 0 ? (completedReservations / totalReservations) * 100 : 0;

    return {
      title: 'Waitlist Report',
      generatedAt: new Date(),
      period: {
        start: startDate,
        end: endDate,
      },
      summary: {
        totalReservations,
        totalCustomers,
        totalRevenue: 0, // Not applicable for waitlist
        avgPartySize,
        completionRate,
      },
      data: reportData,
    };
  }

  /**
   * Generate a financial report
   */
  async generateFinancialReport(filters: ReportFilters): Promise<ReportData> {
    const { startDate, endDate, restaurantId, areaId, groupBy = 'month' } = filters;

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

    const financialData = await db.prisma.$queryRaw`
      SELECT 
        strftime(${dateFormat}, r.date) as period,
        COUNT(r.id) as totalReservations,
        SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completedReservations,
        SUM(CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END) as cancelledReservations,
        SUM(CASE WHEN r.status = 'no_show' THEN 1 ELSE 0 END) as noShowReservations,
        COALESCE(SUM(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE 0 END), 0) as totalRevenue,
        COALESCE(SUM(r.depositAmount), 0) as totalDeposits,
        COALESCE(SUM(CASE WHEN r.depositPaid = true THEN r.depositAmount ELSE 0 END), 0) as paidDeposits,
        COALESCE(SUM(CASE WHEN r.depositPaid = false THEN r.depositAmount ELSE 0 END), 0) as unpaidDeposits,
        COALESCE(AVG(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE NULL END), 0) as avgDepositAmount,
        COALESCE(AVG(r.partySize), 0) as avgPartySize
      FROM reservations r
      LEFT JOIN tables t ON r.tableId = t.id
      LEFT JOIN areas a ON t.areaId = a.id
      WHERE r.date >= ${startDate} AND r.date <= ${endDate}
      ${restaurantId ? `AND a.restaurantId = ${restaurantId}` : ''}
      ${areaId ? `AND t.areaId = ${areaId}` : ''}
      GROUP BY strftime(${dateFormat}, r.date)
      ORDER BY period ASC
    ` as any[];

    const reportData: FinancialReportData[] = financialData.map(data => {
      const totalReservations = Number(data.totalReservations);
      const completedReservations = Number(data.completedReservations);
      const cancelledReservations = Number(data.cancelledReservations);
      const noShowReservations = Number(data.noShowReservations);
      const totalRevenue = Number(data.totalRevenue);
      const avgPartySize = Number(data.avgPartySize);
      const totalDeposits = Number(data.totalDeposits);
      const paidDeposits = Number(data.paidDeposits);
      const unpaidDeposits = Number(data.unpaidDeposits);
      const avgDepositAmount = Number(data.avgDepositAmount);

      return {
        period: data.period,
        totalReservations,
        completedReservations,
        cancelledReservations,
        noShowReservations,
        totalRevenue,
        totalDeposits,
        paidDeposits,
        unpaidDeposits,
        avgDepositAmount,
        avgPartySize,
        completionRate: totalReservations > 0 ? (completedReservations / totalReservations) * 100 : 0,
        cancellationRate: totalReservations > 0 ? (cancelledReservations / totalReservations) * 100 : 0,
        noShowRate: totalReservations > 0 ? (noShowReservations / totalReservations) * 100 : 0,
        revenuePerReservation: completedReservations > 0 ? totalRevenue / completedReservations : 0,
        revenuePerGuest: completedReservations > 0 ? totalRevenue / (completedReservations * avgPartySize) : 0,
      };
    });

    const totalReservations = reportData.reduce((sum, d) => sum + d.totalReservations, 0);
    const completedReservations = reportData.reduce((sum, d) => sum + d.completedReservations, 0);
    const totalRevenue = reportData.reduce((sum, d) => sum + d.totalRevenue, 0);
    const avgPartySize = totalReservations > 0 
      ? reportData.reduce((sum, d) => sum + (d.totalReservations * d.avgPartySize), 0) / totalReservations 
      : 0;
    const completionRate = totalReservations > 0 ? (completedReservations / totalReservations) * 100 : 0;

    return {
      title: 'Financial Report',
      generatedAt: new Date(),
      period: {
        start: startDate,
        end: endDate,
      },
      summary: {
        totalReservations,
        totalCustomers: 0, // Not applicable for financial report
        totalRevenue,
        avgPartySize,
        completionRate,
      },
      data: reportData,
    };
  }

  /**
   * Export report data to CSV format
   */
  async exportToCSV(reportData: ReportData): Promise<string> {
    if (!reportData.data.length) return '';

    const headers = Object.keys(reportData.data[0]).join(',');
    const rows = reportData.data.map(item => 
      Object.values(item).map(value => 
        typeof value === 'string' ? `"${value}"` : value
      ).join(',')
    ).join('\n');

    return `${headers}\n${rows}`;
  }

  /**
   * Export report data to JSON format
   */
  async exportToJSON(reportData: ReportData): Promise<string> {
    return JSON.stringify(reportData, null, 2);
  }

  /**
   * Generate a summary report with key metrics
   */
  async generateSummaryReport(filters: ReportFilters): Promise<{
    totalReservations: number;
    totalCustomers: number;
    totalRevenue: number;
    avgPartySize: number;
    completionRate: number;
    topAreas: Array<{
      name: string;
      reservationCount: number;
      revenue: number;
    }>;
    topCustomers: Array<{
      name: string;
      email: string;
      reservationCount: number;
      totalSpent: number;
    }>;
    dailyTrends: Array<{
      date: string;
      reservations: number;
      revenue: number;
    }>;
  }> {
    const { startDate, endDate, restaurantId } = filters;

    // Get basic metrics
    const [totalReservations, totalRevenue, topAreas, topCustomers, dailyTrends] = await Promise.all([
      // Total reservations
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
        },
      }),
      
      // Total revenue
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
        },
        _sum: {
          depositAmount: true,
        },
      }).then(result => result._sum.depositAmount || 0),
      
      // Top areas by reservations
      db.prisma.$queryRaw`
        SELECT
          a.name,
          COUNT(r.id) as reservationCount,
          COALESCE(SUM(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE 0 END), 0) as revenue
        FROM areas a
        LEFT JOIN tables t ON a.id = t.areaId
        LEFT JOIN reservations r ON t.id = r.tableId
          AND r.date >= ${startDate}
          AND r.date <= ${endDate}
        WHERE a.isActive = true
        ${restaurantId ? `AND a.restaurantId = ${restaurantId}` : ''}
        GROUP BY a.id, a.name
        ORDER BY reservationCount DESC
        LIMIT 5
      ` as unknown as Array<{ name: string; reservationCount: number; revenue: number }>,
      
      // Top customers by reservations
      db.prisma.$queryRaw`
        SELECT
          c.firstName || ' ' || c.lastName as name,
          c.email,
          COUNT(r.id) as reservationCount,
          COALESCE(SUM(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE 0 END), 0) as totalSpent
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
        LIMIT 5
      ` as unknown as Array<{ name: string; email: string; reservationCount: number; totalSpent: number }>,
      
      // Daily trends
      db.prisma.$queryRaw`
        SELECT
          DATE(r.date) as date,
          COUNT(r.id) as reservations,
          COALESCE(SUM(CASE WHEN r.status = 'completed' THEN r.depositAmount ELSE 0 END), 0) as revenue
        FROM reservations r
        LEFT JOIN tables t ON r.tableId = t.id
        LEFT JOIN areas a ON t.areaId = a.id
        WHERE r.date >= ${startDate} AND r.date <= ${endDate}
        ${restaurantId ? `AND a.restaurantId = ${restaurantId}` : ''}
        GROUP BY DATE(r.date)
        ORDER BY date ASC
      ` as unknown as Array<{ date: string; reservations: number; revenue: number }>,
    ]);

    const totalCustomers = await db.prisma.reservation.findMany({
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
      },
      select: {
        customerId: true,
      },
      distinct: ['customerId'],
    }).then(reservations => reservations.length);

    const completedReservations = await db.prisma.reservation.count({
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
      },
    });

    const avgPartySize = totalReservations > 0 
      ? await db.prisma.reservation.aggregate({
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
          },
          _avg: {
            partySize: true,
          },
        }).then(result => result._avg.partySize || 0)
      : 0;

    const completionRate = totalReservations > 0 ? (completedReservations / totalReservations) * 100 : 0;

    return {
      totalReservations,
      totalCustomers,
      totalRevenue,
      avgPartySize,
      completionRate,
      topAreas,
      topCustomers,
      dailyTrends,
    };
  }
}

export default new ReportService();