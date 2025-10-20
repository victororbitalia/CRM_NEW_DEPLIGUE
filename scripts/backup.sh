#!/bin/bash

# Database backup script
# This script creates daily backups of the PostgreSQL database

# Configuration
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="5432"
DB_NAME="${POSTGRES_DB:-restaurant_crm}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD}"
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Export password for pg_dump
export PGPASSWORD=$DB_PASSWORD

# Create backup
echo "Creating backup: $BACKUP_FILE"
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# Compress backup
echo "Compressing backup..."
gzip $BACKUP_FILE
BACKUP_FILE_GZ="$BACKUP_FILE.gz"

# Verify backup was created
if [ -f "$BACKUP_FILE_GZ" ]; then
    echo "Backup created successfully: $BACKUP_FILE_GZ"
    
    # Get file size
    FILE_SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)
    echo "Backup size: $FILE_SIZE"
else
    echo "Error: Backup creation failed"
    exit 1
fi

# Clean up old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find $BACKUP_DIR -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# List remaining backups
echo "Current backups:"
ls -lh $BACKUP_DIR/backup_*.sql.gz 2>/dev/null || echo "No backups found"

# Unset password
unset PGPASSWORD

echo "Backup process completed at $(date)"