import { PrismaClient } from '@prisma/client';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function getPrismaClient(): PrismaClient {
  // In development, prevent hot-reloading from creating new instances
  if (typeof window !== 'undefined') {
    throw new Error('PrismaClient is not meant to be used in the browser');
  }

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-return-assign
    return (global.prisma ??= new PrismaClient());
  }

  return new PrismaClient();
}

export const prisma = getPrismaClient();

// Helper functions for common operations
export const db = {
  // User operations
  users: {
    findById: (id: string) => prisma.user.findUnique({ where: { id } }),
    findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
    create: (data: any) => prisma.user.create({ data }),
    update: (id: string, data: any) => prisma.user.update({ where: { id }, data }),
    delete: (id: string) => prisma.user.delete({ where: { id } }),
    findMany: (args?: any) => prisma.user.findMany(args),
  },
  
  // Restaurant operations
  restaurants: {
    findById: (id: string) => prisma.restaurant.findUnique({ where: { id } }),
    create: (data: any) => prisma.restaurant.create({ data }),
    update: (id: string, data: any) => prisma.restaurant.update({ where: { id }, data }),
    delete: (id: string) => prisma.restaurant.delete({ where: { id } }),
    findMany: (args?: any) => prisma.restaurant.findMany(args),
    findFirst: () => prisma.restaurant.findFirst(),
  },
  
  // Table operations
  tables: {
    findById: (id: string) => prisma.table.findUnique({ where: { id } }),
    create: (data: any) => prisma.table.create({ data }),
    update: (id: string, data: any) => prisma.table.update({ where: { id }, data }),
    delete: (id: string) => prisma.table.delete({ where: { id } }),
    findMany: (args?: any) => prisma.table.findMany(args),
    findByArea: (areaId: string) => prisma.table.findMany({ where: { areaId } }),
  },
  
  // Reservation operations
  reservations: {
    findById: (id: string) => prisma.reservation.findUnique({
      where: { id },
      include: { customer: true, table: { include: { area: true } } }
    }),
    create: (data: any) => prisma.reservation.create({ data }),
    update: (id: string, data: any) => prisma.reservation.update({ where: { id }, data }),
    delete: (id: string) => prisma.reservation.delete({ where: { id } }),
    findMany: (args?: any) => prisma.reservation.findMany(args),
    findByDate: (date: Date) => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      return prisma.reservation.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        include: { customer: true, table: true }
      });
    },
  },
  
  // Customer operations
  customers: {
    findById: (id: string) => prisma.customer.findUnique({ where: { id } }),
    findByEmail: (email: string) => prisma.customer.findUnique({ where: { email } }),
    create: (data: any) => prisma.customer.create({ data }),
    update: (id: string, data: any) => prisma.customer.update({ where: { id }, data }),
    delete: (id: string) => prisma.customer.delete({ where: { id } }),
    findMany: (args?: any) => prisma.customer.findMany(args),
  },
  
  // Area operations
  areas: {
    findById: (id: string) => prisma.area.findUnique({ where: { id } }),
    create: (data: any) => prisma.area.create({ data }),
    update: (id: string, data: any) => prisma.area.update({ where: { id }, data }),
    delete: (id: string) => prisma.area.delete({ where: { id } }),
    findMany: (args?: any) => prisma.area.findMany(args),
    findByRestaurant: (restaurantId: string) => prisma.area.findMany({ where: { restaurantId } }),
  },
  
  // Direct access to Prisma client for complex operations
  prisma,
};

export default db;