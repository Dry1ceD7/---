const logger = require('../utils/logger');

/**
 * Thai National ID Card Integration
 * Specialized handler for Thai National ID cards with PC/SC interface
 * Implements Thai Government Digital ID standards and APDU commands
 */
class ThaiIDIntegration {
    constructor(config = {}) {
        this.config = {
            cardType: 'Thai National ID',
            timeout: config.timeout || 5000,
            retryAttempts: config.retryAttempts || 3,
            enableValidation: config.enableValidation ?? true,
            mock: process.env.MOCK_SMARTCARD === 'true'
        };

        // Thai National ID Card APDU Commands
        this.apduCommands = {
            // Select Thai National ID Application
            selectApplication: [0x00, 0xA4, 0x04, 0x00, 0x08, 0xA0, 0x00, 0x00, 0x00, 0x54, 0x48, 0x00, 0x01],
            
            // Read Personal Data (includes birth date)
            readPersonalData: [0x80, 0xB0, 0x00, 0x04, 0x02, 0x00, 0x0D],
            
            // Read Birth Date specifically
            readBirthDate: [0x80, 0xB0, 0x00, 0xD9, 0x02, 0x00, 0x08],
            
            // Read ID Number
            readIDNumber: [0x80, 0xB0, 0x00, 0x00, 0x02, 0x00, 0x0D],
            
            // Read Name (Thai)
            readNameThai: [0x80, 0xB0, 0x00, 0x11, 0x02, 0x00, 0x64],
            
            // Read Name (English)
            readNameEnglish: [0x80, 0xB0, 0x00, 0x75, 0x02, 0x00, 0x64],
            
            // Read Address
            readAddress: [0x80, 0xB0, 0x00, 0xD9, 0x02, 0x00, 0x64],
            
            // Read Photo
            readPhoto: [0x80, 0xB0, 0x01, 0x7B, 0x02, 0x00, 0xFF]
        };

        // Thai calendar offset (Buddhist Era to Christian Era)
        this.buddhist_offset = 543;
        
        this.cardReader = null;
        this.isInitialized = false;
    }

    /**
     * Initialize Thai ID card integration
     */
    async initialize(cardReader) {
        try {
            this.cardReader = cardReader;
            this.isInitialized = true;
            
            logger.info('Thai ID Integration initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Thai ID Integration:', error);
            throw error;
        }
    }

    /**
     * Read complete Thai National ID card data
     */
    async readThaiIDCard() {
        if (!this.isInitialized) {
            throw new Error('Thai ID Integration not initialized');
        }

        const startTime = Date.now();
        logger.info('Reading Thai National ID card...');

        try {
            // Step 1: Select Thai National ID application
            await this.selectThaiIDApplication();

            // Step 2: Read all card data
            const cardData = await this.readAllCardData();

            // Step 3: Process and validate data
            const processedData = this.processCardData(cardData);

            const readTime = Date.now() - startTime;
            logger.info(`Thai ID card read completed in ${readTime}ms`);

            return {
                success: true,
                data: processedData,
                readTime,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Failed to read Thai ID card:', error);
            throw new Error(`Thai ID card read failed: ${error.message}`);
        }
    }

    /**
     * Select Thai National ID application on the card
     */
    async selectThaiIDApplication() {
        logger.debug('Selecting Thai National ID application...');
        
        if (this.config.mock) {
            // Mock successful selection
            return { success: true, statusCode: [0x90, 0x00] };
        }

        const response = await this.sendAPDUWithRetry(this.apduCommands.selectApplication);
        
        if (!this.isSuccessResponse(response)) {
            throw new Error('Failed to select Thai National ID application');
        }

        logger.debug('Thai National ID application selected successfully');
        return response;
    }

    /**
     * Read all required data from Thai National ID card
     */
    async readAllCardData() {
        const cardData = {};

        try {
            // Read ID Number
            logger.debug('Reading ID number...');
            cardData.idNumber = await this.readIDNumber();

            // Read Personal Names
            logger.debug('Reading names...');
            cardData.nameThai = await this.readNameThai();
            cardData.nameEnglish = await this.readNameEnglish();

            // Read Birth Date (most important for age verification)
            logger.debug('Reading birth date...');
            cardData.birthDate = await this.readBirthDate();

            // Read Address
            logger.debug('Reading address...');
            cardData.address = await this.readAddress();

            // Read Photo (optional, for biometric verification)
            logger.debug('Reading photo...');
            cardData.photo = await this.readPhoto();

            return cardData;

        } catch (error) {
            logger.error('Failed to read card data:', error);
            throw error;
        }
    }

    /**
     * Read Thai National ID number
     */
    async readIDNumber() {
        if (this.config.mock) {
            return '1234567890123'; // Mock Thai ID number
        }

        const response = await this.sendAPDUWithRetry(this.apduCommands.readIDNumber);
        return this.parseIDNumber(response);
    }

    /**
     * Read Thai name from card
     */
    async readNameThai() {
        if (this.config.mock) {
            return 'นายสมชาย ใจดี'; // Mock Thai name
        }

        const response = await this.sendAPDUWithRetry(this.apduCommands.readNameThai);
        return this.parseThaiText(response);
    }

    /**
     * Read English name from card
     */
    async readNameEnglish() {
        if (this.config.mock) {
            return 'Mr. Somchai Jaidee'; // Mock English name
        }

        const response = await this.sendAPDUWithRetry(this.apduCommands.readNameEnglish);
        return this.parseEnglishText(response);
    }

    /**
     * Read birth date from Thai National ID card
     */
    async readBirthDate() {
        if (this.config.mock) {
            // Mock birth date: 25 years old (1999-01-15 in Buddhist calendar)
            const mockBirthYear = new Date().getFullYear() - 25 + this.buddhist_offset;
            return Buffer.from([
                (mockBirthYear >> 8) & 0xFF,  // Year high byte
                mockBirthYear & 0xFF,         // Year low byte
                1,                            // Month (January)
                15                            // Day
            ]);
        }

        const response = await this.sendAPDUWithRetry(this.apduCommands.readBirthDate);
        return response; // Return raw birth date data for processing
    }

    /**
     * Read address from card
     */
    async readAddress() {
        if (this.config.mock) {
            return '123 หมู่ 1 ตำบลบางซื่อ อำเภอบางซื่อ จังหวัดกรุงเทพมหานคร 10800';
        }

        const response = await this.sendAPDUWithRetry(this.apduCommands.readAddress);
        return this.parseThaiText(response);
    }

    /**
     * Read photo data from card
     */
    async readPhoto() {
        if (this.config.mock) {
            // Return mock photo data (JPEG header + minimal data)
            return Buffer.from([
                0xFF, 0xD8, 0xFF, 0xE0, // JPEG header
                ...Array(1020).fill(0xFF) // Mock photo data
            ]);
        }

        const response = await this.sendAPDUWithRetry(this.apduCommands.readPhoto);
        return response; // Return raw photo data
    }

    /**
     * Process and validate all card data
     */
    processCardData(rawData) {
        const processedData = {
            idNumber: rawData.idNumber,
            name: {
                thai: rawData.nameThai,
                english: rawData.nameEnglish
            },
            birthDate: this.parseBirthDate(rawData.birthDate),
            address: rawData.address,
            photo: rawData.photo,
            age: null,
            validation: {
                isValid: true,
                errors: []
            }
        };

        // Calculate age
        if (processedData.birthDate) {
            processedData.age = this.calculateAge(processedData.birthDate);
        }

        // Validate data if enabled
        if (this.config.enableValidation) {
            this.validateCardData(processedData);
        }

        return processedData;
    }

    /**
     * Parse birth date from Thai National ID card format
     */
    parseBirthDate(birthDateData) {
        try {
            if (!birthDateData || birthDateData.length < 4) {
                throw new Error('Invalid birth date data');
            }

            // Thai National ID stores date as: [YearHigh, YearLow, Month, Day]
            // Year is in Buddhist Era (BE), need to convert to Christian Era (CE)
            const year = (birthDateData[0] << 8) | birthDateData[1];
            const month = birthDateData[2];
            const day = birthDateData[3];

            // Convert Buddhist year to Christian year
            const christianYear = year - this.buddhist_offset;

            // Create Date object (month is 0-indexed in JavaScript)
            const birthDate = new Date(christianYear, month - 1, day);

            // Validate the date
            if (isNaN(birthDate.getTime())) {
                throw new Error('Invalid date values');
            }

            logger.debug(`Parsed birth date: ${birthDate.toDateString()} (BE ${year} -> CE ${christianYear})`);
            return birthDate;

        } catch (error) {
            logger.error('Failed to parse birth date:', error);
            return null;
        }
    }

    /**
     * Calculate age from birth date
     */
    calculateAge(birthDate) {
        if (!birthDate) return null;

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    }

    /**
     * Parse ID number from card response
     */
    parseIDNumber(response) {
        if (!response || response.length < 13) {
            throw new Error('Invalid ID number response');
        }

        // Convert bytes to string (assuming ASCII encoding)
        return response.slice(0, 13).toString('ascii').replace(/\0/g, '');
    }

    /**
     * Parse Thai text from card response
     */
    parseThaiText(response) {
        if (!response) return '';

        // Thai text is typically encoded in TIS-620 or UTF-8
        // For simplicity, we'll assume UTF-8 and remove null bytes
        return response.toString('utf8').replace(/\0/g, '').trim();
    }

    /**
     * Parse English text from card response
     */
    parseEnglishText(response) {
        if (!response) return '';

        // English text is typically ASCII
        return response.toString('ascii').replace(/\0/g, '').trim();
    }

    /**
     * Validate card data integrity and format
     */
    validateCardData(cardData) {
        const errors = [];

        // Validate ID number (13 digits)
        if (!cardData.idNumber || !/^\d{13}$/.test(cardData.idNumber)) {
            errors.push('Invalid ID number format');
        }

        // Validate age (must be reasonable)
        if (cardData.age === null || cardData.age < 0 || cardData.age > 120) {
            errors.push('Invalid age calculated');
        }

        // Validate birth date (must be in the past)
        if (!cardData.birthDate || cardData.birthDate > new Date()) {
            errors.push('Invalid birth date');
        }

        // Validate names (must not be empty)
        if (!cardData.name.thai || !cardData.name.english) {
            errors.push('Missing name information');
        }

        cardData.validation.errors = errors;
        cardData.validation.isValid = errors.length === 0;

        if (errors.length > 0) {
            logger.warn('Card data validation failed:', errors);
        }
    }

    /**
     * Send APDU command with retry logic
     */
    async sendAPDUWithRetry(command) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                logger.debug(`APDU attempt ${attempt}/${this.config.retryAttempts}`);
                
                const response = await this.cardReader.sendAPDU(command);
                
                if (this.isSuccessResponse(response)) {
                    return response;
                }
                
                throw new Error(`APDU command failed with status: ${this.getStatusCode(response)}`);
                
            } catch (error) {
                lastError = error;
                logger.warn(`APDU attempt ${attempt} failed:`, error.message);
                
                if (attempt < this.config.retryAttempts) {
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 100 * attempt));
                }
            }
        }
        
        throw new Error(`APDU command failed after ${this.config.retryAttempts} attempts: ${lastError.message}`);
    }

    /**
     * Check if APDU response indicates success
     */
    isSuccessResponse(response) {
        if (!response || response.length < 2) return false;
        
        // Check for success status codes (0x9000, 0x9001, etc.)
        const statusCode = (response[response.length - 2] << 8) | response[response.length - 1];
        return statusCode === 0x9000 || (statusCode & 0xFF00) === 0x9000;
    }

    /**
     * Get status code from APDU response
     */
    getStatusCode(response) {
        if (!response || response.length < 2) return 'Unknown';
        
        const statusCode = (response[response.length - 2] << 8) | response[response.length - 1];
        return `0x${statusCode.toString(16).toUpperCase()}`;
    }

    /**
     * Get integration status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            cardType: this.config.cardType,
            mockMode: this.config.mock,
            config: this.config
        };
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            this.cardReader = null;
            this.isInitialized = false;
            logger.info('Thai ID Integration cleanup completed');
        } catch (error) {
            logger.error('Error during Thai ID Integration cleanup:', error);
        }
    }
}

module.exports = ThaiIDIntegration;
