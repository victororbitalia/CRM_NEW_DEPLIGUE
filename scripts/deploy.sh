#!/bin/bash

# Deployment script for EasyPanel
# This script handles the deployment process

set -e  # Exit on error

echo "Starting deployment process..."

# Configuration
APP_NAME="crm-restaurant"
BACKUP_DIR="/backups"
DEPLOYMENT_LOG="/var/log/deployment.log"

# Create deployment log directory
mkdir -p $(dirname $DEPLOYMENT_LOG)

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $DEPLOYMENT_LOG
}

# Function to check if service is healthy
check_health() {
    local service_name=$1
    local max_attempts=30
    local attempt=1
    
    log "Checking health of $service_name..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            log "$service_name is healthy!"
            return 0
        fi
        
        log "Attempt $attempt/$max_attempts: $service_name not ready yet..."
        sleep 10
        ((attempt++))
    done
    
    log "ERROR: $service_name failed to become healthy after $max_attempts attempts"
    return 1
}

# Create backup before deployment
log "Creating backup before deployment..."
./scripts/backup.sh

# Pull latest code
log "Pulling latest code..."
git pull origin main

# Build and deploy
log "Building and deploying application..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
log "Waiting for services to be ready..."
sleep 30

# Check application health
if check_health $APP_NAME; then
    log "Deployment completed successfully!"
    
    # Clean up old images
    log "Cleaning up old Docker images..."
    docker image prune -f
    
    # Log deployment info
    log "Deployment info:"
    log "- Application: $APP_NAME"
    log "- Version: $(git rev-parse --short HEAD)"
    log "- Deployed at: $(date)"
    log "- Health check: PASSED"
    
    exit 0
else
    log "ERROR: Deployment failed - health check failed"
    
    # Rollback deployment
    log "Rolling back deployment..."
    docker-compose -f docker-compose.prod.yml down
    
    # Restore previous deployment if available
    if [ -f "$BACKUP_DIR/previous_deployment.tar" ]; then
        log "Restoring previous deployment..."
        tar -xf "$BACKUP_DIR/previous_deployment.tar"
        docker-compose -f docker-compose.prod.yml up -d
    fi
    
    exit 1
fi