/**
 * Security Manager
 * Handles encryption, authentication, audit logging, and privacy compliance
 * Ensures no permanent storage of personal information
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

class SecurityManager {
    constructor(config) {
        this.config = config;
        this.jwtSecret = config.jwtSecret || 'default-secret-change-in-production';
        this.encryptionKey = config.encryptionKey || crypto.randomBytes(32);
        this.algorithm = 'aes-256-gcm';
        this.isInitialized = false;
        
        // Audit log storage (in-memory only for privacy compliance)
        this.auditLogs = [];
        this.maxAuditLogs = 10000; // Maximum number of audit logs to keep in memory
        
        // Security policies
        this.policies = {
            maxLoginAttempts: 5,
            lockoutDuration: 15 * 60 * 1000, // 15 minutes
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            passwordMinLength: 8,
            requireSpecialChars: true,
            requireNumbers: true,
            requireUppercase: true
        };
        
        // Failed login attempts tracking
        this.failedAttempts = new Map();
        this.lockedAccounts = new Map();
    }

    /**
     * Initialize the security manager
     */
    async initialize() {
        try {
            logger.info('Initializing Security Manager...');
            
            // Generate encryption key if not provided
            if (!this.config.encryptionKey) {
                this.encryptionKey = crypto.randomBytes(32);
                logger.warn('Generated new encryption key - ensure it is securely stored');
            }
            
            // Initialize audit logging
            await this.initializeAuditLogging();
            
            this.isInitialized = true;
            logger.info('Security Manager initialized successfully');
            
        } catch (error) {
            logger.error('Failed to initialize Security Manager:', error);
            throw error;
        }
    }

    /**
     * Initialize audit logging system
     */
    async initializeAuditLogging() {
        logger.info('Initializing audit logging system...');
        
        // Set up periodic cleanup of old audit logs
        setInterval(() => {
            this.cleanupAuditLogs();
        }, 60 * 60 * 1000); // Clean up every hour
        
        logger.info('Audit logging system initialized');
    }

    /**
     * Encrypt sensitive data
     * @param {string|Buffer} data - Data to encrypt
     * @returns {Object} Encrypted data with IV and auth tag
     */
    encrypt(data) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
            cipher.setAAD(Buffer.from('age-verification-system', 'utf8'));
            
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            return {
                encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex')
            };
            
        } catch (error) {
            logger.error('Encryption failed:', error);
            throw new Error('Data encryption failed');
        }
    }

    /**
     * Decrypt sensitive data
     * @param {Object} encryptedData - Encrypted data object
     * @returns {string} Decrypted data
     */
    decrypt(encryptedData) {
        try {
            const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
            decipher.setAAD(Buffer.from('age-verification-system', 'utf8'));
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
            
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
            
        } catch (error) {
            logger.error('Decryption failed:', error);
            throw new Error('Data decryption failed');
        }
    }

    /**
     * Hash password using bcrypt
     * @param {string} password - Plain text password
     * @returns {Promise<string>} Hashed password
     */
    async hashPassword(password) {
        try {
            const saltRounds = 12;
            return await bcrypt.hash(password, saltRounds);
        } catch (error) {
            logger.error('Password hashing failed:', error);
            throw new Error('Password hashing failed');
        }
    }

    /**
     * Verify password against hash
     * @param {string} password - Plain text password
     * @param {string} hash - Hashed password
     * @returns {Promise<boolean>} True if password matches
     */
    async verifyPassword(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            logger.error('Password verification failed:', error);
            throw new Error('Password verification failed');
        }
    }

    /**
     * Generate JWT token
     * @param {Object} payload - Token payload
     * @param {string} expiresIn - Token expiration time
     * @returns {string} JWT token
     */
    generateToken(payload, expiresIn = '30m') {
        try {
            return jwt.sign(payload, this.jwtSecret, { expiresIn });
        } catch (error) {
            logger.error('Token generation failed:', error);
            throw new Error('Token generation failed');
        }
    }

    /**
     * Verify JWT token
     * @param {string} token - JWT token
     * @returns {Object} Decoded token payload
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            logger.error('Token verification failed:', error);
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {Object} Validation result
     */
    validatePassword(password) {
        const result = {
            valid: true,
            errors: []
        };
        
        if (password.length < this.policies.passwordMinLength) {
            result.valid = false;
            result.errors.push(`Password must be at least ${this.policies.passwordMinLength} characters long`);
        }
        
        if (this.policies.requireUppercase && !/[A-Z]/.test(password)) {
            result.valid = false;
            result.errors.push('Password must contain at least one uppercase letter');
        }
        
        if (this.policies.requireNumbers && !/\d/.test(password)) {
            result.valid = false;
            result.errors.push('Password must contain at least one number');
        }
        
        if (this.policies.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            result.valid = false;
            result.errors.push('Password must contain at least one special character');
        }
        
        return result;
    }

    /**
     * Check if account is locked
     * @param {string} username - Username to check
     * @returns {boolean} True if account is locked
     */
    isAccountLocked(username) {
        const lockInfo = this.lockedAccounts.get(username);
        if (!lockInfo) {
            return false;
        }
        
        if (Date.now() > lockInfo.unlockTime) {
            this.lockedAccounts.delete(username);
            this.failedAttempts.delete(username);
            return false;
        }
        
        return true;
    }

    /**
     * Record failed login attempt
     * @param {string} username - Username
     * @param {string} ipAddress - IP address
     */
    recordFailedAttempt(username, ipAddress) {
        const attempts = this.failedAttempts.get(username) || [];
        attempts.push({
            timestamp: Date.now(),
            ipAddress
        });
        
        this.failedAttempts.set(username, attempts);
        
        if (attempts.length >= this.policies.maxLoginAttempts) {
            this.lockAccount(username);
        }
    }

    /**
     * Lock account due to failed attempts
     * @param {string} username - Username to lock
     */
    lockAccount(username) {
        const unlockTime = Date.now() + this.policies.lockoutDuration;
        this.lockedAccounts.set(username, { unlockTime });
        
        logger.warn(`Account locked due to failed login attempts: ${username}`);
        
        // Log security event
        this.logSecurityEvent('ACCOUNT_LOCKED', {
            username,
            reason: 'Too many failed login attempts',
            unlockTime: new Date(unlockTime).toISOString()
        });
    }

    /**
     * Clear failed attempts for user
     * @param {string} username - Username
     */
    clearFailedAttempts(username) {
        this.failedAttempts.delete(username);
    }

    /**
     * Log audit event
     * @param {Object} event - Audit event object
     */
    async logAuditEvent(event) {
        try {
            const auditEntry = {
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                event: event.event || 'UNKNOWN',
                sessionId: event.sessionId,
                userId: event.userId || 'system',
                ipAddress: event.ipAddress || 'unknown',
                userAgent: event.userAgent || 'unknown',
                details: this.sanitizeAuditDetails(event.details || {}),
                severity: event.severity || 'INFO'
            };
            
            // Add to in-memory audit log
            this.auditLogs.push(auditEntry);
            
            // Log to system logger
            logger.info('Audit Event:', auditEntry);
            
            // Clean up old logs if necessary
            if (this.auditLogs.length > this.maxAuditLogs) {
                this.cleanupAuditLogs();
            }
            
        } catch (error) {
            logger.error('Failed to log audit event:', error);
        }
    }

    /**
     * Log security event
     * @param {string} eventType - Type of security event
     * @param {Object} details - Event details
     */
    logSecurityEvent(eventType, details) {
        this.logAuditEvent({
            event: `SECURITY_${eventType}`,
            details,
            severity: 'WARNING'
        });
    }

    /**
     * Sanitize audit details to remove sensitive information
     * @param {Object} details - Details to sanitize
     * @returns {Object} Sanitized details
     */
    sanitizeAuditDetails(details) {
        const sanitized = { ...details };
        
        // Remove sensitive fields
        const sensitiveFields = ['password', 'token', 'ssn', 'creditCard', 'biometricData'];
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });
        
        return sanitized;
    }

    /**
     * Clean up old audit logs
     */
    cleanupAuditLogs() {
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
        
        this.auditLogs = this.auditLogs.filter(log => {
            return new Date(log.timestamp).getTime() > cutoffTime;
        });
        
        logger.info(`Audit log cleanup completed. ${this.auditLogs.length} logs remaining.`);
    }

    /**
     * Get audit logs (for compliance reporting)
     * @param {Object} filters - Filter criteria
     * @returns {Array} Filtered audit logs
     */
    getAuditLogs(filters = {}) {
        let logs = [...this.auditLogs];
        
        // Apply filters
        if (filters.startDate) {
            logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
        }
        
        if (filters.endDate) {
            logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
        }
        
        if (filters.eventType) {
            logs = logs.filter(log => log.event === filters.eventType);
        }
        
        if (filters.severity) {
            logs = logs.filter(log => log.severity === filters.severity);
        }
        
        if (filters.limit) {
            logs = logs.slice(-filters.limit);
        }
        
        return logs;
    }

    /**
     * Generate secure random string
     * @param {number} length - Length of random string
     * @returns {string} Random string
     */
    generateSecureRandom(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Create secure hash of data
     * @param {string} data - Data to hash
     * @returns {string} SHA-256 hash
     */
    createHash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Verify data integrity using hash
     * @param {string} data - Data to verify
     * @param {string} hash - Expected hash
     * @returns {boolean} True if hash matches
     */
    verifyHash(data, hash) {
        const computedHash = this.createHash(data);
        return computedHash === hash;
    }

    /**
     * Get security status
     * @returns {Object} Security status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            auditLogCount: this.auditLogs.length,
            lockedAccounts: this.lockedAccounts.size,
            failedAttempts: this.failedAttempts.size,
            policies: this.policies
        };
    }

    /**
     * Update security policies
     * @param {Object} newPolicies - New policy values
     */
    updatePolicies(newPolicies) {
        this.policies = { ...this.policies, ...newPolicies };
        logger.info('Security policies updated:', newPolicies);
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            logger.info('Cleaning up security manager resources...');
            
            // Clear sensitive data
            this.auditLogs = [];
            this.failedAttempts.clear();
            this.lockedAccounts.clear();
            
            // Clear encryption key from memory
            this.encryptionKey.fill(0);
            
            logger.info('Security manager cleanup completed');
            
        } catch (error) {
            logger.error('Error during security manager cleanup:', error);
        }
    }
}

module.exports = SecurityManager;
