#!/bin/bash

# Advanced Vending Machine - Multi-Location Deployment Script
# Deploys the system to multiple vending machine locations with centralized management

set -e

# Configuration
LOCATIONS_CONFIG="config/locations.json"
DEPLOYMENT_LOG="logs/deployment-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="backups/pre-deployment-$(date +%Y%m%d-%H%M%S)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Logging functions
log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$DEPLOYMENT_LOG"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$DEPLOYMENT_LOG"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$DEPLOYMENT_LOG"; }
error() { echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOYMENT_LOG"; }
info() { echo -e "${PURPLE}[INFO]${NC} $1" | tee -a "$DEPLOYMENT_LOG"; }

# Create logs directory
mkdir -p logs backups

echo -e "${PURPLE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🌐 MULTI-LOCATION DEPLOYMENT SYSTEM                      ║
║                                                              ║
║    Advanced Vending Machine Age Verification               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check required files
    if [ ! -f "$LOCATIONS_CONFIG" ]; then
        error "Locations configuration file not found: $LOCATIONS_CONFIG"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is required but not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is required but not installed"
        exit 1
    fi
    
    # Check jq for JSON processing
    if ! command -v jq &> /dev/null; then
        error "jq is required but not installed (brew install jq / apt install jq)"
        exit 1
    fi
    
    success "Prerequisites check completed"
}

# Load location configurations
load_locations() {
    log "Loading location configurations..."
    
    if ! jq empty "$LOCATIONS_CONFIG" 2>/dev/null; then
        error "Invalid JSON in locations configuration file"
        exit 1
    fi
    
    LOCATION_COUNT=$(jq '.locations | length' "$LOCATIONS_CONFIG")
    info "Found $LOCATION_COUNT locations configured for deployment"
    
    # List all locations
    jq -r '.locations[] | "  • \(.id): \(.name) (\(.address))"' "$LOCATIONS_CONFIG"
    
    success "Location configurations loaded"
}

# Create deployment backup
create_backup() {
    log "Creating pre-deployment backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup current deployment
    if [ -f "docker-compose.prod.yml" ]; then
        cp docker-compose.prod.yml "$BACKUP_DIR/"
    fi
    
    # Backup configuration
    cp -r config/ "$BACKUP_DIR/" 2>/dev/null || true
    
    # Backup data directories
    if [ -d "data" ]; then
        cp -r data/ "$BACKUP_DIR/" 2>/dev/null || true
    fi
    
    success "Backup created: $BACKUP_DIR"
}

# Generate location-specific configurations
generate_location_configs() {
    log "Generating location-specific configurations..."
    
    mkdir -p config/locations
    
    # Generate configuration for each location
    for i in $(seq 0 $((LOCATION_COUNT - 1))); do
        LOCATION_ID=$(jq -r ".locations[$i].id" "$LOCATIONS_CONFIG")
        LOCATION_NAME=$(jq -r ".locations[$i].name" "$LOCATIONS_CONFIG")
        
        log "Generating config for $LOCATION_ID ($LOCATION_NAME)..."
        
        # Create location-specific environment file
        cat > "config/locations/$LOCATION_ID.env" << EOF
# Location: $LOCATION_NAME
LOCATION_ID=$LOCATION_ID
LOCATION_NAME="$LOCATION_NAME"
LOCATION_ENDPOINT=$(jq -r ".locations[$i].endpoint" "$LOCATIONS_CONFIG")
LOCATION_TIMEZONE=$(jq -r ".locations[$i].timezone" "$LOCATIONS_CONFIG")

# Hardware Configuration
SMARTCARD_MODEL=$(jq -r ".locations[$i].hardware.smartCardReader.model" "$LOCATIONS_CONFIG")
CAMERA_MODEL=$(jq -r ".locations[$i].hardware.camera.model" "$LOCATIONS_CONFIG")
VENDING_MACHINE_MODEL=$(jq -r ".locations[$i].hardware.vendingMachine.model" "$LOCATIONS_CONFIG")

# Age Thresholds
AGE_THRESHOLD_ALCOHOL=$(jq -r ".locations[$i].configuration.ageThresholds.alcohol" "$LOCATIONS_CONFIG")
AGE_THRESHOLD_TOBACCO=$(jq -r ".locations[$i].configuration.ageThresholds.tobacco" "$LOCATIONS_CONFIG")
AGE_THRESHOLD_GENERAL=$(jq -r ".locations[$i].configuration.ageThresholds.general" "$LOCATIONS_CONFIG")

# Operating Hours
OPERATING_HOURS_START=$(jq -r ".locations[$i].configuration.operatingHours.start" "$LOCATIONS_CONFIG")
OPERATING_HOURS_END=$(jq -r ".locations[$i].configuration.operatingHours.end" "$LOCATIONS_CONFIG")

# Monitoring
HEALTH_CHECK_INTERVAL=$(jq -r ".locations[$i].monitoring.healthCheckInterval" "$LOCATIONS_CONFIG")
RESPONSE_TIME_THRESHOLD=$(jq -r ".locations[$i].monitoring.alertThresholds.responseTime" "$LOCATIONS_CONFIG")
ERROR_RATE_THRESHOLD=$(jq -r ".locations[$i].monitoring.alertThresholds.errorRate" "$LOCATIONS_CONFIG")
SUCCESS_RATE_THRESHOLD=$(jq -r ".locations[$i].monitoring.alertThresholds.successRate" "$LOCATIONS_CONFIG")
EOF
        
        # Create location-specific Docker Compose override
        cat > "config/locations/$LOCATION_ID-docker-compose.yml" << EOF
version: '3.8'

services:
  vending-app:
    environment:
      - LOCATION_ID=$LOCATION_ID
      - LOCATION_NAME="$LOCATION_NAME"
    labels:
      - "traefik.http.routers.$LOCATION_ID.rule=Host(\`$(echo $(jq -r ".locations[$i].endpoint" "$LOCATIONS_CONFIG") | sed 's|https://||' | sed 's|http://||')\`)"
      - "traefik.http.routers.$LOCATION_ID.tls=true"
    
  prometheus:
    volumes:
      - ./config/locations/$LOCATION_ID-prometheus.yml:/etc/prometheus/prometheus.yml
  
  grafana:
    environment:
      - GF_SERVER_ROOT_URL=$(jq -r ".locations[$i].endpoint" "$LOCATIONS_CONFIG")/grafana
EOF
        
        # Create location-specific Prometheus configuration
        cat > "config/locations/$LOCATION_ID-prometheus.yml" << EOF
global:
  scrape_interval: 15s
  external_labels:
    location: '$LOCATION_ID'
    location_name: '$LOCATION_NAME'

scrape_configs:
  - job_name: 'vending-app-$LOCATION_ID'
    static_configs:
      - targets: ['vending-app:3000']
    scrape_interval: 10s
    metrics_path: '/metrics'
    
  - job_name: 'node-exporter-$LOCATION_ID'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 15s

remote_write:
  - url: 'https://central.vendingmachine.enterprise/api/v1/write'
    basic_auth:
      username: '$LOCATION_ID'
      password: '${PROMETHEUS_REMOTE_WRITE_PASSWORD}'
EOF
        
        success "Configuration generated for $LOCATION_ID"
    done
    
    success "All location configurations generated"
}

# Deploy to specific location
deploy_location() {
    local location_id=$1
    local location_index=$2
    
    LOCATION_NAME=$(jq -r ".locations[$location_index].name" "$LOCATIONS_CONFIG")
    LOCATION_ENDPOINT=$(jq -r ".locations[$location_index].endpoint" "$LOCATIONS_CONFIG")
    
    log "Deploying to $location_id ($LOCATION_NAME)..."
    
    # Create location-specific deployment directory
    DEPLOY_DIR="deployments/$location_id"
    mkdir -p "$DEPLOY_DIR"
    
    # Copy base files
    cp docker-compose.prod.yml "$DEPLOY_DIR/"
    cp -r src/ "$DEPLOY_DIR/" 2>/dev/null || true
    cp -r frontend/build/ "$DEPLOY_DIR/frontend/" 2>/dev/null || true
    
    # Copy location-specific configuration
    cp "config/locations/$location_id.env" "$DEPLOY_DIR/.env"
    cp "config/locations/$location_id-docker-compose.yml" "$DEPLOY_DIR/docker-compose.override.yml"
    
    # Build and deploy
    cd "$DEPLOY_DIR"
    
    log "Building images for $location_id..."
    if docker-compose -f docker-compose.prod.yml -f docker-compose.override.yml build --no-cache; then
        success "Images built successfully for $location_id"
    else
        error "Failed to build images for $location_id"
        cd - > /dev/null
        return 1
    fi
    
    log "Starting services for $location_id..."
    if docker-compose -f docker-compose.prod.yml -f docker-compose.override.yml up -d; then
        success "Services started for $location_id"
    else
        error "Failed to start services for $location_id"
        cd - > /dev/null
        return 1
    fi
    
    # Health check
    log "Performing health check for $location_id..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
            success "Health check passed for $location_id"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            error "Health check failed for $location_id after $max_attempts attempts"
            cd - > /dev/null
            return 1
        fi
        
        log "Health check attempt $attempt/$max_attempts for $location_id..."
        sleep 10
        ((attempt++))
    done
    
    cd - > /dev/null
    success "Deployment completed for $location_id"
    return 0
}

# Deploy to all locations
deploy_all_locations() {
    log "Starting multi-location deployment..."
    
    local successful_deployments=0
    local failed_deployments=0
    local deployment_results=()
    
    # Deploy to each location
    for i in $(seq 0 $((LOCATION_COUNT - 1))); do
        LOCATION_ID=$(jq -r ".locations[$i].id" "$LOCATIONS_CONFIG")
        
        if deploy_location "$LOCATION_ID" "$i"; then
            deployment_results+=("✅ $LOCATION_ID: SUCCESS")
            ((successful_deployments++))
        else
            deployment_results+=("❌ $LOCATION_ID: FAILED")
            ((failed_deployments++))
        fi
    done
    
    # Deployment summary
    echo ""
    log "📊 DEPLOYMENT SUMMARY"
    echo "===================="
    printf "Total Locations: %d\n" "$LOCATION_COUNT"
    printf "Successful: %d\n" "$successful_deployments"
    printf "Failed: %d\n" "$failed_deployments"
    echo ""
    
    # Results details
    for result in "${deployment_results[@]}"; do
        echo "  $result"
    done
    
    if [ $failed_deployments -eq 0 ]; then
        success "🎉 All locations deployed successfully!"
        return 0
    else
        warning "⚠️ Some deployments failed. Check logs for details."
        return 1
    fi
}

# Set up central monitoring
setup_central_monitoring() {
    log "Setting up central monitoring dashboard..."
    
    # Create central monitoring configuration
    cat > config/central-monitoring.yml << EOF
version: '3.8'

services:
  central-prometheus:
    image: prom/prometheus
    ports:
      - "9091:9090"
    volumes:
      - ./config/central-prometheus.yml:/etc/prometheus/prometheus.yml
      - central_prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
      - '--web.external-url=https://central.vendingmachine.enterprise/prometheus'
    restart: unless-stopped

  central-grafana:
    image: grafana/grafana
    ports:
      - "3002:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_ADMIN_PASSWORD}
      - GF_SERVER_ROOT_URL=https://central.vendingmachine.enterprise/grafana
    volumes:
      - central_grafana_data:/var/lib/grafana
      - ./config/grafana/central-dashboards:/etc/grafana/provisioning/dashboards
      - ./config/grafana/central-datasources:/etc/grafana/provisioning/datasources
    restart: unless-stopped

  location-manager:
    build: .
    ports:
      - "3003:3000"
    environment:
      - NODE_ENV=production
      - ROLE=central_manager
      - LOCATIONS_CONFIG=/app/config/locations.json
    volumes:
      - ./config:/app/config
      - ./logs:/app/logs
    restart: unless-stopped

volumes:
  central_prometheus_data:
  central_grafana_data:
EOF
    
    # Create central Prometheus configuration
    cat > config/central-prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'central-manager'
    static_configs:
      - targets: ['location-manager:3000']
    scrape_interval: 10s

EOF
    
    # Add each location as a scrape target
    for i in $(seq 0 $((LOCATION_COUNT - 1))); do
        LOCATION_ID=$(jq -r ".locations[$i].id" "$LOCATIONS_CONFIG")
        LOCATION_ENDPOINT=$(jq -r ".locations[$i].endpoint" "$LOCATIONS_CONFIG")
        
        cat >> config/central-prometheus.yml << EOF
  - job_name: '$LOCATION_ID'
    static_configs:
      - targets: ['$(echo $LOCATION_ENDPOINT | sed 's|https://||' | sed 's|http://||'):9090']
    scrape_interval: 30s
    metrics_path: '/federate'
    params:
      'match[]':
        - '{job=~"vending-app-.*"}'
        - '{job=~"node-exporter-.*"}'
    honor_labels: true

EOF
    done
    
    success "Central monitoring configuration created"
}

# Generate deployment report
generate_report() {
    log "Generating deployment report..."
    
    REPORT_FILE="reports/deployment-report-$(date +%Y%m%d-%H%M%S).md"
    mkdir -p reports
    
    cat > "$REPORT_FILE" << EOF
# Multi-Location Deployment Report

**Date**: $(date)  
**Deployment ID**: $(date +%Y%m%d-%H%M%S)  
**Total Locations**: $LOCATION_COUNT  

## Deployment Summary

$(if [ $failed_deployments -eq 0 ]; then echo "✅ **Status**: All locations deployed successfully"; else echo "⚠️ **Status**: $failed_deployments locations failed deployment"; fi)

### Location Details

EOF
    
    # Add location details to report
    for i in $(seq 0 $((LOCATION_COUNT - 1))); do
        LOCATION_ID=$(jq -r ".locations[$i].id" "$LOCATIONS_CONFIG")
        LOCATION_NAME=$(jq -r ".locations[$i].name" "$LOCATIONS_CONFIG")
        LOCATION_ENDPOINT=$(jq -r ".locations[$i].endpoint" "$LOCATIONS_CONFIG")
        
        cat >> "$REPORT_FILE" << EOF
#### $LOCATION_ID - $LOCATION_NAME

- **Endpoint**: $LOCATION_ENDPOINT
- **Status**: $(if grep -q "✅ $LOCATION_ID" <<< "${deployment_results[*]}"; then echo "Deployed Successfully"; else echo "Deployment Failed"; fi)
- **Health Check**: $(curl -f -s "$LOCATION_ENDPOINT/health" > /dev/null 2>&1 && echo "✅ Healthy" || echo "❌ Unhealthy")

EOF
    done
    
    cat >> "$REPORT_FILE" << EOF

## Access URLs

### Central Management
- **Central Dashboard**: https://central.vendingmachine.enterprise
- **Central Monitoring**: https://central.vendingmachine.enterprise/grafana
- **Central Metrics**: https://central.vendingmachine.enterprise/prometheus

### Location Dashboards
EOF
    
    for i in $(seq 0 $((LOCATION_COUNT - 1))); do
        LOCATION_ID=$(jq -r ".locations[$i].id" "$LOCATIONS_CONFIG")
        LOCATION_NAME=$(jq -r ".locations[$i].name" "$LOCATIONS_CONFIG")
        LOCATION_ENDPOINT=$(jq -r ".locations[$i].endpoint" "$LOCATIONS_CONFIG")
        
        cat >> "$REPORT_FILE" << EOF
- **$LOCATION_NAME**: $LOCATION_ENDPOINT
EOF
    done
    
    cat >> "$REPORT_FILE" << EOF

## Next Steps

1. **Monitoring Setup**: Configure alerts and dashboards
2. **Team Training**: Train operators on new system
3. **Performance Monitoring**: Monitor system performance
4. **Data Analysis**: Begin collecting analytics data
5. **Optimization**: Tune system based on real-world usage

## Support

For technical support or issues:
- **Documentation**: See /docs directory
- **Logs**: Check individual location logs
- **Monitoring**: Use Grafana dashboards
- **Health Checks**: Monitor /health endpoints

---

*Generated by Advanced Vending Machine Multi-Location Deployment System*
EOF
    
    success "Deployment report generated: $REPORT_FILE"
}

# Main deployment function
main() {
    log "🚀 Starting multi-location deployment process..."
    
    check_prerequisites
    load_locations
    create_backup
    generate_location_configs
    
    # Deploy to all locations
    if deploy_all_locations; then
        setup_central_monitoring
        generate_report
        
        success "🎉 Multi-location deployment completed successfully!"
        info "📊 Access central dashboard: https://central.vendingmachine.enterprise"
        info "📈 View monitoring: https://central.vendingmachine.enterprise/grafana"
        info "📋 Check report: $REPORT_FILE"
    else
        error "❌ Multi-location deployment completed with errors"
        info "🔍 Check deployment logs: $DEPLOYMENT_LOG"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "location")
        if [ -z "$2" ]; then
            error "Location ID required. Usage: $0 location LOC001"
            exit 1
        fi
        check_prerequisites
        load_locations
        # Find location index
        for i in $(seq 0 $((LOCATION_COUNT - 1))); do
            if [ "$(jq -r ".locations[$i].id" "$LOCATIONS_CONFIG")" = "$2" ]; then
                deploy_location "$2" "$i"
                exit $?
            fi
        done
        error "Location $2 not found in configuration"
        exit 1
        ;;
    "monitor")
        setup_central_monitoring
        ;;
    "report")
        generate_report
        ;;
    *)
        main
        ;;
esac
