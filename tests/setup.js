// Jest setup file for all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.MOCK_SMARTCARD = 'true';
process.env.MOCK_BIOMETRIC = 'true';
process.env.MOCK_MDB = 'true';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during testing

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce test output noise
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
  // Only show errors in tests unless explicitly testing logging
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

// Global error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Helper function to create test data
global.createTestVerificationRequest = () => ({
  productCategory: 'alcohol',
  productId: 'test-product-001',
  biometricData: {
    faceImage: 'base64-test-image-data'
  }
});

// Helper function to wait for async operations
global.waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to create mock Thai ID card data
global.createMockThaiIDData = () => ({
  birthDate: Buffer.from([0x25, 0x42, 0x01, 0x15]), // 2542-01-15 (Buddhist calendar)
  photo: Buffer.alloc(1024, 0xFF),
  cardNumber: '1234567890123',
  name: 'Test User'
});

console.log('Test environment initialized');
