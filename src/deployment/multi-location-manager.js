const logger = require('../utils/logger');
const WebSocketServer = require('../websocket/websocket-server');

/**
 * Multi-Location Deployment Manager
 * Manages deployment and monitoring across multiple vending machine locations
 */
class MultiLocationManager {
    constructor(config = {}) {
        this.config = {
            centralServer: config.centralServer || 'localhost',
            locations: config.locations || [],
            syncInterval: config.syncInterval || 30000, // 30 seconds
            healthCheckInterval: config.healthCheckInterval || 60000, // 1 minute
            maxRetries: config.maxRetries || 3,
            timeout: config.timeout || 10000
        };

        this.locations = new Map();
        this.isInitialized = false;
        this.syncInterval = null;
        this.healthCheckInterval = null;
        this.webSocketServer = null;
    }

    /**
     * Initialize multi-location manager
     */
    async initialize() {
        try {
            logger.info('Initializing Multi-Location Manager...');

            // Initialize WebSocket server for real-time communication
            this.webSocketServer = new WebSocketServer();

            // Load location configurations
            await this.loadLocationConfigurations();

            // Start monitoring services
            this.startSynchronization();
            this.startHealthChecking();

            this.isInitialized = true;
            logger.info('Multi-Location Manager initialized successfully');

        } catch (error) {
            logger.error('Failed to initialize Multi-Location Manager:', error);
            throw error;
        }
    }

    /**
     * Load and validate location configurations
     */
    async loadLocationConfigurations() {
        logger.info('Loading location configurations...');

        for (const locationConfig of this.config.locations) {
            try {
                const location = {
                    id: locationConfig.id,
                    name: locationConfig.name,
                    address: locationConfig.address,
                    endpoint: locationConfig.endpoint,
                    credentials: locationConfig.credentials,
                    hardware: locationConfig.hardware || {},
                    status: 'unknown',
                    lastSync: null,
                    lastHealthCheck: null,
                    metrics: {
                        uptime: 0,
                        transactions: 0,
                        errors: 0,
                        responseTime: 0
                    },
                    alerts: [],
                    configuration: locationConfig.configuration || {}
                };

                // Validate location configuration
                this.validateLocationConfig(location);

                this.locations.set(location.id, location);
                logger.info(`Loaded location: ${location.name} (${location.id})`);

            } catch (error) {
                logger.error(`Failed to load location ${locationConfig.id}:`, error);
            }
        }

        logger.info(`Loaded ${this.locations.size} locations`);
    }

    /**
     * Validate location configuration
     */
    validateLocationConfig(location) {
        const required = ['id', 'name', 'endpoint'];
        
        for (const field of required) {
            if (!location[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Validate endpoint URL
        try {
            new URL(location.endpoint);
        } catch (error) {
            throw new Error(`Invalid endpoint URL: ${location.endpoint}`);
        }
    }

    /**
     * Deploy system to a specific location
     */
    async deployToLocation(locationId, deploymentConfig = {}) {
        const location = this.locations.get(locationId);
        if (!location) {
            throw new Error(`Location not found: ${locationId}`);
        }

        logger.info(`Starting deployment to location: ${location.name}`);

        try {
            const deployment = {
                locationId,
                timestamp: new Date().toISOString(),
                config: deploymentConfig,
                status: 'in_progress',
                steps: [],
                errors: []
            };

            // Step 1: Pre-deployment checks
            await this.preDeploymentChecks(location, deployment);

            // Step 2: Deploy configuration
            await this.deployConfiguration(location, deployment);

            // Step 3: Deploy application
            await this.deployApplication(location, deployment);

            // Step 4: Verify deployment
            await this.verifyDeployment(location, deployment);

            // Step 5: Post-deployment setup
            await this.postDeploymentSetup(location, deployment);

            deployment.status = 'completed';
            location.lastSync = new Date().toISOString();

            logger.info(`Deployment completed successfully for location: ${location.name}`);

            // Broadcast deployment success
            this.broadcastLocationUpdate(locationId, 'deployment_completed', deployment);

            return deployment;

        } catch (error) {
            logger.error(`Deployment failed for location ${location.name}:`, error);
            
            // Broadcast deployment failure
            this.broadcastLocationUpdate(locationId, 'deployment_failed', { error: error.message });
            
            throw error;
        }
    }

    /**
     * Pre-deployment checks
     */
    async preDeploymentChecks(location, deployment) {
        logger.info(`Running pre-deployment checks for ${location.name}...`);
        
        const checks = [
            { name: 'Connectivity', check: () => this.checkConnectivity(location) },
            { name: 'System Requirements', check: () => this.checkSystemRequirements(location) },
            { name: 'Hardware Status', check: () => this.checkHardwareStatus(location) },
            { name: 'Disk Space', check: () => this.checkDiskSpace(location) },
            { name: 'Dependencies', check: () => this.checkDependencies(location) }
        ];

        for (const { name, check } of checks) {
            try {
                const result = await check();
                deployment.steps.push({
                    name: `Pre-check: ${name}`,
                    status: 'passed',
                    result,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                deployment.steps.push({
                    name: `Pre-check: ${name}`,
                    status: 'failed',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                throw new Error(`Pre-deployment check failed: ${name} - ${error.message}`);
            }
        }
    }

    /**
     * Deploy configuration to location
     */
    async deployConfiguration(location, deployment) {
        logger.info(`Deploying configuration to ${location.name}...`);

        try {
            // Merge central config with location-specific config
            const config = {
                ...this.getBaseConfiguration(),
                ...location.configuration
            };

            // Send configuration to location
            const response = await this.sendToLocation(location, '/api/config/deploy', {
                method: 'POST',
                body: JSON.stringify(config),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.success) {
                throw new Error('Configuration deployment failed');
            }

            deployment.steps.push({
                name: 'Configuration Deployment',
                status: 'completed',
                result: response,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            deployment.steps.push({
                name: 'Configuration Deployment',
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    /**
     * Deploy application to location
     */
    async deployApplication(location, deployment) {
        logger.info(`Deploying application to ${location.name}...`);

        try {
            // Trigger application deployment
            const response = await this.sendToLocation(location, '/api/deploy/start', {
                method: 'POST',
                body: JSON.stringify({
                    version: deployment.config.version || 'latest',
                    environment: deployment.config.environment || 'production'
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.success) {
                throw new Error('Application deployment failed');
            }

            // Wait for deployment to complete
            await this.waitForDeploymentCompletion(location, response.deploymentId);

            deployment.steps.push({
                name: 'Application Deployment',
                status: 'completed',
                result: response,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            deployment.steps.push({
                name: 'Application Deployment',
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    /**
     * Verify deployment success
     */
    async verifyDeployment(location, deployment) {
        logger.info(`Verifying deployment for ${location.name}...`);

        try {
            // Health check
            const healthResponse = await this.sendToLocation(location, '/health');
            if (!healthResponse.healthy) {
                throw new Error('Health check failed after deployment');
            }

            // Functional tests
            const testResponse = await this.sendToLocation(location, '/api/test/functional');
            if (!testResponse.success || testResponse.failures > 0) {
                throw new Error(`Functional tests failed: ${testResponse.failures} failures`);
            }

            deployment.steps.push({
                name: 'Deployment Verification',
                status: 'completed',
                result: { health: healthResponse, tests: testResponse },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            deployment.steps.push({
                name: 'Deployment Verification',
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    /**
     * Post-deployment setup
     */
    async postDeploymentSetup(location, deployment) {
        logger.info(`Running post-deployment setup for ${location.name}...`);

        try {
            // Start monitoring
            await this.sendToLocation(location, '/api/monitoring/start', { method: 'POST' });

            // Initialize hardware
            await this.sendToLocation(location, '/api/hardware/initialize', { method: 'POST' });

            // Enable real-time sync
            await this.sendToLocation(location, '/api/sync/enable', { method: 'POST' });

            deployment.steps.push({
                name: 'Post-deployment Setup',
                status: 'completed',
                timestamp: new Date().toISOString()
            });

            // Update location status
            location.status = 'operational';

        } catch (error) {
            deployment.steps.push({
                name: 'Post-deployment Setup',
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    /**
     * Deploy to all locations
     */
    async deployToAllLocations(deploymentConfig = {}) {
        logger.info('Starting deployment to all locations...');

        const results = [];
        const errors = [];

        for (const [locationId, location] of this.locations.entries()) {
            try {
                const result = await this.deployToLocation(locationId, deploymentConfig);
                results.push(result);
            } catch (error) {
                errors.push({ locationId, error: error.message });
                logger.error(`Failed to deploy to ${location.name}:`, error);
            }
        }

        const summary = {
            total: this.locations.size,
            successful: results.length,
            failed: errors.length,
            results,
            errors
        };

        logger.info(`Deployment summary: ${summary.successful}/${summary.total} successful`);
        
        // Broadcast deployment summary
        this.broadcastSystemUpdate('mass_deployment_completed', summary);

        return summary;
    }

    /**
     * Start synchronization service
     */
    startSynchronization() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(async () => {
            try {
                await this.synchronizeLocations();
            } catch (error) {
                logger.error('Synchronization failed:', error);
            }
        }, this.config.syncInterval);

        logger.info(`Synchronization started (interval: ${this.config.syncInterval}ms)`);
    }

    /**
     * Start health checking service
     */
    startHealthChecking() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        this.healthCheckInterval = setInterval(async () => {
            try {
                await this.performHealthChecks();
            } catch (error) {
                logger.error('Health check failed:', error);
            }
        }, this.config.healthCheckInterval);

        logger.info(`Health checking started (interval: ${this.config.healthCheckInterval}ms)`);
    }

    /**
     * Synchronize data across all locations
     */
    async synchronizeLocations() {
        for (const [locationId, location] of this.locations.entries()) {
            try {
                await this.synchronizeLocation(location);
            } catch (error) {
                logger.error(`Synchronization failed for ${location.name}:`, error);
            }
        }
    }

    /**
     * Synchronize single location
     */
    async synchronizeLocation(location) {
        try {
            // Get location status and metrics
            const status = await this.sendToLocation(location, '/api/status');
            
            // Update location data
            location.metrics = status.metrics || location.metrics;
            location.lastSync = new Date().toISOString();
            location.status = status.status || 'unknown';

            // Broadcast status update
            this.broadcastLocationUpdate(location.id, 'status_updated', status);

        } catch (error) {
            location.status = 'unreachable';
            logger.warn(`Location ${location.name} unreachable during sync`);
        }
    }

    /**
     * Perform health checks on all locations
     */
    async performHealthChecks() {
        for (const [locationId, location] of this.locations.entries()) {
            try {
                await this.performLocationHealthCheck(location);
            } catch (error) {
                logger.error(`Health check failed for ${location.name}:`, error);
            }
        }
    }

    /**
     * Perform health check on single location
     */
    async performLocationHealthCheck(location) {
        try {
            const health = await this.sendToLocation(location, '/health');
            
            location.lastHealthCheck = new Date().toISOString();
            
            if (health.healthy) {
                location.status = 'healthy';
                location.metrics.uptime = health.uptime || 0;
                location.metrics.responseTime = health.responseTime || 0;
            } else {
                location.status = 'unhealthy';
                this.createAlert(location.id, 'health_check_failed', health);
            }

        } catch (error) {
            location.status = 'unreachable';
            this.createAlert(location.id, 'location_unreachable', { error: error.message });
        }
    }

    /**
     * Send HTTP request to location
     */
    async sendToLocation(location, path, options = {}) {
        const url = `${location.endpoint}${path}`;
        const requestOptions = {
            method: 'GET',
            timeout: this.config.timeout,
            headers: {
                'Authorization': location.credentials?.token ? `Bearer ${location.credentials.token}` : undefined,
                ...options.headers
            },
            ...options
        };

        // Implementation would use fetch or similar HTTP client
        // For now, return mock response based on path
        return this.mockLocationResponse(path, requestOptions);
    }

    /**
     * Mock location response (replace with actual HTTP client)
     */
    mockLocationResponse(path, options) {
        // Mock responses for different endpoints
        const responses = {
            '/health': { healthy: true, uptime: 86400, responseTime: 50 },
            '/api/status': { 
                status: 'operational',
                metrics: { transactions: 150, errors: 2, uptime: 86400 }
            },
            '/api/config/deploy': { success: true, message: 'Configuration deployed' },
            '/api/deploy/start': { success: true, deploymentId: 'deploy-123' },
            '/api/test/functional': { success: true, failures: 0, tests: 25 }
        };

        return Promise.resolve(responses[path] || { success: true });
    }

    /**
     * Create alert for location
     */
    createAlert(locationId, type, data) {
        const location = this.locations.get(locationId);
        if (!location) return;

        const alert = {
            id: `alert-${Date.now()}`,
            locationId,
            type,
            data,
            timestamp: new Date().toISOString(),
            severity: this.getAlertSeverity(type),
            resolved: false
        };

        location.alerts.push(alert);
        
        // Keep only last 100 alerts per location
        if (location.alerts.length > 100) {
            location.alerts = location.alerts.slice(-100);
        }

        logger.warn(`Alert created for ${location.name}: ${type}`, data);
        
        // Broadcast alert
        this.broadcastLocationUpdate(locationId, 'alert_created', alert);
    }

    /**
     * Get alert severity level
     */
    getAlertSeverity(type) {
        const severityMap = {
            'location_unreachable': 'critical',
            'health_check_failed': 'high',
            'deployment_failed': 'high',
            'hardware_failure': 'critical',
            'high_error_rate': 'medium',
            'performance_degradation': 'low'
        };

        return severityMap[type] || 'medium';
    }

    /**
     * Broadcast location update via WebSocket
     */
    broadcastLocationUpdate(locationId, event, data) {
        if (this.webSocketServer) {
            this.webSocketServer.io.emit('location_update', {
                locationId,
                event,
                data,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Broadcast system update via WebSocket
     */
    broadcastSystemUpdate(event, data) {
        if (this.webSocketServer) {
            this.webSocketServer.io.emit('system_update', {
                event,
                data,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get base configuration for all locations
     */
    getBaseConfiguration() {
        return {
            system: {
                logLevel: 'info',
                environment: 'production'
            },
            ageVerification: {
                thresholds: { alcohol: 20, tobacco: 20, general: 18 }
            },
            security: {
                encryptionEnabled: true,
                auditLogging: true
            }
        };
    }

    /**
     * Get multi-location status
     */
    getStatus() {
        const locationStats = Array.from(this.locations.values()).reduce((acc, location) => {
            acc[location.status] = (acc[location.status] || 0) + 1;
            return acc;
        }, {});

        return {
            initialized: this.isInitialized,
            totalLocations: this.locations.size,
            locationStats,
            lastSync: new Date().toISOString(),
            config: this.config
        };
    }

    /**
     * Get all locations data
     */
    getAllLocations() {
        return Array.from(this.locations.values());
    }

    /**
     * Get specific location data
     */
    getLocation(locationId) {
        return this.locations.get(locationId);
    }

    /**
     * Cleanup multi-location manager
     */
    async cleanup() {
        try {
            logger.info('Cleaning up Multi-Location Manager...');

            // Stop intervals
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
                this.syncInterval = null;
            }

            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval);
                this.healthCheckInterval = null;
            }

            // Cleanup WebSocket server
            if (this.webSocketServer) {
                await this.webSocketServer.cleanup();
            }

            this.isInitialized = false;
            logger.info('Multi-Location Manager cleanup completed');

        } catch (error) {
            logger.error('Error during Multi-Location Manager cleanup:', error);
        }
    }
}

module.exports = MultiLocationManager;
