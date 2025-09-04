#!/bin/bash

# Advanced Vending Machine Age Verification System
# Automated Deployment Script
# 
# This script automates the complete deployment process including:
# - Environment setup
# - Dependency installation
# - Database initialization
# - Service configuration
# - Health checks
# - Rollback capabilities

set -e  # Exit on any error

# Configuration
PROJECT_NAME="advanced-vending-machine"
DOCKER_IMAGE="vending-machine-system"
DOCKER_TAG="latest"
COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="./backups"
LOG_FILE="./logs/deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
        exit 1
    fi
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        error "Python 3 is not installed. Please install Python 3 first."
        exit 1
    fi
    
    success "All requirements satisfied"
}

# Create necessary directories
setup_directories() {
    log "Setting up directories..."
    
    mkdir -p logs
    mkdir -p config/backups
    mkdir -p data/mongodb
    mkdir -p data/redis
    mkdir -p uploads
    mkdir -p certificates
    
    success "Directories created"
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."
    
    if [ -f "$COMPOSE_FILE" ]; then
        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
        
        # Backup configuration files
        cp -r config/ "$BACKUP_DIR/$BACKUP_NAME/" 2>/dev/null || true
        cp -r data/ "$BACKUP_DIR/$BACKUP_NAME/" 2>/dev/null || true
        cp docker-compose.yml "$BACKUP_DIR/$BACKUP_NAME/" 2>/dev/null || true
        cp .env "$BACKUP_DIR/$BACKUP_NAME/" 2>/dev/null || true
        
        success "Backup created: $BACKUP_DIR/$BACKUP_NAME"
        echo "$BACKUP_NAME" > .last-backup
    else
        warning "No existing deployment found to backup"
    fi
}

# Install dependencies
install_dependencies() {
    log "Installing Node.js dependencies..."
    npm ci --production
    
    log "Installing frontend dependencies..."
    cd frontend && npm ci && npm run build && cd ..
    
    log "Setting up Python environment..."
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    deactivate
    
    success "Dependencies installed"
}

# Generate SSL certificates if needed
setup_ssl() {
    if [ "$SSL_ENABLED" = "true" ] && [ ! -f "certificates/server.crt" ]; then
        log "Generating SSL certificates..."
        
        mkdir -p certificates
        openssl req -x509 -newkey rsa:4096 -keyout certificates/server.key -out certificates/server.crt -days 365 -nodes \
            -subj "/C=TH/ST=Bangkok/L=Bangkok/O=VendingMachine/CN=localhost"
        
        success "SSL certificates generated"
    fi
}

# Configure environment
setup_environment() {
    log "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        cp .env.example .env
        warning "Created .env file from template. Please review and update configuration."
    fi
    
    # Generate JWT secret if not set
    if ! grep -q "JWT_SECRET=" .env || grep -q "JWT_SECRET=$" .env; then
        JWT_SECRET=$(openssl rand -base64 32)
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        log "Generated JWT secret"
    fi
    
    # Generate encryption key if not set
    if ! grep -q "ENCRYPTION_KEY=" .env || grep -q "ENCRYPTION_KEY=$" .env; then
        ENCRYPTION_KEY=$(openssl rand -base64 32)
        sed -i "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env
        log "Generated encryption key"
    fi
    
    success "Environment configured"
}

# Run database migrations
setup_database() {
    log "Setting up database..."
    
    # Start database services
    docker-compose up -d mongodb redis
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    sleep 10
    
    # Run any database initialization scripts
    if [ -f "scripts/init-db.js" ]; then
        docker-compose exec mongodb mongo vending_machine /scripts/init-db.js
    fi
    
    success "Database setup complete"
}

# Build and start services
deploy_services() {
    log "Building and deploying services..."
    
    # Pull latest images
    docker-compose pull
    
    # Build custom images
    docker-compose build --no-cache
    
    # Start all services
    docker-compose up -d
    
    success "Services deployed"
}

# Run health checks
health_check() {
    log "Running health checks..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:3000/health > /dev/null; then
            success "Health check passed"
            return 0
        fi
        
        log "Health check attempt $attempt/$max_attempts failed, waiting..."
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
    return 1
}

# Run post-deployment tests
run_tests() {
    log "Running post-deployment tests..."
    
    # Run API tests
    npm run test:integration
    
    # Run performance tests
    npm run test:performance
    
    success "All tests passed"
}

# Rollback function
rollback() {
    error "Deployment failed. Starting rollback..."
    
    if [ -f ".last-backup" ]; then
        BACKUP_NAME=$(cat .last-backup)
        log "Rolling back to backup: $BACKUP_NAME"
        
        # Stop current services
        docker-compose down
        
        # Restore backup
        cp -r "$BACKUP_DIR/$BACKUP_NAME/"* ./ 2>/dev/null || true
        
        # Restart services
        docker-compose up -d
        
        warning "Rollback completed"
    else
        error "No backup found for rollback"
    fi
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep only last 5 backups
    cd "$BACKUP_DIR"
    ls -t | tail -n +6 | xargs -r rm -rf
    cd ..
    
    success "Backup cleanup completed"
}

# Send deployment notification
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🤖 Deployment $status: $message\"}" \
            "$SLACK_WEBHOOK"
    fi
    
    if [ -n "$DISCORD_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"content\":\"🤖 Deployment $status: $message\"}" \
            "$DISCORD_WEBHOOK"
    fi
}

# Main deployment function
main() {
    log "Starting automated deployment of $PROJECT_NAME..."
    
    # Load environment variables
    if [ -f ".env" ]; then
        source .env
    fi
    
    # Trap errors for rollback
    trap 'rollback; exit 1' ERR
    
    check_root
    check_requirements
    setup_directories
    backup_current
    install_dependencies
    setup_ssl
    setup_environment
    setup_database
    deploy_services
    
    if health_check; then
        run_tests
        cleanup_backups
        success "🎉 Deployment completed successfully!"
        send_notification "SUCCESS" "Advanced Vending Machine system deployed successfully"
    else
        error "Deployment failed health checks"
        exit 1
    fi
}

# Script options
case "${1:-}" in
    "rollback")
        rollback
        ;;
    "health")
        health_check
        ;;
    "backup")
        backup_current
        ;;
    "cleanup")
        cleanup_backups
        ;;
    *)
        main
        ;;
esac
