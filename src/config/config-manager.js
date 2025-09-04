const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class ConfigManager {
    constructor() {
        this.configFile = path.join(__dirname, '../../config/system-config.json');
        this.backupDir = path.join(__dirname, '../../config/backups');
        this.config = this.getDefaultConfig();
        this.watchers = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize configuration manager
     */
    async initialize() {
        try {
            // Ensure backup directory exists
            await this.ensureBackupDirectory();

            // Load existing configuration
            await this.loadConfig();

            this.isInitialized = true;
            logger.info('Configuration manager initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize configuration manager:', error);
            throw error;
        }
    }

    /**
     * Get default system configuration
     * @returns {Object} Default configuration
     */
    getDefaultConfig() {
        return {
            system: {
                version: '1.0.0',
                environment: 'development',
                logLevel: 'info',
                maxConcurrentSessions: 100,
                sessionTimeout: 1800000, // 30 minutes
                autoBackup: true,
                backupInterval: 24 * 60 * 60 * 1000, // 24 hours
            },
            ageVerification: {
                thresholds: {
                    alcohol: 20,
                    tobacco: 20,
                    general: 18,
                    medicine: 18
                },
                timeout: 60000, // 60 seconds
                maxRetries: 3,
                requireBiometric: true,
                requireSmartCard: true
            },
            smartCard: {
                readerName: 'ACS ACR122U',
                timeout: 5000,
                retryAttempts: 3,
                commandTimeout: 3000,
                supportedCards: ['Thai National ID'],
                apduCommands: {
                    selectFile: [0x00, 0xA4, 0x04, 0x00, 0x08, 0xA0, 0x00, 0x00, 0x00, 0x54, 0x48, 0x00, 0x01],
                    readBirthDate: [0x80, 0xB0, 0x00, 0xD9, 0x02, 0x00, 0x08]
                }
            },
            biometric: {
                confidenceThreshold: 0.8,
                livenessThreshold: 0.7,
                maxFaceSize: 1920,
                minFaceSize: 100,
                enableLivenessDetection: true,
                faceModels: {
                    detection: 'SSD MobileNet v1',
                    recognition: 'Face Recognition Net',
                    landmarks: 'Face Landmark 68 Net'
                }
            },
            mdb: {
                port: '/dev/ttyUSB0',
                baudRate: 9600,
                timeout: 5000,
                protocol: 'Level 3',
                retryAttempts: 3,
                commands: {
                    reset: 0x00,
                    setup: 0x01,
                    poll: 0x02,
                    vend: 0x03,
                    reader: 0x04
                }
            },
            security: {
                encryptionAlgorithm: 'AES-256-GCM',
                keyRotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
                auditLogRetention: 90 * 24 * 60 * 60 * 1000, // 90 days
                maxFailedAttempts: 5,
                lockoutDuration: 15 * 60 * 1000, // 15 minutes
                passwordPolicy: {
                    minLength: 8,
                    requireUppercase: true,
                    requireLowercase: true,
                    requireNumbers: true,
                    requireSpecialChars: true
                }
            },
            api: {
                rateLimit: {
                    windowMs: 15 * 60 * 1000, // 15 minutes
                    max: 100 // limit each IP to 100 requests per windowMs
                },
                cors: {
                    origin: ['http://localhost:3001', 'http://localhost:3000'],
                    credentials: true
                },
                ssl: {
                    enabled: false,
                    certPath: '',
                    keyPath: ''
                }
            },
            monitoring: {
                enableMetrics: true,
                metricsInterval: 10000, // 10 seconds
                healthCheckInterval: 30000, // 30 seconds
                alertThresholds: {
                    memoryUsage: 80, // percentage
                    cpuUsage: 80, // percentage
                    diskUsage: 90, // percentage
                    errorRate: 5 // percentage
                }
            },
            notifications: {
                email: {
                    enabled: false,
                    smtp: {
                        host: '',
                        port: 587,
                        secure: false,
                        auth: {
                            user: '',
                            pass: ''
                        }
                    },
                    from: 'system@vendingmachine.local',
                    to: []
                },
                webhook: {
                    enabled: false,
                    url: '',
                    secret: ''
                }
            }
        };
    }

    /**
     * Load configuration from file
     */
    async loadConfig() {
        try {
            const configData = await fs.readFile(this.configFile, 'utf8');
            const loadedConfig = JSON.parse(configData);
            
            // Merge with defaults to ensure all properties exist
            this.config = this.mergeConfig(this.getDefaultConfig(), loadedConfig);
            
            logger.info('Configuration loaded successfully');
        } catch (error) {
            if (error.code === 'ENOENT') {
                logger.info('Configuration file not found, using defaults and creating new file');
                await this.saveConfig();
            } else {
                logger.error('Failed to load configuration:', error);
                throw error;
            }
        }
    }

    /**
     * Save configuration to file
     */
    async saveConfig() {
        try {
            // Create backup before saving
            await this.createBackup();

            // Ensure config directory exists
            const configDir = path.dirname(this.configFile);
            await fs.mkdir(configDir, { recursive: true });

            // Save configuration
            await fs.writeFile(this.configFile, JSON.stringify(this.config, null, 2));
            
            logger.info('Configuration saved successfully');
            
            // Notify watchers
            this.notifyWatchers('config-saved', this.config);
        } catch (error) {
            logger.error('Failed to save configuration:', error);
            throw error;
        }
    }

    /**
     * Update configuration
     * @param {string} path - Configuration path (e.g., 'ageVerification.thresholds.alcohol')
     * @param {*} value - New value
     */
    async updateConfig(path, value) {
        try {
            const pathParts = path.split('.');
            let current = this.config;
            
            // Navigate to parent object
            for (let i = 0; i < pathParts.length - 1; i++) {
                if (!current[pathParts[i]]) {
                    current[pathParts[i]] = {};
                }
                current = current[pathParts[i]];
            }
            
            // Set the value
            const lastKey = pathParts[pathParts.length - 1];
            const oldValue = current[lastKey];
            current[lastKey] = value;
            
            // Save configuration
            await this.saveConfig();
            
            logger.info(`Configuration updated: ${path} = ${value} (was: ${oldValue})`);
            
            // Notify watchers
            this.notifyWatchers('config-updated', { path, value, oldValue });
        } catch (error) {
            logger.error('Failed to update configuration:', error);
            throw error;
        }
    }

    /**
     * Get configuration value
     * @param {string} path - Configuration path
     * @returns {*} Configuration value
     */
    getConfig(path) {
        if (!path) {
            return this.config;
        }
        
        const pathParts = path.split('.');
        let current = this.config;
        
        for (const part of pathParts) {
            if (current === null || current === undefined || !current.hasOwnProperty(part)) {
                return undefined;
            }
            current = current[part];
        }
        
        return current;
    }

    /**
     * Bulk update configuration
     * @param {Object} updates - Object with configuration updates
     */
    async bulkUpdate(updates) {
        try {
            const changes = [];
            
            for (const [path, value] of Object.entries(updates)) {
                const pathParts = path.split('.');
                let current = this.config;
                
                // Navigate to parent object
                for (let i = 0; i < pathParts.length - 1; i++) {
                    if (!current[pathParts[i]]) {
                        current[pathParts[i]] = {};
                    }
                    current = current[pathParts[i]];
                }
                
                // Set the value
                const lastKey = pathParts[pathParts.length - 1];
                const oldValue = current[lastKey];
                current[lastKey] = value;
                
                changes.push({ path, value, oldValue });
            }
            
            // Save configuration
            await this.saveConfig();
            
            logger.info(`Bulk configuration update completed: ${changes.length} changes`);
            
            // Notify watchers
            this.notifyWatchers('config-bulk-updated', changes);
        } catch (error) {
            logger.error('Failed to bulk update configuration:', error);
            throw error;
        }
    }

    /**
     * Create configuration backup
     */
    async createBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(this.backupDir, `config-backup-${timestamp}.json`);
            
            await fs.writeFile(backupFile, JSON.stringify(this.config, null, 2));
            
            // Clean up old backups (keep only last 10)
            await this.cleanupBackups();
            
            logger.info(`Configuration backup created: ${backupFile}`);
        } catch (error) {
            logger.error('Failed to create configuration backup:', error);
        }
    }

    /**
     * Restore configuration from backup
     * @param {string} backupFile - Backup file name
     */
    async restoreFromBackup(backupFile) {
        try {
            const backupPath = path.join(this.backupDir, backupFile);
            const backupData = await fs.readFile(backupPath, 'utf8');
            
            this.config = JSON.parse(backupData);
            await this.saveConfig();
            
            logger.info(`Configuration restored from backup: ${backupFile}`);
            
            // Notify watchers
            this.notifyWatchers('config-restored', { backupFile, config: this.config });
        } catch (error) {
            logger.error('Failed to restore configuration from backup:', error);
            throw error;
        }
    }

    /**
     * Watch for configuration changes
     * @param {string} event - Event to watch for
     * @param {Function} callback - Callback function
     */
    watch(event, callback) {
        if (!this.watchers.has(event)) {
            this.watchers.set(event, []);
        }
        this.watchers.get(event).push(callback);
    }

    /**
     * Notify watchers of configuration changes
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    notifyWatchers(event, data) {
        const callbacks = this.watchers.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    logger.error('Error in configuration watcher callback:', error);
                }
            });
        }
    }

    /**
     * Merge configuration objects
     * @param {Object} defaults - Default configuration
     * @param {Object} override - Override configuration
     * @returns {Object} Merged configuration
     */
    mergeConfig(defaults, override) {
        const result = { ...defaults };
        
        for (const key in override) {
            if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
                result[key] = this.mergeConfig(defaults[key] || {}, override[key]);
            } else {
                result[key] = override[key];
            }
        }
        
        return result;
    }

    /**
     * Ensure backup directory exists
     */
    async ensureBackupDirectory() {
        try {
            await fs.mkdir(this.backupDir, { recursive: true });
        } catch (error) {
            logger.error('Failed to create backup directory:', error);
        }
    }

    /**
     * Clean up old backup files
     */
    async cleanupBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles = files
                .filter(file => file.startsWith('config-backup-'))
                .sort()
                .reverse();
            
            // Keep only the last 10 backups
            if (backupFiles.length > 10) {
                const filesToDelete = backupFiles.slice(10);
                for (const file of filesToDelete) {
                    await fs.unlink(path.join(this.backupDir, file));
                }
                logger.info(`Cleaned up ${filesToDelete.length} old backup files`);
            }
        } catch (error) {
            logger.error('Failed to cleanup backup files:', error);
        }
    }

    /**
     * Export configuration
     * @returns {Object} Current configuration
     */
    exportConfig() {
        return JSON.parse(JSON.stringify(this.config));
    }

    /**
     * Import configuration
     * @param {Object} importedConfig - Configuration to import
     */
    async importConfig(importedConfig) {
        try {
            // Validate imported configuration
            this.validateConfig(importedConfig);
            
            // Merge with defaults to ensure all properties exist
            this.config = this.mergeConfig(this.getDefaultConfig(), importedConfig);
            
            // Save configuration
            await this.saveConfig();
            
            logger.info('Configuration imported successfully');
            
            // Notify watchers
            this.notifyWatchers('config-imported', this.config);
        } catch (error) {
            logger.error('Failed to import configuration:', error);
            throw error;
        }
    }

    /**
     * Validate configuration structure
     * @param {Object} config - Configuration to validate
     */
    validateConfig(config) {
        // Basic validation - ensure required sections exist
        const requiredSections = ['system', 'ageVerification', 'smartCard', 'biometric', 'mdb', 'security'];
        
        for (const section of requiredSections) {
            if (!config[section]) {
                throw new Error(`Missing required configuration section: ${section}`);
            }
        }
        
        // Additional validation can be added here
        logger.info('Configuration validation passed');
    }

    /**
     * Get configuration status
     * @returns {Object} Configuration manager status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            configFile: this.configFile,
            lastModified: this.config.system?.lastModified || null,
            backupCount: 0, // This would be populated by reading backup directory
            watchers: this.watchers.size
        };
    }
}

module.exports = ConfigManager;
