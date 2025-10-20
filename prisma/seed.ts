import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full access',
      permissions: {
        users: ['read', 'write', 'delete'],
        restaurants: ['read', 'write', 'delete'],
        tables: ['read', 'write', 'delete'],
        reservations: ['read', 'write', 'delete'],
        customers: ['read', 'write', 'delete'],
        settings: ['read', 'write'],
      },
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: {
      name: 'manager',
      description: 'Restaurant manager with limited access',
      permissions: {
        restaurants: ['read', 'write'],
        tables: ['read', 'write'],
        reservations: ['read', 'write'],
        customers: ['read', 'write'],
        settings: ['read'],
      },
    },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: 'staff' },
    update: {},
    create: {
      name: 'staff',
      description: 'Restaurant staff with basic access',
      permissions: {
        reservations: ['read', 'write'],
        customers: ['read', 'write'],
        tables: ['read'],
      },
    },
  });

  // Create users
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@restaurant.com' },
    update: {},
    create: {
      email: 'admin@restaurant.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+34 600 000 000',
      isActive: true,
      isEmailVerified: true,
      profile: {
        create: {
          bio: 'System administrator',
          timezone: 'Europe/Madrid',
          language: 'es',
        },
      },
    },
  });

  // Assign admin role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@restaurant.com' },
    update: {},
    create: {
      email: 'manager@restaurant.com',
      password: await bcrypt.hash('manager123', 10),
      firstName: 'Manager',
      lastName: 'User',
      phone: '+34 600 000 001',
      isActive: true,
      isEmailVerified: true,
      profile: {
        create: {
          bio: 'Restaurant manager',
          timezone: 'Europe/Madrid',
          language: 'es',
        },
      },
    },
  });

  // Assign manager role to manager user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: managerUser.id,
        roleId: managerRole.id,
      },
    },
    update: {},
    create: {
      userId: managerUser.id,
      roleId: managerRole.id,
    },
  });

  // Create restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'default-restaurant' },
    update: {},
    create: {
      id: 'default-restaurant',
      name: 'Restaurante Ejemplo',
      description: 'Un restaurante de ejemplo para el sistema CRM',
      address: 'Calle Principal, 123',
      city: 'Madrid',
      state: 'Comunidad de Madrid',
      postalCode: '28013',
      country: 'Spain',
      phone: '+34 910 000 000',
      email: 'info@restaurante-ejemplo.com',
      website: 'https://restaurante-ejemplo.com',
      timezone: 'Europe/Madrid',
      currency: 'EUR',
      isActive: true,
      settings: {
        create: {
          language: 'es',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
          defaultReservationDuration: 120,
          maxAdvanceBookingDays: 30,
          minAdvanceBookingHours: 2,
          maxPartySize: 20,
          enableOnlineBookings: true,
          enableWaitlist: true,
          confirmationEmailEnabled: true,
          reminderEmailEnabled: true,
          reminderEmailHoursBefore: 24,
          cancellationEmailEnabled: true,
          autoCancelNoShowMinutes: 15,
        },
      },
    },
  });

  // Create operating hours
  const days = [
    { dayOfWeek: 1, openTime: '12:00', closeTime: '16:00', isOpen: true }, // Monday
    { dayOfWeek: 1, openTime: '19:00', closeTime: '23:00', isOpen: true }, // Monday evening
    { dayOfWeek: 2, openTime: '12:00', closeTime: '16:00', isOpen: true }, // Tuesday
    { dayOfWeek: 2, openTime: '19:00', closeTime: '23:00', isOpen: true }, // Tuesday evening
    { dayOfWeek: 3, openTime: '12:00', closeTime: '16:00', isOpen: true }, // Wednesday
    { dayOfWeek: 3, openTime: '19:00', closeTime: '23:00', isOpen: true }, // Wednesday evening
    { dayOfWeek: 4, openTime: '12:00', closeTime: '16:00', isOpen: true }, // Thursday
    { dayOfWeek: 4, openTime: '19:00', closeTime: '23:00', isOpen: true }, // Thursday evening
    { dayOfWeek: 5, openTime: '12:00', closeTime: '16:00', isOpen: true }, // Friday
    { dayOfWeek: 5, openTime: '19:00', closeTime: '00:00', isOpen: true }, // Friday evening
    { dayOfWeek: 6, openTime: '13:00', closeTime: '00:00', isOpen: true }, // Saturday
    { dayOfWeek: 0, openTime: '13:00', closeTime: '22:00', isOpen: true }, // Sunday
  ];

  for (const day of days) {
    await prisma.operatingHour.upsert({
      where: {
        restaurantId_dayOfWeek_specialDate: {
          restaurantId: restaurant.id,
          dayOfWeek: day.dayOfWeek,
          specialDate: new Date(0), // Use epoch date for regular days
        },
      },
      update: {},
      create: {
        restaurantId: restaurant.id,
        dayOfWeek: day.dayOfWeek,
        openTime: day.openTime,
        closeTime: day.closeTime,
        isClosed: !day.isOpen,
      },
    });
  }

  // Create areas
  const interiorArea = await prisma.area.create({
    data: {
      restaurantId: restaurant.id,
      name: 'Interior',
      description: 'Área interior del restaurante',
      maxCapacity: 60,
      isActive: true,
    },
  });

  const terraceArea = await prisma.area.create({
    data: {
      restaurantId: restaurant.id,
      name: 'Terraza',
      description: 'Área de terraza exterior',
      maxCapacity: 30,
      isActive: true,
    },
  });

  const privateArea = await prisma.area.create({
    data: {
      restaurantId: restaurant.id,
      name: 'Salón Privado',
      description: 'Área privada para eventos especiales',
      maxCapacity: 20,
      isActive: true,
    },
  });

  // Create tables
  const tables = [];
  
  // Interior tables
  for (let i = 1; i <= 15; i++) {
    const capacity = i <= 5 ? 2 : i <= 10 ? 4 : 6;
    const table = await prisma.table.create({
      data: {
        areaId: interiorArea.id,
        number: `I${i.toString().padStart(2, '0')}`,
        capacity,
        minCapacity: 2,
        positionX: (i - 1) % 5 * 100,
        positionY: Math.floor((i - 1) / 5) * 100,
        width: 80,
        height: 80,
        shape: 'rectangle',
        isAccessible: i <= 3,
        isActive: true,
      },
    });
    tables.push(table);
  }

  // Terrace tables
  for (let i = 1; i <= 8; i++) {
    const capacity = i <= 4 ? 2 : 4;
    const table = await prisma.table.create({
      data: {
        areaId: terraceArea.id,
        number: `T${i.toString().padStart(2, '0')}`,
        capacity,
        minCapacity: 2,
        positionX: (i - 1) % 4 * 100,
        positionY: Math.floor((i - 1) / 4) * 100,
        width: 80,
        height: 80,
        shape: 'circle',
        isAccessible: i <= 2,
        isActive: true,
      },
    });
    tables.push(table);
  }

  // Private room tables
  for (let i = 1; i <= 4; i++) {
    const table = await prisma.table.create({
      data: {
        areaId: privateArea.id,
        number: `P${i.toString().padStart(2, '0')}`,
        capacity: 6,
        minCapacity: 4,
        positionX: (i - 1) % 2 * 120,
        positionY: Math.floor((i - 1) / 2) * 120,
        width: 100,
        height: 100,
        shape: 'rectangle',
        isAccessible: true,
        isActive: true,
      },
    });
    tables.push(table);
  }

  // Create sample customers
  const customers = [
    {
      firstName: 'Juan',
      lastName: 'García',
      email: 'juan.garcia@email.com',
      phone: '+34 600 100 000',
      isVip: true,
    },
    {
      firstName: 'María',
      lastName: 'López',
      email: 'maria.lopez@email.com',
      phone: '+34 600 100 001',
      isVip: false,
    },
    {
      firstName: 'Carlos',
      lastName: 'Martínez',
      email: 'carlos.martinez@email.com',
      phone: '+34 600 100 002',
      isVip: true,
    },
    {
      firstName: 'Ana',
      lastName: 'Sánchez',
      email: 'ana.sanchez@email.com',
      phone: '+34 600 100 003',
      isVip: false,
    },
    {
      firstName: 'Pedro',
      lastName: 'Rodríguez',
      email: 'pedro.rodriguez@email.com',
      phone: '+34 600 100 004',
      isVip: false,
    },
  ];

  const createdCustomers = [];
  for (const customerData of customers) {
    const customer = await prisma.customer.upsert({
      where: { email: customerData.email },
      update: {},
      create: {
        ...customerData,
        preferences: {
          preferredArea: 'interior',
          specialRequests: ['Sin gluten', 'Sin lactosa'],
        },
      },
    });
    createdCustomers.push(customer);
  }

  // Create sample reservations
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const reservations = [
    {
      customerId: createdCustomers[0].id,
      tableId: tables[0].id,
      date: tomorrow,
      startTime: new Date(tomorrow.setHours(14, 0, 0, 0)),
      endTime: new Date(tomorrow.setHours(16, 0, 0, 0)),
      partySize: 2,
      status: 'confirmed',
      specialRequests: 'Mesa cerca de la ventana',
      occasion: 'birthday',
      source: 'online',
      createdById: managerUser.id,
    },
    {
      customerId: createdCustomers[1].id,
      tableId: tables[5].id,
      date: tomorrow,
      startTime: new Date(tomorrow.setHours(20, 0, 0, 0)),
      endTime: new Date(tomorrow.setHours(22, 0, 0, 0)),
      partySize: 4,
      status: 'pending',
      specialRequests: 'Cumpleaños, necesitaríamos una tarta',
      occasion: 'birthday',
      source: 'phone',
      createdById: managerUser.id,
    },
    {
      customerId: createdCustomers[2].id,
      tableId: tables[16].id,
      date: tomorrow,
      startTime: new Date(tomorrow.setHours(21, 0, 0, 0)),
      endTime: new Date(tomorrow.setHours(23, 0, 0, 0)),
      partySize: 2,
      status: 'confirmed',
      specialRequests: 'Terraza si hace buen tiempo',
      source: 'manual',
      createdById: managerUser.id,
    },
  ];

  for (const reservationData of reservations) {
    await prisma.reservation.create({
      data: {
        ...reservationData,
        confirmedAt: reservationData.status === 'confirmed' ? new Date() : null,
      },
    });
  }

  // Create business rules
  await prisma.businessRule.createMany({
    data: [
      {
        restaurantId: restaurant.id,
        name: 'Política de cancelación',
        description: 'Cancelaciones con menos de 24 horas de antelación',
        ruleType: 'CANCELLATION_POLICY',
        conditions: {
          minHoursBeforeCancellation: 24,
        },
        actions: {
          chargeFee: true,
          feeAmount: 20,
          feeType: 'percentage',
        },
        isActive: true,
        priority: 1,
      },
      {
        restaurantId: restaurant.id,
        name: 'Límite de reserva anticipada',
        description: 'Máximo de días con antelación para reservar',
        ruleType: 'BOOKING_LIMITS',
        conditions: {
          maxAdvanceDays: 30,
        },
        actions: {
          blockBooking: true,
          message: 'No se pueden hacer reservas con más de 30 días de antelación',
        },
        isActive: true,
        priority: 2,
      },
      {
        restaurantId: restaurant.id,
        name: 'Política de no-show',
        description: 'Clientes que no se presentan sin previo aviso',
        ruleType: 'NO_SHOW_POLICY',
        conditions: {
          noShowCount: 3,
          timeFrame: '90 days',
        },
        actions: {
          blacklistCustomer: true,
          sendWarningEmail: true,
        },
        isActive: true,
        priority: 3,
      },
    ],
  });

  console.log('Database seeding completed successfully!');
  console.log('Default users created:');
  console.log('  - Admin: admin@restaurant.com / admin123');
  console.log('  - Manager: manager@restaurant.com / manager123');
}

main()
  .catch((e) => {
    console.error('Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });