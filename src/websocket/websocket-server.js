const { Server } = require('socket.io');
const logger = require('../utils/logger');

class WebSocketServer {
    constructor() {
        this.io = null;
        this.connectedClients = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize WebSocket server
     * @param {Object} server - HTTP server instance
     */
    initialize(server) {
        try {
            this.io = new Server(server, {
                cors: {
                    origin: process.env.FRONTEND_URL || "http://localhost:3001",
                    methods: ["GET", "POST"],
                    credentials: true
                },
                transports: ['websocket', 'polling']
            });

            this.setupEventHandlers();
            this.isInitialized = true;
            
            logger.info('WebSocket server initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize WebSocket server:', error);
            throw error;
        }
    }

    /**
     * Set up WebSocket event handlers
     */
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            logger.info(`Client connected: ${socket.id}`);
            
            this.connectedClients.set(socket.id, {
                id: socket.id,
                connectedAt: new Date(),
                lastActivity: new Date()
            });

            // Handle client authentication
            socket.on('authenticate', (data) => {
                logger.info(`Client ${socket.id} authenticated:`, data);
                socket.join('authenticated');
            });

            // Handle subscription to real-time updates
            socket.on('subscribe', (channels) => {
                logger.info(`Client ${socket.id} subscribed to:`, channels);
                
                if (Array.isArray(channels)) {
                    channels.forEach(channel => {
                        socket.join(channel);
                    });
                } else {
                    socket.join(channels);
                }
            });

            // Handle unsubscription
            socket.on('unsubscribe', (channels) => {
                logger.info(`Client ${socket.id} unsubscribed from:`, channels);
                
                if (Array.isArray(channels)) {
                    channels.forEach(channel => {
                        socket.leave(channel);
                    });
                } else {
                    socket.leave(channels);
                }
            });

            // Handle ping for connection keep-alive
            socket.on('ping', () => {
                this.connectedClients.get(socket.id).lastActivity = new Date();
                socket.emit('pong');
            });

            // Handle disconnection
            socket.on('disconnect', (reason) => {
                logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
                this.connectedClients.delete(socket.id);
            });

            // Send initial connection confirmation
            socket.emit('connected', {
                clientId: socket.id,
                timestamp: new Date().toISOString(),
                availableChannels: [
                    'system-status',
                    'transactions',
                    'alerts',
                    'performance',
                    'security'
                ]
            });
        });

        // Handle server errors
        this.io.on('error', (error) => {
            logger.error('WebSocket server error:', error);
        });
    }

    /**
     * Broadcast system status updates
     * @param {Object} statusData - System status data
     */
    broadcastSystemStatus(statusData) {
        if (!this.isInitialized) return;

        this.io.to('system-status').emit('system-status-update', {
            timestamp: new Date().toISOString(),
            data: statusData
        });
    }

    /**
     * Broadcast transaction updates
     * @param {Object} transactionData - Transaction data
     */
    broadcastTransaction(transactionData) {
        if (!this.isInitialized) return;

        this.io.to('transactions').emit('transaction-update', {
            timestamp: new Date().toISOString(),
            data: transactionData
        });
    }

    /**
     * Broadcast alert notifications
     * @param {Object} alertData - Alert data
     */
    broadcastAlert(alertData) {
        if (!this.isInitialized) return;

        this.io.to('alerts').emit('alert', {
            timestamp: new Date().toISOString(),
            data: alertData
        });
    }

    /**
     * Broadcast performance metrics
     * @param {Object} performanceData - Performance data
     */
    broadcastPerformance(performanceData) {
        if (!this.isInitialized) return;

        this.io.to('performance').emit('performance-update', {
            timestamp: new Date().toISOString(),
            data: performanceData
        });
    }

    /**
     * Broadcast security events
     * @param {Object} securityData - Security event data
     */
    broadcastSecurity(securityData) {
        if (!this.isInitialized) return;

        this.io.to('security').emit('security-event', {
            timestamp: new Date().toISOString(),
            data: securityData
        });
    }

    /**
     * Get connected clients information
     * @returns {Object} Connected clients data
     */
    getConnectedClients() {
        return {
            count: this.connectedClients.size,
            clients: Array.from(this.connectedClients.values())
        };
    }

    /**
     * Get server status
     * @returns {Object} WebSocket server status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            connectedClients: this.connectedClients.size,
            uptime: this.isInitialized ? Date.now() - this.startTime : 0
        };
    }

    /**
     * Cleanup WebSocket server
     */
    async cleanup() {
        try {
            if (this.io) {
                this.io.close();
                logger.info('WebSocket server closed');
            }
            
            this.connectedClients.clear();
            this.isInitialized = false;
            
        } catch (error) {
            logger.error('Error during WebSocket cleanup:', error);
        }
    }
}

module.exports = WebSocketServer;
