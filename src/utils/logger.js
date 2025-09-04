/**
 * Logger Utility
 * Centralized logging system with multiple output formats and levels
 * Supports file logging, console output, and remote logging
 */

const winston = require('winston');
const path = require('path');

class Logger {
    constructor(config = {}) {
        this.config = {
            level: config.level || 'info',
            logDir: config.logDir || './logs',
            maxFiles: config.maxFiles || 5,
            maxSize: config.maxSize || '10m',
            enableConsole: config.enableConsole !== false,
            enableFile: config.enableFile !== false,
            enableRemote: config.enableRemote || false,
            remoteEndpoint: config.remoteEndpoint || null
        };
        
        this.logger = null;
        this.initialize();
    }

    /**
     * Initialize the logger
     */
    initialize() {
        const transports = [];
        
        // Console transport
        if (this.config.enableConsole) {
            transports.push(new winston.transports.Console({
                level: this.config.level,
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.timestamp(),
                    winston.format.printf(({ timestamp, level, message, ...meta }) => {
                        let logMessage = `${timestamp} [${level}]: ${message}`;
                        
                        if (Object.keys(meta).length > 0) {
                            logMessage += ` ${JSON.stringify(meta)}`;
                        }
                        
                        return logMessage;
                    })
                )
            }));
        }
        
        // File transport for general logs
        if (this.config.enableFile) {
            transports.push(new winston.transports.File({
                filename: path.join(this.config.logDir, 'app.log'),
                level: this.config.level,
                maxsize: this.config.maxSize,
                maxFiles: this.config.maxFiles,
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                )
            }));
        }
        
        // File transport for error logs
        if (this.config.enableFile) {
            transports.push(new winston.transports.File({
                filename: path.join(this.config.logDir, 'error.log'),
                level: 'error',
                maxsize: this.config.maxSize,
                maxFiles: this.config.maxFiles,
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                )
            }));
        }
        
        // File transport for audit logs
        if (this.config.enableFile) {
            transports.push(new winston.transports.File({
                filename: path.join(this.config.logDir, 'audit.log'),
                level: 'info',
                maxsize: this.config.maxSize,
                maxFiles: this.config.maxFiles,
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                )
            }));
        }
        
        // Remote transport (if configured)
        if (this.config.enableRemote && this.config.remoteEndpoint) {
            transports.push(new winston.transports.Http({
                host: this.config.remoteEndpoint,
                port: 80,
                path: '/logs',
                format: winston.format.json()
            }));
        }
        
        // Create logger instance
        this.logger = winston.createLogger({
            level: this.config.level,
            transports,
            exitOnError: false
        });
        
        // Handle uncaught exceptions
        this.logger.exceptions.handle(
            new winston.transports.File({
                filename: path.join(this.config.logDir, 'exceptions.log')
            })
        );
        
        // Handle unhandled promise rejections
        this.logger.rejections.handle(
            new winston.transports.File({
                filename: path.join(this.config.logDir, 'rejections.log')
            })
        );
    }

    /**
     * Log debug message
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     */
    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }

    /**
     * Log info message
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     */
    info(message, meta = {}) {
        this.logger.info(message, meta);
    }

    /**
     * Log warning message
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     */
    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }

    /**
     * Log error message
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     */
    error(message, meta = {}) {
        this.logger.error(message, meta);
    }

    /**
     * Log audit event
     * @param {string} message - Audit message
     * @param {Object} meta - Additional metadata
     */
    audit(message, meta = {}) {
        this.logger.info(`AUDIT: ${message}`, { ...meta, type: 'audit' });
    }

    /**
     * Log security event
     * @param {string} message - Security message
     * @param {Object} meta - Additional metadata
     */
    security(message, meta = {}) {
        this.logger.warn(`SECURITY: ${message}`, { ...meta, type: 'security' });
    }

    /**
     * Log performance metrics
     * @param {string} message - Performance message
     * @param {Object} meta - Additional metadata
     */
    performance(message, meta = {}) {
        this.logger.info(`PERFORMANCE: ${message}`, { ...meta, type: 'performance' });
    }

    /**
     * Log business event
     * @param {string} message - Business message
     * @param {Object} meta - Additional metadata
     */
    business(message, meta = {}) {
        this.logger.info(`BUSINESS: ${message}`, { ...meta, type: 'business' });
    }

    /**
     * Create child logger with additional context
     * @param {Object} context - Additional context to include in all logs
     * @returns {Object} Child logger instance
     */
    child(context) {
        return {
            debug: (message, meta = {}) => this.debug(message, { ...context, ...meta }),
            info: (message, meta = {}) => this.info(message, { ...context, ...meta }),
            warn: (message, meta = {}) => this.warn(message, { ...context, ...meta }),
            error: (message, meta = {}) => this.error(message, { ...context, ...meta }),
            audit: (message, meta = {}) => this.audit(message, { ...context, ...meta }),
            security: (message, meta = {}) => this.security(message, { ...context, ...meta }),
            performance: (message, meta = {}) => this.performance(message, { ...context, ...meta }),
            business: (message, meta = {}) => this.business(message, { ...context, ...meta })
        };
    }

    /**
     * Set log level
     * @param {string} level - New log level
     */
    setLevel(level) {
        this.logger.level = level;
    }

    /**
     * Get current log level
     * @returns {string} Current log level
     */
    getLevel() {
        return this.logger.level;
    }

    /**
     * Get logger statistics
     * @returns {Object} Logger statistics
     */
    getStats() {
        return {
            level: this.logger.level,
            transports: this.logger.transports.length,
            config: this.config
        };
    }

    /**
     * Close logger and cleanup resources
     */
    close() {
        if (this.logger) {
            this.logger.close();
        }
    }
}

// Create default logger instance
const logger = new Logger({
    level: process.env.LOG_LEVEL || 'info',
    logDir: process.env.LOG_DIR || './logs',
    enableConsole: process.env.NODE_ENV !== 'production',
    enableFile: true
});

module.exports = logger;
