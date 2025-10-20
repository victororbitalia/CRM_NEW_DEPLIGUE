-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
-- These will be created after Prisma migrations run

-- Example indexes (adjust based on your actual queries)
-- CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
-- CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
-- CREATE INDEX IF NOT EXISTS idx_reservations_customer_id ON reservations(customer_id);
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Set timezone
SET timezone = 'Europe/Madrid';