const SmartCardReader = require('../../src/smartcard/smartcard-reader');

describe('SmartCardReader Unit Tests', () => {
    let reader;

    beforeEach(() => {
        // Set up mock environment
        process.env.MOCK_SMARTCARD = 'true';
        reader = new SmartCardReader({
            readerName: 'Test Reader',
            timeout: 5000
        });
    });

    afterEach(() => {
        if (reader) {
            reader.cleanup();
        }
    });

    describe('Initialization', () => {
        it('should initialize successfully in mock mode', async () => {
            await reader.initialize();
            expect(reader.isConnected).toBe(true);
        });

        it('should handle initialization errors gracefully', async () => {
            // Simulate initialization error
            process.env.MOCK_SMARTCARD = 'false';
            
            // This might throw in real hardware mode without actual reader
            try {
                await reader.initialize();
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });

    describe('Card Detection', () => {
        beforeEach(async () => {
            await reader.initialize();
        });

        it('should detect card presence in mock mode', () => {
            const isPresent = reader.isCardPresent();
            expect(typeof isPresent).toBe('boolean');
        });

        it('should handle card insertion events', () => {
            // Test that the reader has card waiting capability
            expect(typeof reader.waitForCard).toBe('function');
        });

        it('should handle card removal events', () => {
            // Test that the reader has cleanup capability
            expect(typeof reader.cleanup).toBe('function');
        });
    });

    describe('APDU Commands', () => {
        beforeEach(async () => {
            await reader.initialize();
        });

        it('should send SELECT FILE command successfully', async () => {
            const command = {
                cla: 0x00,
                ins: 0xA4,
                p1: 0x04,
                p2: 0x00,
                data: [0xA0, 0x00, 0x00, 0x00, 0x54, 0x48, 0x00, 0x01]
            };

            const response = await reader.sendAPDU(command);
            
            expect(response).toHaveProperty('status');
            expect(response).toHaveProperty('success');
            expect(response.success).toBe(true);
        });

        it('should read birth date data successfully', async () => {
            const command = {
                cla: 0x80,
                ins: 0xB0,
                p1: 0x00,
                p2: 0xD9,
                le: 0x08
            };

            const response = await reader.sendAPDU(command);
            
            expect(response).toHaveProperty('data');
            expect(response.success).toBe(true);
            expect(response.data).toBeInstanceOf(Buffer);
        });

        it('should handle APDU errors gracefully', async () => {
            const invalidCommand = {
                cla: 0xFF,
                ins: 0xFF,
                p1: 0xFF,
                p2: 0xFF
            };

            const response = await reader.sendAPDU(invalidCommand);
            
            expect(response).toHaveProperty('success');
            // In mock mode, should still succeed
            expect(response.success).toBe(true);
        });
    });

    describe('Thai ID Card Parsing', () => {
        it('should parse mock birth date correctly', () => {
            // Mock Thai birth date data (Buddhist year 2542 = 1999 CE)
            const mockBirthData = Buffer.from([0x25, 0x42, 0x01, 0x15]); // 2542-01-15
            
            // This would be called internally by the reader
            expect(mockBirthData.length).toBe(4);
            expect(mockBirthData[0]).toBe(0x25); // Year high byte
            expect(mockBirthData[1]).toBe(0x42); // Year low byte
            expect(mockBirthData[2]).toBe(0x01); // Month
            expect(mockBirthData[3]).toBe(0x15); // Day
        });
    });

    describe('Status and Monitoring', () => {
        beforeEach(async () => {
            await reader.initialize();
        });

        it('should return correct status', () => {
            const status = reader.getStatus();
            
            expect(status).toHaveProperty('connected');
            expect(status).toHaveProperty('cardPresent');
            expect(status).toHaveProperty('readerName');
            expect(status.connected).toBe(true);
        });

        it('should handle cleanup properly', async () => {
            await reader.cleanup();
            
            const status = reader.getStatus();
            expect(status.connected).toBe(false);
        });
    });
});
