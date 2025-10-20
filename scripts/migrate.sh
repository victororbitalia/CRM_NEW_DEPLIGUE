#!/bin/bash

# Database migration script for production
# This script runs Prisma migrations and seeds the database

set -e  # Exit on error

echo "Starting database migration process..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
until nc -z postgres 5432; do
    echo "Database is unavailable - sleeping"
    sleep 1
done

echo "Database is ready!"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Check if database exists and create if needed
echo "Checking database status..."
npx prisma db push --accept-data-loss

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Seed the database (only if it's a fresh setup)
echo "Checking if database needs seeding..."
SEED_RESULT=$(npx prisma db seed 2>&1 || true)

if [[ $SEED_RESULT == *"No seed data found"* ]]; then
    echo "Database is already seeded"
else
    echo "Seeding database..."
    npx prisma db seed
fi

echo "Migration process completed successfully!"