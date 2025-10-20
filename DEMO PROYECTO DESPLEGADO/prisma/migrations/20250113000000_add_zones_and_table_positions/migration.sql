-- Add position fields to Table table
ALTER TABLE "Table" ADD COLUMN "positionX" REAL;
ALTER TABLE "Table" ADD COLUMN "positionY" REAL;
ALTER TABLE "Table" ADD COLUMN "zoneId" TEXT;

-- Create Zone table
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

-- Create unique index on Zone.name
CREATE UNIQUE INDEX "Zone_name_key" ON "Zone"("name");

-- Add foreign key constraint for zoneId
ALTER TABLE "Table" ADD CONSTRAINT "Table_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert default zones
INSERT INTO "Zone" ("id", "name", "displayName", "color", "boundaryX", "boundaryY", "width", "height", "isActive", "createdAt", "updatedAt") VALUES
    ('zone-interior', 'interior', 'Interior', '#e5e7eb', 0, 0, 50, 100, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('zone-terraza', 'terraza', 'Terraza', '#dbeafe', 50, 0, 50, 100, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);