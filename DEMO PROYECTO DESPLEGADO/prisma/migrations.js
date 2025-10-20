const { PrismaClient } = require('@prisma/client');

// Función para ejecutar la migración
async function runMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Iniciando migración con Prisma...');
    
    // Usar Prisma para ejecutar el SQL directamente
    await prisma.$executeRaw`
      -- Desactivar restricciones de clave externa temporalmente
      SET session_replication_role = replica;

      -- Borrar todas las tablas en orden correcto (primero las que dependen de otras)
      DROP TABLE IF EXISTS "Reservation" CASCADE;
      DROP TABLE IF EXISTS "Table" CASCADE;
      DROP TABLE IF EXISTS "Zone" CASCADE;
      DROP TABLE IF EXISTS "RestaurantSettings" CASCADE;

      -- Reactivar restricciones de clave externa
      SET session_replication_role = DEFAULT;

      -- Crear tabla Zone
      CREATE TABLE "Zone" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "displayName" TEXT NOT NULL,
          "color" TEXT NOT NULL DEFAULT '#e5e7eb',
          "boundaryX" REAL,
          "boundaryY" REAL,
          "width" REAL,
          "height" REAL,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
      );

      -- Crear índice único en Zone.name
      CREATE UNIQUE INDEX "Zone_name_key" ON "Zone"("name");

      -- Insertar zonas por defecto
      INSERT INTO "Zone" ("id", "name", "displayName", "color", "boundaryX", "boundaryY", "width", "height", "isActive", "createdAt", "updatedAt")
      VALUES
          ('zone-interior', 'interior', 'Interior', '#e5e7eb', 0, 0, 50, 100, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ('zone-terraza', 'terraza', 'Terraza', '#dbeafe', 50, 0, 50, 100, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

      -- Crear tabla Table
      CREATE TABLE "Table" (
          "id" TEXT NOT NULL,
          "number" INTEGER NOT NULL,
          "capacity" INTEGER NOT NULL,
          "location" TEXT NOT NULL,
          "isAvailable" BOOLEAN NOT NULL DEFAULT true,
          "positionX" REAL,
          "positionY" REAL,
          "zoneId" TEXT,

          CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
      );

      -- Crear índice único en Table.number
      CREATE UNIQUE INDEX "Table_number_key" ON "Table"("number");

      -- Añadir clave foránea para zoneId
      ALTER TABLE "Table" ADD CONSTRAINT "Table_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

      -- Crear tabla Reservation
      CREATE TABLE "Reservation" (
          "id" TEXT NOT NULL,
          "customerName" TEXT NOT NULL,
          "customerEmail" TEXT NOT NULL,
          "customerPhone" TEXT NOT NULL,
          "date" TIMESTAMP(3) NOT NULL,
          "time" TEXT NOT NULL,
          "guests" INTEGER NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'pending',
          "specialRequests" TEXT,
          "preferredLocation" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "tableId" TEXT,

          CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
      );

      -- Añadir clave foránea para tableId
      ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

      -- Crear tabla RestaurantSettings
      CREATE TABLE "RestaurantSettings" (
          "id" TEXT NOT NULL,
          "data" JSONB NOT NULL,
          "updatedAt" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "RestaurantSettings_pkey" PRIMARY KEY ("id")
      );
    `;
    
    console.log('Migración completada exitosamente!');
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la migración
runMigration();