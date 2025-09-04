const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

class AuthManager {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        this.jwtExpiry = process.env.JWT_EXPIRY || '24h';
        this.bcryptRounds = 10;
        
        // Default users (in production, these would be in a database)
        this.users = new Map([
            ['admin', {
                id: 'admin',
                username: 'admin',
                password: '$2b$10$8K1p/a0dclxKOkIlkq4dJOJhb5cVlLKRaIf1XkQzQxGQwHBfD4Xte', // 'admin123'
                role: 'administrator',
                permissions: ['read', 'write', 'admin'],
                createdAt: new Date().toISOString(),
                lastLogin: null,
                active: true
            }],
            ['operator', {
                id: 'operator',
                username: 'operator',
                password: '$2b$10$YourHashedPasswordHere', // 'operator123'
                role: 'operator',
                permissions: ['read', 'write'],
                createdAt: new Date().toISOString(),
                lastLogin: null,
                active: true
            }],
            ['viewer', {
                id: 'viewer',
                username: 'viewer',
                password: '$2b$10$AnotherHashedPasswordHere', // 'viewer123'
                role: 'viewer',
                permissions: ['read'],
                createdAt: new Date().toISOString(),
                lastLogin: null,
                active: true
            }]
        ]);
        
        this.activeSessions = new Map();
        this.loginAttempts = new Map();
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
    }

    /**
     * Authenticate user with username and password
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Object} Authentication result
     */
    async authenticate(username, password) {
        try {
            // Check if account is locked
            if (this.isAccountLocked(username)) {
                throw new Error('Account is temporarily locked due to multiple failed attempts');
            }

            const user = this.users.get(username);
            if (!user || !user.active) {
                this.recordFailedAttempt(username);
                throw new Error('Invalid credentials');
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                this.recordFailedAttempt(username);
                throw new Error('Invalid credentials');
            }

            // Clear failed attempts on successful login
            this.loginAttempts.delete(username);

            // Update last login
            user.lastLogin = new Date().toISOString();

            // Generate JWT token
            const token = this.generateToken(user);

            // Store active session
            this.activeSessions.set(token, {
                userId: user.id,
                username: user.username,
                role: user.role,
                permissions: user.permissions,
                loginTime: new Date().toISOString(),
                lastActivity: new Date().toISOString()
            });

            logger.info(`User ${username} authenticated successfully`);

            return {
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    permissions: user.permissions
                }
            };

        } catch (error) {
            logger.error(`Authentication failed for user ${username}:`, error.message);
            throw error;
        }
    }

    /**
     * Generate JWT token for user
     * @param {Object} user - User object
     * @returns {string} JWT token
     */
    generateToken(user) {
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role,
            permissions: user.permissions
        };

        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtExpiry,
            issuer: 'vending-machine-system',
            audience: 'vending-machine-dashboard'
        });
    }

    /**
     * Verify JWT token
     * @param {string} token - JWT token
     * @returns {Object} Token payload or null
     */
    verifyToken(token) {
        try {
            const payload = jwt.verify(token, this.jwtSecret);
            
            // Check if session is still active
            const session = this.activeSessions.get(token);
            if (!session) {
                throw new Error('Session not found');
            }

            // Update last activity
            session.lastActivity = new Date().toISOString();

            return payload;
        } catch (error) {
            logger.error('Token verification failed:', error.message);
            return null;
        }
    }

    /**
     * Logout user by invalidating token
     * @param {string} token - JWT token
     */
    logout(token) {
        const session = this.activeSessions.get(token);
        if (session) {
            logger.info(`User ${session.username} logged out`);
            this.activeSessions.delete(token);
        }
    }

    /**
     * Check if user has permission
     * @param {string} token - JWT token
     * @param {string} permission - Required permission
     * @returns {boolean} Has permission
     */
    hasPermission(token, permission) {
        const session = this.activeSessions.get(token);
        if (!session) {
            return false;
        }

        return session.permissions.includes(permission) || session.permissions.includes('admin');
    }

    /**
     * Record failed login attempt
     * @param {string} username - Username
     */
    recordFailedAttempt(username) {
        const attempts = this.loginAttempts.get(username) || {
            count: 0,
            lastAttempt: null,
            lockedUntil: null
        };

        attempts.count++;
        attempts.lastAttempt = new Date();

        if (attempts.count >= this.maxLoginAttempts) {
            attempts.lockedUntil = new Date(Date.now() + this.lockoutDuration);
            logger.warn(`Account ${username} locked due to ${attempts.count} failed attempts`);
        }

        this.loginAttempts.set(username, attempts);
    }

    /**
     * Check if account is locked
     * @param {string} username - Username
     * @returns {boolean} Is account locked
     */
    isAccountLocked(username) {
        const attempts = this.loginAttempts.get(username);
        if (!attempts || !attempts.lockedUntil) {
            return false;
        }

        if (new Date() > attempts.lockedUntil) {
            // Lock expired, clear attempts
            this.loginAttempts.delete(username);
            return false;
        }

        return true;
    }

    /**
     * Create new user (admin only)
     * @param {Object} userData - User data
     * @returns {Object} Created user
     */
    async createUser(userData) {
        const { username, password, role, permissions } = userData;

        if (this.users.has(username)) {
            throw new Error('Username already exists');
        }

        const hashedPassword = await bcrypt.hash(password, this.bcryptRounds);

        const user = {
            id: username,
            username,
            password: hashedPassword,
            role,
            permissions: permissions || this.getDefaultPermissions(role),
            createdAt: new Date().toISOString(),
            lastLogin: null,
            active: true
        };

        this.users.set(username, user);
        logger.info(`User ${username} created with role ${role}`);

        return {
            id: user.id,
            username: user.username,
            role: user.role,
            permissions: user.permissions,
            createdAt: user.createdAt
        };
    }

    /**
     * Get default permissions for role
     * @param {string} role - User role
     * @returns {Array} Default permissions
     */
    getDefaultPermissions(role) {
        const rolePermissions = {
            administrator: ['read', 'write', 'admin'],
            operator: ['read', 'write'],
            viewer: ['read']
        };

        return rolePermissions[role] || ['read'];
    }

    /**
     * Get all active sessions
     * @returns {Array} Active sessions
     */
    getActiveSessions() {
        return Array.from(this.activeSessions.values());
    }

    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions() {
        const now = new Date();
        const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours

        for (const [token, session] of this.activeSessions.entries()) {
            const lastActivity = new Date(session.lastActivity);
            if (now - lastActivity > sessionTimeout) {
                this.activeSessions.delete(token);
                logger.info(`Expired session cleaned up for user ${session.username}`);
            }
        }
    }

    /**
     * Get authentication statistics
     * @returns {Object} Auth statistics
     */
    getAuthStats() {
        return {
            totalUsers: this.users.size,
            activeUsers: Array.from(this.users.values()).filter(u => u.active).length,
            activeSessions: this.activeSessions.size,
            lockedAccounts: Array.from(this.loginAttempts.values()).filter(a => a.lockedUntil && new Date() < a.lockedUntil).length,
            failedAttempts: Array.from(this.loginAttempts.values()).reduce((sum, a) => sum + a.count, 0)
        };
    }
}

module.exports = AuthManager;
