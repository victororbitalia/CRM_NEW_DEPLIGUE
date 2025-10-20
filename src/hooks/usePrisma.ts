import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';

// Generic hook for fetching data
export function usePrismaQuery<T>(
  queryFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await queryFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Hook for restaurants
export function useRestaurants() {
  return usePrismaQuery(
    () => db.restaurants.findMany({
      include: {
        settings: true,
        areas: {
          where: { isActive: true },
          include: {
            tables: {
              where: { isActive: true },
              select: {
                id: true,
                number: true,
                capacity: true,
                minCapacity: true,
                isAccessible: true,
              },
            },
          },
        },
      },
    }),
    []
  );
}

// Hook for a single restaurant
export function useRestaurant(id?: string) {
  return usePrismaQuery(
    () => {
      if (!id) throw new Error('Restaurant ID is required');
      return db.restaurants.findById(id);
    },
    [id]
  );
}

// Hook for tables
export function useTables(restaurantId?: string, areaId?: string) {
  return usePrismaQuery(
    async () => {
      if (areaId) {
        return db.prisma.table.findMany({
          where: { areaId, isActive: true },
          include: {
            area: true,
            reservations: {
              where: {
                date: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  lte: new Date(new Date().setHours(23, 59, 59, 999)),
                },
                status: {
                  in: ['pending', 'confirmed', 'seated'],
                },
              },
              orderBy: {
                startTime: 'asc',
              },
            },
          },
        });
      } else if (restaurantId) {
        const areas = await db.areas.findByRestaurant(restaurantId);
        const tablesPromises = areas.map(area => 
          db.prisma.table.findMany({
            where: { areaId: area.id, isActive: true },
            include: {
              area: true,
              reservations: {
                where: {
                  date: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lte: new Date(new Date().setHours(23, 59, 59, 999)),
                  },
                  status: {
                    in: ['pending', 'confirmed', 'seated'],
                  },
                },
                orderBy: {
                  startTime: 'asc',
                },
              },
            },
          })
        );
        const tablesArrays = await Promise.all(tablesPromises);
        return tablesArrays.flat();
      } else {
        return db.tables.findMany({
          where: { isActive: true },
          include: {
            area: true,
          },
        });
      }
    },
    [restaurantId, areaId]
  );
}

// Hook for a single table
export function useTable(id?: string) {
  return usePrismaQuery(
    () => {
      if (!id) throw new Error('Table ID is required');
      return db.tables.findById(id);
    },
    [id]
  );
}

// Hook for reservations
export function useReservations(date?: Date, status?: string) {
  return usePrismaQuery(
    () => {
      if (date) {
        return db.reservations.findByDate(date);
      } else {
        return db.reservations.findMany({
          include: {
            customer: true,
            table: {
              include: {
                area: true,
              },
            },
          },
          orderBy: {
            date: 'asc',
          },
        });
      }
    },
    [date, status]
  );
}

// Hook for a single reservation
export function useReservation(id?: string) {
  return usePrismaQuery(
    () => {
      if (!id) throw new Error('Reservation ID is required');
      return db.reservations.findById(id);
    },
    [id]
  );
}

// Hook for customers
export function useCustomers(search?: string) {
  return usePrismaQuery(
    () => {
      if (search) {
        return db.prisma.customer.findMany({
          where: {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
            ],
          },
          orderBy: {
            lastName: 'asc',
          },
        });
      } else {
        return db.customers.findMany({
          orderBy: {
            lastName: 'asc',
          },
        });
      }
    },
    [search]
  );
}

// Hook for a single customer
export function useCustomer(id?: string) {
  return usePrismaQuery(
    () => {
      if (!id) throw new Error('Customer ID is required');
      return db.customers.findById(id);
    },
    [id]
  );
}

// Hook for areas
export function useAreas(restaurantId?: string) {
  return usePrismaQuery(
    () => {
      if (restaurantId) {
        return db.areas.findByRestaurant(restaurantId);
      } else {
        return db.areas.findMany();
      }
    },
    [restaurantId]
  );
}

// Hook for operating hours
export function useOperatingHours(restaurantId?: string) {
  return usePrismaQuery(
    () => {
      if (!restaurantId) throw new Error('Restaurant ID is required');
      return db.prisma.operatingHour.findMany({
        where: { restaurantId },
        orderBy: { dayOfWeek: 'asc' },
      });
    },
    [restaurantId]
  );
}

// Hook for table availability
export function useTableAvailability(tableId?: string, date?: Date) {
  return usePrismaQuery(
    async () => {
      if (!tableId || !date) throw new Error('Table ID and date are required');
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const reservations = await db.prisma.reservation.findMany({
        where: {
          tableId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            in: ['pending', 'confirmed', 'seated'],
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      });
      
      return reservations;
    },
    [tableId, date]
  );
}

export default usePrismaQuery;