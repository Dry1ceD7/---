/**
 * MDB (Multi-Drop Bus) Protocol Communicator
 * Handles communication with vending machines using MDB Level 3 protocol
 * Implements purchase authorization and machine status monitoring
 */

const SerialPort = require('serialport');
const logger = require('../utils/logger');

class MDBCommunicator {
    constructor(config) {
        this.config = config;
        this.port = config.port || '/dev/ttyUSB0';
        this.baudRate = config.baudRate || 9600;
        this.timeout = config.timeout || 5000;
        this.serialPort = null;
        this.isConnected = false;
        this.isInitialized = false;
        
        // MDB Protocol constants
        this.mdbConstants = {
            // MDB Addresses
            VMC: 0x00,  // Vending Machine Controller
            COIN: 0x01, // Coin Changer
            BILL: 0x02, // Bill Validator
            CARD: 0x03, // Card Reader
            AGE_VERIFICATION: 0x04, // Age Verification System
            
            // MDB Commands
            RESET: 0x00,
            SETUP: 0x01,
            POLL: 0x02,
            VEND: 0x03,
            READ: 0x04,
            EXPANSION: 0x05,
            
            // MDB Responses
            ACK: 0x00,
            NAK: 0xFF,
            JUST_RESET: 0x01,
            READY: 0x02,
            VEND_REQUEST: 0x03,
            VEND_SUCCESS: 0x04,
            VEND_FAILURE: 0x05,
            
            // MDB Status
            STATUS_OK: 0x00,
            STATUS_ERROR: 0x01,
            STATUS_BUSY: 0x02,
            STATUS_OUT_OF_STOCK: 0x03,
            STATUS_AGE_VERIFICATION_REQUIRED: 0x04,
            STATUS_AGE_VERIFICATION_FAILED: 0x05
        };
        
        // Message buffer for MDB communication
        this.messageBuffer = [];
        this.expectedResponseLength = 0;
    }

    /**
     * Initialize the MDB communicator
     */
    async initialize() {
        try {
            logger.info('Initializing MDB Communicator...');
            
            // Initialize serial port
            await this.initializeSerialPort();
            
            // Perform MDB handshake
            await this.performMDBHandshake();
            
            this.isInitialized = true;
            logger.info('MDB Communicator initialized successfully');
            
        } catch (error) {
            logger.error('Failed to initialize MDB Communicator:', error);
            throw error;
        }
    }

    /**
     * Initialize serial port for MDB communication
     */
    async initializeSerialPort() {
        try {
            logger.info(`Initializing serial port: ${this.port} at ${this.baudRate} baud`);
            
            this.serialPort = new SerialPort({
                path: this.port,
                baudRate: this.baudRate,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                autoOpen: false
            });
            
            // Set up event handlers
            this.serialPort.on('open', () => {
                logger.info('Serial port opened successfully');
                this.isConnected = true;
            });
            
            this.serialPort.on('data', (data) => {
                this.handleIncomingData(data);
            });
            
            this.serialPort.on('error', (error) => {
                logger.error('Serial port error:', error);
                this.isConnected = false;
            });
            
            this.serialPort.on('close', () => {
                logger.info('Serial port closed');
                this.isConnected = false;
            });
            
            // Open the port
            await new Promise((resolve, reject) => {
                this.serialPort.open((error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
            
        } catch (error) {
            logger.error('Failed to initialize serial port:', error);
            throw error;
        }
    }

    /**
     * Perform MDB handshake with vending machine
     */
    async performMDBHandshake() {
        try {
            logger.info('Performing MDB handshake...');
            
            // Send reset command
            await this.sendMDBCommand(this.mdbConstants.RESET, []);
            
            // Wait for just reset response
            const resetResponse = await this.waitForResponse();
            if (resetResponse.command !== this.mdbConstants.JUST_RESET) {
                throw new Error('Invalid reset response from vending machine');
            }
            
            // Send setup command
            await this.sendMDBCommand(this.mdbConstants.SETUP, [0x01, 0x00]); // Setup with age verification enabled
            
            // Wait for ready response
            const setupResponse = await this.waitForResponse();
            if (setupResponse.command !== this.mdbConstants.READY) {
                throw new Error('Invalid setup response from vending machine');
            }
            
            logger.info('MDB handshake completed successfully');
            
        } catch (error) {
            logger.error('MDB handshake failed:', error);
            throw error;
        }
    }

    /**
     * Send MDB command to vending machine
     * @param {number} command - MDB command
     * @param {Array} data - Command data
     * @returns {Promise} Command response
     */
    async sendMDBCommand(command, data = []) {
        try {
            if (!this.isConnected) {
                throw new Error('MDB communicator not connected');
            }
            
            logger.info(`Sending MDB command: 0x${command.toString(16).padStart(2, '0')}`);
            
            // Build MDB message
            const message = this.buildMDBMessage(command, data);
            
            // Send message
            await this.writeToSerialPort(message);
            
            // Wait for response
            const response = await this.waitForResponse();
            
            logger.info(`MDB command completed with status: 0x${response.status.toString(16).padStart(2, '0')}`);
            return response;
            
        } catch (error) {
            logger.error('MDB command failed:', error);
            throw error;
        }
    }

    /**
     * Build MDB message
     * @param {number} command - MDB command
     * @param {Array} data - Command data
     * @returns {Buffer} MDB message
     */
    buildMDBMessage(command, data) {
        const message = Buffer.alloc(3 + data.length);
        
        // MDB message format: [Address][Command][DataLength][Data...]
        message[0] = this.mdbConstants.VMC; // Address (Vending Machine Controller)
        message[1] = command;
        message[2] = data.length;
        
        // Copy data
        for (let i = 0; i < data.length; i++) {
            message[3 + i] = data[i];
        }
        
        return message;
    }

    /**
     * Write data to serial port
     * @param {Buffer} data - Data to write
     */
    async writeToSerialPort(data) {
        return new Promise((resolve, reject) => {
            this.serialPort.write(data, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Handle incoming data from serial port
     * @param {Buffer} data - Incoming data
     */
    handleIncomingData(data) {
        logger.info(`Received MDB data: ${data.toString('hex')}`);
        
        // Add data to message buffer
        this.messageBuffer.push(...data);
        
        // Process complete messages
        this.processMessageBuffer();
    }

    /**
     * Process message buffer for complete MDB messages
     */
    processMessageBuffer() {
        while (this.messageBuffer.length >= 3) {
            const dataLength = this.messageBuffer[2];
            const totalLength = 3 + dataLength;
            
            if (this.messageBuffer.length >= totalLength) {
                // Extract complete message
                const message = this.messageBuffer.splice(0, totalLength);
                this.processMDBMessage(message);
            } else {
                break;
            }
        }
    }

    /**
     * Process complete MDB message
     * @param {Array} message - Complete MDB message
     */
    processMDBMessage(message) {
        const address = message[0];
        const command = message[1];
        const dataLength = message[2];
        const data = message.slice(3, 3 + dataLength);
        
        logger.info(`Processing MDB message: Address=0x${address.toString(16)}, Command=0x${command.toString(16)}, DataLength=${dataLength}`);
        
        // Store response for waiting commands
        this.lastResponse = {
            address,
            command,
            data,
            timestamp: Date.now()
        };
    }

    /**
     * Wait for MDB response
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise} MDB response
     */
    async waitForResponse(timeout = this.timeout) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkResponse = () => {
                if (this.lastResponse) {
                    const response = this.lastResponse;
                    this.lastResponse = null;
                    resolve(response);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('MDB response timeout'));
                } else {
                    setTimeout(checkResponse, 10);
                }
            };
            
            checkResponse();
        });
    }

    /**
     * Authorize purchase
     * @param {string} productId - Product identifier
     * @returns {Object} Authorization result
     */
    async authorizePurchase(productId) {
        try {
            logger.info(`Authorizing purchase for product: ${productId}`);
            
            // Send vend command with product ID
            const productIdBytes = this.stringToBytes(productId);
            const response = await this.sendMDBCommand(this.mdbConstants.VEND, productIdBytes);
            
            if (response.command === this.mdbConstants.VEND_SUCCESS) {
                logger.info(`Purchase authorized for product: ${productId}`);
                return {
                    authorized: true,
                    productId,
                    timestamp: new Date().toISOString()
                };
            } else {
                logger.warn(`Purchase authorization failed for product: ${productId}`);
                return {
                    authorized: false,
                    productId,
                    reason: this.getVendFailureReason(response.data[0]),
                    timestamp: new Date().toISOString()
                };
            }
            
        } catch (error) {
            logger.error(`Purchase authorization failed for product ${productId}:`, error);
            throw error;
        }
    }

    /**
     * Deny purchase
     * @param {string} productId - Product identifier
     * @param {string} reason - Denial reason
     * @returns {Object} Denial result
     */
    async denyPurchase(productId, reason) {
        try {
            logger.info(`Denying purchase for product: ${productId}, reason: ${reason}`);
            
            // Send vend failure command
            const reasonCode = this.getDenialReasonCode(reason);
            const response = await this.sendMDBCommand(this.mdbConstants.VEND, [reasonCode]);
            
            logger.info(`Purchase denied for product: ${productId}`);
            return {
                authorized: false,
                productId,
                reason,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            logger.error(`Purchase denial failed for product ${productId}:`, error);
            throw error;
        }
    }

    /**
     * Poll vending machine status
     * @returns {Object} Machine status
     */
    async pollStatus() {
        try {
            logger.info('Polling vending machine status...');
            
            const response = await this.sendMDBCommand(this.mdbConstants.POLL, []);
            
            const status = {
                online: true,
                status: response.data[0] || this.mdbConstants.STATUS_OK,
                timestamp: new Date().toISOString()
            };
            
            logger.info(`Vending machine status: ${status.status}`);
            return status;
            
        } catch (error) {
            logger.error('Status polling failed:', error);
            return {
                online: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get vend failure reason
     * @param {number} reasonCode - Reason code
     * @returns {string} Reason description
     */
    getVendFailureReason(reasonCode) {
        const reasons = {
            0x01: 'Out of stock',
            0x02: 'Insufficient funds',
            0x03: 'Age verification required',
            0x04: 'Age verification failed',
            0x05: 'Machine busy',
            0x06: 'Product unavailable',
            0x07: 'System error'
        };
        
        return reasons[reasonCode] || 'Unknown error';
    }

    /**
     * Get denial reason code
     * @param {string} reason - Denial reason
     * @returns {number} Reason code
     */
    getDenialReasonCode(reason) {
        const reasonCodes = {
            'Age requirement not met': 0x04,
            'Age verification failed': 0x04,
            'Out of stock': 0x01,
            'Insufficient funds': 0x02,
            'System error': 0x07
        };
        
        return reasonCodes[reason] || 0x07;
    }

    /**
     * Convert string to byte array
     * @param {string} str - String to convert
     * @returns {Array} Byte array
     */
    stringToBytes(str) {
        return Array.from(str, char => char.charCodeAt(0));
    }

    /**
     * Get MDB communicator status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            connected: this.isConnected,
            initialized: this.isInitialized,
            port: this.port,
            baudRate: this.baudRate,
            timeout: this.timeout
        };
    }

    /**
     * Disconnect from vending machine
     */
    async disconnect() {
        try {
            logger.info('Disconnecting from vending machine...');
            
            if (this.serialPort && this.serialPort.isOpen) {
                await new Promise((resolve, reject) => {
                    this.serialPort.close((error) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
                });
            }
            
            this.isConnected = false;
            this.isInitialized = false;
            
            logger.info('Disconnected from vending machine');
            
        } catch (error) {
            logger.error('Failed to disconnect from vending machine:', error);
            throw error;
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            await this.disconnect();
            logger.info('MDB communicator cleanup completed');
        } catch (error) {
            logger.error('Error during MDB communicator cleanup:', error);
        }
    }
}

module.exports = MDBCommunicator;
