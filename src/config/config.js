/**
 * Configuration Management
 * Centralized configuration for the Advanced Vending Machine Age Verification System
 */

const path = require('path');

// Load environment variables
require('dotenv').config();

const config = {
    // Application settings
    app: {
        name: 'Advanced Vending Machine Age Verification System',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT) || 3000,
        host: process.env.HOST || 'localhost'
    },

    // Database configuration
    database: {
        mongodb: {
            uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/vending-age-verification',
            options: {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000
            }
        },
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || null,
            db: parseInt(process.env.REDIS_DB) || 0,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3
        }
    },

    // Smart card configuration
    smartcard: {
        readerName: process.env.SMARTCARD_READER_NAME || 'ACS ACR122U',
        timeout: parseInt(process.env.SMARTCARD_TIMEOUT) || 5000,
        retryAttempts: parseInt(process.env.SMARTCARD_RETRY_ATTEMPTS) || 3,
        retryDelay: parseInt(process.env.SMARTCARD_RETRY_DELAY) || 1000,
        
        // Thai ID card specific settings
        thaiId: {
            selectFileCommand: [0x00, 0xA4, 0x04, 0x00, 0x08, 0xA0, 0x00, 0x00, 0x00, 0x54, 0x48, 0x00, 0x01],
            readBirthDateCommand: [0x80, 0xB0, 0x00, 0xD9, 0x02, 0x00, 0x08],
            readPhotoCommand: [0x80, 0xB0, 0x00, 0xE1, 0x02, 0x00, 0x04],
            birthDateOffset: 0xD9,
            photoOffset: 0xE1
        }
    },

    // Biometric verification configuration
    biometric: {
        confidenceThreshold: parseFloat(process.env.BIOMETRIC_CONFIDENCE_THRESHOLD) || 0.8,
        livenessThreshold: parseFloat(process.env.BIOMETRIC_LIVENESS_THRESHOLD) || 0.7,
        maxProcessingTime: parseInt(process.env.BIOMETRIC_MAX_PROCESSING_TIME) || 10000,
        modelPath: process.env.BIOMETRIC_MODEL_PATH || './models',
        
        // Face detection settings
        faceDetection: {
            minConfidence: 0.5,
            maxFaces: 1,
            inputSize: 416
        },
        
        // Image processing settings
        imageProcessing: {
            maxWidth: 640,
            maxHeight: 480,
            quality: 0.8,
            format: 'jpeg'
        }
    },

    // MDB protocol configuration
    mdb: {
        port: process.env.MDB_PORT || '/dev/ttyUSB0',
        baudRate: parseInt(process.env.MDB_BAUD_RATE) || 9600,
        timeout: parseInt(process.env.MDB_TIMEOUT) || 5000,
        retryAttempts: parseInt(process.env.MDB_RETRY_ATTEMPTS) || 3,
        retryDelay: parseInt(process.env.MDB_RETRY_DELAY) || 1000,
        
        // MDB addresses
        addresses: {
            VMC: 0x00,  // Vending Machine Controller
            COIN: 0x01, // Coin Changer
            BILL: 0x02, // Bill Validator
            CARD: 0x03, // Card Reader
            AGE_VERIFICATION: 0x04 // Age Verification System
        },
        
        // MDB commands
        commands: {
            RESET: 0x00,
            SETUP: 0x01,
            POLL: 0x02,
            VEND: 0x03,
            READ: 0x04,
            EXPANSION: 0x05
        }
    },

    // Security configuration
    security: {
        jwtSecret: process.env.JWT_SECRET || 'change-this-secret-in-production',
        jwtExpiration: process.env.JWT_EXPIRATION || '30m',
        encryptionKey: process.env.ENCRYPTION_KEY || null,
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        
        // Password policies
        passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            maxAge: 90 * 24 * 60 * 60 * 1000 // 90 days
        },
        
        // Account lockout settings
        lockout: {
            maxAttempts: 5,
            lockoutDuration: 15 * 60 * 1000, // 15 minutes
            resetAttemptsAfter: 60 * 60 * 1000 // 1 hour
        },
        
        // Session settings
        session: {
            timeout: 30 * 60 * 1000, // 30 minutes
            maxConcurrent: 10
        }
    },

    // Age verification configuration
    ageThresholds: {
        alcohol: parseInt(process.env.AGE_THRESHOLD_ALCOHOL) || 20,
        tobacco: parseInt(process.env.AGE_THRESHOLD_TOBACCO) || 20,
        general: parseInt(process.env.AGE_THRESHOLD_GENERAL) || 18,
        medicine: parseInt(process.env.AGE_THRESHOLD_MEDICINE) || 18
    },

    // Logging configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        logDir: process.env.LOG_DIR || './logs',
        maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
        maxSize: process.env.LOG_MAX_SIZE || '10m',
        enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
        enableFile: process.env.LOG_ENABLE_FILE !== 'false',
        enableRemote: process.env.LOG_ENABLE_REMOTE === 'true',
        remoteEndpoint: process.env.LOG_REMOTE_ENDPOINT || null
    },

    // Cloud connectivity configuration
    cloud: {
        enabled: process.env.CLOUD_ENABLED === 'true',
        apiUrl: process.env.CLOUD_API_URL || 'https://api.vending-cloud.com',
        apiKey: process.env.CLOUD_API_KEY || null,
        syncInterval: parseInt(process.env.CLOUD_SYNC_INTERVAL) || 300000, // 5 minutes
        maxRetries: parseInt(process.env.CLOUD_MAX_RETRIES) || 3,
        timeout: parseInt(process.env.CLOUD_TIMEOUT) || 30000
    },

    // CORS configuration
    cors: {
        origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },

    // Rate limiting configuration
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
        message: 'Too many requests from this IP, please try again later.'
    },

    // Monitoring configuration
    monitoring: {
        enabled: process.env.MONITORING_ENABLED === 'true',
        metricsInterval: parseInt(process.env.MONITORING_METRICS_INTERVAL) || 60000, // 1 minute
        healthCheckInterval: parseInt(process.env.MONITORING_HEALTH_CHECK_INTERVAL) || 30000, // 30 seconds
        alertThresholds: {
            cpuUsage: parseFloat(process.env.MONITORING_CPU_THRESHOLD) || 80,
            memoryUsage: parseFloat(process.env.MONITORING_MEMORY_THRESHOLD) || 80,
            responseTime: parseInt(process.env.MONITORING_RESPONSE_TIME_THRESHOLD) || 5000
        }
    },

    // Development configuration
    development: {
        enableDebugMode: process.env.DEBUG_MODE === 'true',
        enableTestData: process.env.ENABLE_TEST_DATA === 'true',
        mockSmartCard: process.env.MOCK_SMARTCARD === 'true',
        mockBiometric: process.env.MOCK_BIOMETRIC === 'true',
        mockMDB: process.env.MOCK_MDB === 'true'
    }
};

// Validate required configuration
function validateConfig() {
    const required = [
        'security.jwtSecret',
        'security.encryptionKey'
    ];

    const missing = required.filter(key => {
        const value = key.split('.').reduce((obj, k) => obj && obj[k], config);
        return !value;
    });

    if (missing.length > 0) {
        throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
}

// Generate encryption key if not provided
if (!config.security.encryptionKey) {
    const crypto = require('crypto');
    config.security.encryptionKey = crypto.randomBytes(32).toString('hex');
    console.warn('Generated new encryption key - ensure it is securely stored in production');
}

// Validate configuration
try {
    validateConfig();
} catch (error) {
    console.error('Configuration validation failed:', error.message);
    process.exit(1);
}

module.exports = config;
