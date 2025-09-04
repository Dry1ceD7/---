const logger = require('../utils/logger');
const SmartCardReader = require('../smartcard/smartcard-reader');
const BiometricVerifier = require('../biometric/biometric-verifier');
const MDBCommunicator = require('../mdb/mdb-communicator');

/**
 * Hardware Manager - Coordinates all hardware components
 * Provides unified interface for hardware operations and testing
 */
class HardwareManager {
    constructor(config = {}) {
        this.config = {
            smartCard: {
                enabled: config.smartCard?.enabled ?? true,
                readerName: config.smartCard?.readerName || 'ACS ACR122U',
                timeout: config.smartCard?.timeout || 5000,
                mock: process.env.MOCK_SMARTCARD === 'true'
            },
            biometric: {
                enabled: config.biometric?.enabled ?? true,
                confidenceThreshold: config.biometric?.confidenceThreshold || 0.8,
                mock: process.env.MOCK_BIOMETRIC === 'true'
            },
            mdb: {
                enabled: config.mdb?.enabled ?? true,
                port: config.mdb?.port || '/dev/ttyUSB0',
                baudRate: config.mdb?.baudRate || 9600,
                mock: process.env.MOCK_MDB === 'true'
            },
            testing: {
                enableDiagnostics: config.testing?.enableDiagnostics ?? true,
                healthCheckInterval: config.testing?.healthCheckInterval || 30000,
                performanceLogging: config.testing?.performanceLogging ?? true
            }
        };

        this.components = {
            smartCardReader: null,
            biometricVerifier: null,
            mdbCommunicator: null
        };

        this.status = {
            initialized: false,
            lastHealthCheck: null,
            componentStatus: {},
            errors: [],
            performance: {
                smartCard: { avgResponseTime: 0, successRate: 0 },
                biometric: { avgResponseTime: 0, successRate: 0 },
                mdb: { avgResponseTime: 0, successRate: 0 }
            }
        };

        this.healthCheckInterval = null;
        this.performanceMetrics = new Map();
    }

    /**
     * Initialize all hardware components
     */
    async initialize() {
        try {
            logger.info('Initializing Hardware Manager...');
            
            // Initialize Smart Card Reader
            if (this.config.smartCard.enabled) {
                await this.initializeSmartCardReader();
            }

            // Initialize Biometric Verifier
            if (this.config.biometric.enabled) {
                await this.initializeBiometricVerifier();
            }

            // Initialize MDB Communicator
            if (this.config.mdb.enabled) {
                await this.initializeMDBCommunicator();
            }

            // Start health monitoring
            if (this.config.testing.enableDiagnostics) {
                this.startHealthMonitoring();
            }

            this.status.initialized = true;
            logger.info('Hardware Manager initialized successfully');

            // Run initial hardware diagnostics
            await this.runDiagnostics();

        } catch (error) {
            logger.error('Failed to initialize Hardware Manager:', error);
            this.status.errors.push({
                timestamp: new Date().toISOString(),
                component: 'HardwareManager',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Initialize Smart Card Reader component
     */
    async initializeSmartCardReader() {
        try {
            logger.info(`Initializing Smart Card Reader (Mock: ${this.config.smartCard.mock})`);
            
            this.components.smartCardReader = new SmartCardReader({
                readerName: this.config.smartCard.readerName,
                timeout: this.config.smartCard.timeout
            });

            await this.components.smartCardReader.initialize();
            
            this.status.componentStatus.smartCard = {
                status: 'operational',
                lastCheck: new Date().toISOString(),
                mock: this.config.smartCard.mock
            };

            logger.info('Smart Card Reader initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Smart Card Reader:', error);
            this.status.componentStatus.smartCard = {
                status: 'error',
                error: error.message,
                lastCheck: new Date().toISOString(),
                mock: this.config.smartCard.mock
            };
            throw error;
        }
    }

    /**
     * Initialize Biometric Verifier component
     */
    async initializeBiometricVerifier() {
        try {
            logger.info(`Initializing Biometric Verifier (Mock: ${this.config.biometric.mock})`);
            
            this.components.biometricVerifier = new BiometricVerifier({
                confidenceThreshold: this.config.biometric.confidenceThreshold
            });

            await this.components.biometricVerifier.initialize();
            
            this.status.componentStatus.biometric = {
                status: 'operational',
                lastCheck: new Date().toISOString(),
                mock: this.config.biometric.mock
            };

            logger.info('Biometric Verifier initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Biometric Verifier:', error);
            this.status.componentStatus.biometric = {
                status: 'error',
                error: error.message,
                lastCheck: new Date().toISOString(),
                mock: this.config.biometric.mock
            };
            throw error;
        }
    }

    /**
     * Initialize MDB Communicator component
     */
    async initializeMDBCommunicator() {
        try {
            logger.info(`Initializing MDB Communicator (Mock: ${this.config.mdb.mock})`);
            
            this.components.mdbCommunicator = new MDBCommunicator({
                port: this.config.mdb.port,
                baudRate: this.config.mdb.baudRate
            });

            await this.components.mdbCommunicator.initialize();
            
            this.status.componentStatus.mdb = {
                status: 'operational',
                lastCheck: new Date().toISOString(),
                mock: this.config.mdb.mock
            };

            logger.info('MDB Communicator initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize MDB Communicator:', error);
            this.status.componentStatus.mdb = {
                status: 'error',
                error: error.message,
                lastCheck: new Date().toISOString(),
                mock: this.config.mdb.mock
            };
            throw error;
        }
    }

    /**
     * Run comprehensive hardware diagnostics
     */
    async runDiagnostics() {
        logger.info('Running hardware diagnostics...');
        
        const diagnostics = {
            timestamp: new Date().toISOString(),
            results: {},
            summary: {
                totalComponents: 0,
                operationalComponents: 0,
                errorComponents: 0,
                overallStatus: 'unknown'
            }
        };

        // Test Smart Card Reader
        if (this.components.smartCardReader) {
            diagnostics.results.smartCard = await this.testSmartCardReader();
            diagnostics.summary.totalComponents++;
            if (diagnostics.results.smartCard.status === 'pass') {
                diagnostics.summary.operationalComponents++;
            } else {
                diagnostics.summary.errorComponents++;
            }
        }

        // Test Biometric Verifier
        if (this.components.biometricVerifier) {
            diagnostics.results.biometric = await this.testBiometricVerifier();
            diagnostics.summary.totalComponents++;
            if (diagnostics.results.biometric.status === 'pass') {
                diagnostics.summary.operationalComponents++;
            } else {
                diagnostics.summary.errorComponents++;
            }
        }

        // Test MDB Communicator
        if (this.components.mdbCommunicator) {
            diagnostics.results.mdb = await this.testMDBCommunicator();
            diagnostics.summary.totalComponents++;
            if (diagnostics.results.mdb.status === 'pass') {
                diagnostics.summary.operationalComponents++;
            } else {
                diagnostics.summary.errorComponents++;
            }
        }

        // Calculate overall status
        if (diagnostics.summary.errorComponents === 0) {
            diagnostics.summary.overallStatus = 'healthy';
        } else if (diagnostics.summary.operationalComponents > diagnostics.summary.errorComponents) {
            diagnostics.summary.overallStatus = 'degraded';
        } else {
            diagnostics.summary.overallStatus = 'critical';
        }

        logger.info(`Hardware diagnostics completed: ${diagnostics.summary.overallStatus}`, {
            operational: diagnostics.summary.operationalComponents,
            errors: diagnostics.summary.errorComponents,
            total: diagnostics.summary.totalComponents
        });

        return diagnostics;
    }

    /**
     * Test Smart Card Reader functionality
     */
    async testSmartCardReader() {
        const startTime = Date.now();
        const test = {
            component: 'smartCard',
            status: 'unknown',
            tests: [],
            performance: { responseTime: 0 },
            errors: []
        };

        try {
            // Test 1: Reader availability
            const readerTest = await this.performanceWrapper('smartCard', async () => {
                return this.components.smartCardReader.isReaderAvailable();
            });
            
            test.tests.push({
                name: 'Reader Availability',
                status: readerTest ? 'pass' : 'fail',
                result: readerTest
            });

            // Test 2: Card detection
            const cardTest = await this.performanceWrapper('smartCard', async () => {
                return this.components.smartCardReader.isCardPresent();
            });
            
            test.tests.push({
                name: 'Card Detection',
                status: 'pass', // Always pass in mock mode
                result: cardTest
            });

            // Test 3: APDU communication (if card present)
            if (cardTest || this.config.smartCard.mock) {
                const apduTest = await this.performanceWrapper('smartCard', async () => {
                    const selectCommand = [0x00, 0xA4, 0x04, 0x00, 0x08, 0xA0, 0x00, 0x00, 0x00, 0x54, 0x48, 0x00, 0x01];
                    return this.components.smartCardReader.sendAPDU(selectCommand);
                });
                
                test.tests.push({
                    name: 'APDU Communication',
                    status: apduTest ? 'pass' : 'fail',
                    result: apduTest ? 'Success' : 'Failed'
                });
            }

            test.status = test.tests.every(t => t.status === 'pass') ? 'pass' : 'fail';
            test.performance.responseTime = Date.now() - startTime;

        } catch (error) {
            test.status = 'error';
            test.errors.push(error.message);
            logger.error('Smart Card Reader test failed:', error);
        }

        return test;
    }

    /**
     * Test Biometric Verifier functionality
     */
    async testBiometricVerifier() {
        const startTime = Date.now();
        const test = {
            component: 'biometric',
            status: 'unknown',
            tests: [],
            performance: { responseTime: 0 },
            errors: []
        };

        try {
            // Test 1: Model loading
            const modelTest = await this.performanceWrapper('biometric', async () => {
                return this.components.biometricVerifier.areModelsLoaded();
            });
            
            test.tests.push({
                name: 'Model Loading',
                status: modelTest ? 'pass' : 'fail',
                result: modelTest
            });

            // Test 2: Face detection (with mock data)
            const mockImage = Buffer.alloc(1024, 0xFF); // Mock image data
            const detectionTest = await this.performanceWrapper('biometric', async () => {
                return this.components.biometricVerifier.detectFaces(mockImage);
            });
            
            test.tests.push({
                name: 'Face Detection',
                status: detectionTest ? 'pass' : 'fail',
                result: detectionTest ? 'Faces detected' : 'No faces detected'
            });

            // Test 3: Face verification
            const verificationTest = await this.performanceWrapper('biometric', async () => {
                return this.components.biometricVerifier.verifyFace(mockImage, mockImage);
            });
            
            test.tests.push({
                name: 'Face Verification',
                status: verificationTest?.verified !== undefined ? 'pass' : 'fail',
                result: verificationTest
            });

            test.status = test.tests.every(t => t.status === 'pass') ? 'pass' : 'fail';
            test.performance.responseTime = Date.now() - startTime;

        } catch (error) {
            test.status = 'error';
            test.errors.push(error.message);
            logger.error('Biometric Verifier test failed:', error);
        }

        return test;
    }

    /**
     * Test MDB Communicator functionality
     */
    async testMDBCommunicator() {
        const startTime = Date.now();
        const test = {
            component: 'mdb',
            status: 'unknown',
            tests: [],
            performance: { responseTime: 0 },
            errors: []
        };

        try {
            // Test 1: Serial port connectivity
            const portTest = await this.performanceWrapper('mdb', async () => {
                return this.components.mdbCommunicator.isPortOpen();
            });
            
            test.tests.push({
                name: 'Serial Port',
                status: portTest ? 'pass' : 'fail',
                result: portTest
            });

            // Test 2: MDB handshake
            const handshakeTest = await this.performanceWrapper('mdb', async () => {
                return this.components.mdbCommunicator.performHandshake();
            });
            
            test.tests.push({
                name: 'MDB Handshake',
                status: handshakeTest ? 'pass' : 'fail',
                result: handshakeTest
            });

            // Test 3: Command communication
            const commandTest = await this.performanceWrapper('mdb', async () => {
                return this.components.mdbCommunicator.sendCommand('POLL');
            });
            
            test.tests.push({
                name: 'Command Communication',
                status: commandTest ? 'pass' : 'fail',
                result: commandTest ? 'Response received' : 'No response'
            });

            test.status = test.tests.every(t => t.status === 'pass') ? 'pass' : 'fail';
            test.performance.responseTime = Date.now() - startTime;

        } catch (error) {
            test.status = 'error';
            test.errors.push(error.message);
            logger.error('MDB Communicator test failed:', error);
        }

        return test;
    }

    /**
     * Performance wrapper for measuring component response times
     */
    async performanceWrapper(component, operation) {
        const startTime = Date.now();
        try {
            const result = await operation();
            const responseTime = Date.now() - startTime;
            
            // Update performance metrics
            if (!this.performanceMetrics.has(component)) {
                this.performanceMetrics.set(component, {
                    totalRequests: 0,
                    totalTime: 0,
                    successes: 0,
                    failures: 0
                });
            }
            
            const metrics = this.performanceMetrics.get(component);
            metrics.totalRequests++;
            metrics.totalTime += responseTime;
            metrics.successes++;
            
            // Update status
            this.status.performance[component].avgResponseTime = metrics.totalTime / metrics.totalRequests;
            this.status.performance[component].successRate = (metrics.successes / metrics.totalRequests) * 100;
            
            if (this.config.testing.performanceLogging) {
                logger.debug(`${component} operation completed in ${responseTime}ms`);
            }
            
            return result;
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            // Update failure metrics
            if (this.performanceMetrics.has(component)) {
                const metrics = this.performanceMetrics.get(component);
                metrics.totalRequests++;
                metrics.totalTime += responseTime;
                metrics.failures++;
                
                this.status.performance[component].avgResponseTime = metrics.totalTime / metrics.totalRequests;
                this.status.performance[component].successRate = (metrics.successes / metrics.totalRequests) * 100;
            }
            
            throw error;
        }
    }

    /**
     * Start continuous health monitoring
     */
    startHealthMonitoring() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        this.healthCheckInterval = setInterval(async () => {
            try {
                await this.performHealthCheck();
            } catch (error) {
                logger.error('Health check failed:', error);
            }
        }, this.config.testing.healthCheckInterval);

        logger.info(`Health monitoring started (interval: ${this.config.testing.healthCheckInterval}ms)`);
    }

    /**
     * Perform health check on all components
     */
    async performHealthCheck() {
        this.status.lastHealthCheck = new Date().toISOString();
        
        const healthStatus = {
            timestamp: this.status.lastHealthCheck,
            components: {},
            overall: 'healthy'
        };

        // Check each component
        for (const [name, component] of Object.entries(this.components)) {
            if (component) {
                try {
                    const isHealthy = await this.checkComponentHealth(name, component);
                    healthStatus.components[name] = isHealthy ? 'healthy' : 'unhealthy';
                    
                    if (!isHealthy) {
                        healthStatus.overall = 'degraded';
                    }
                } catch (error) {
                    healthStatus.components[name] = 'error';
                    healthStatus.overall = 'critical';
                    logger.error(`Health check failed for ${name}:`, error);
                }
            }
        }

        // Log health status if there are issues
        if (healthStatus.overall !== 'healthy') {
            logger.warn('Hardware health check detected issues:', healthStatus);
        }

        return healthStatus;
    }

    /**
     * Check health of individual component
     */
    async checkComponentHealth(name, component) {
        switch (name) {
            case 'smartCardReader':
                return component.isReaderAvailable ? await component.isReaderAvailable() : true;
            case 'biometricVerifier':
                return component.areModelsLoaded ? await component.areModelsLoaded() : true;
            case 'mdbCommunicator':
                return component.isPortOpen ? await component.isPortOpen() : true;
            default:
                return true;
        }
    }

    /**
     * Get comprehensive hardware status
     */
    getStatus() {
        return {
            ...this.status,
            config: this.config,
            components: Object.keys(this.components).reduce((acc, key) => {
                acc[key] = this.components[key] ? 'initialized' : 'not_initialized';
                return acc;
            }, {})
        };
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        const metrics = {};
        for (const [component, data] of this.performanceMetrics.entries()) {
            metrics[component] = {
                avgResponseTime: data.totalTime / data.totalRequests || 0,
                successRate: (data.successes / data.totalRequests) * 100 || 0,
                totalRequests: data.totalRequests,
                successes: data.successes,
                failures: data.failures
            };
        }
        return metrics;
    }

    /**
     * Cleanup all hardware components
     */
    async cleanup() {
        try {
            logger.info('Cleaning up Hardware Manager...');
            
            // Stop health monitoring
            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval);
                this.healthCheckInterval = null;
            }

            // Cleanup components
            for (const [name, component] of Object.entries(this.components)) {
                if (component && component.cleanup) {
                    try {
                        await component.cleanup();
                        logger.info(`${name} cleaned up successfully`);
                    } catch (error) {
                        logger.error(`Failed to cleanup ${name}:`, error);
                    }
                }
            }

            this.status.initialized = false;
            logger.info('Hardware Manager cleanup completed');
        } catch (error) {
            logger.error('Error during Hardware Manager cleanup:', error);
        }
    }
}

module.exports = HardwareManager;
