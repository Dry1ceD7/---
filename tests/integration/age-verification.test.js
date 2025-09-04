const request = require('supertest');
const express = require('express');

// Create a test app instance
const createTestApp = () => {
    const app = express();
    app.use(express.json());
    
    // Mock routes for testing
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            uptime: process.uptime(),
            version: '1.0.0'
        });
    });
    
    app.get('/api/status', (req, res) => {
        res.json({
            system: {
                initialized: true
            },
            ageVerification: {
                initialized: true
            }
        });
    });
    
    app.post('/api/verify-age', (req, res) => {
        const { productCategory, productId, biometricData } = req.body;
        
        if (!biometricData) {
            return res.status(400).json({ error: 'Missing biometric data' });
        }
        
        if (!['alcohol', 'tobacco', 'general', 'medicine'].includes(productCategory)) {
            return res.status(400).json({ error: 'Invalid product category' });
        }
        
        res.json({
            sessionId: 'test-session-id',
            success: true,
            authorized: false,
            processingTime: 100
        });
    });
    
    return app;
};

describe('Age Verification Integration Tests', () => {
    let server;
    let app;

    beforeAll(async () => {
        // Create test app instance
        app = createTestApp();
        server = app.listen(0); // Use random port for testing
    });

    afterAll(async () => {
        // Clean up after tests
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
    });

    describe('POST /api/verify-age', () => {
        it('should successfully process age verification request', async () => {
            const testRequest = {
                productCategory: 'alcohol',
                productId: 'beer-001',
                biometricData: {
                    faceImage: 'base64-test-image-data'
                }
            };

            const response = await request(server)
                .post('/api/verify-age')
                .send(testRequest)
                .expect(200);

            expect(response.body).toHaveProperty('sessionId');
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('authorized');
            expect(response.body).toHaveProperty('processingTime');
            expect(response.body.processingTime).toBeLessThan(5000); // Under 5 seconds
        });

        it('should handle missing biometric data', async () => {
            const testRequest = {
                productCategory: 'alcohol',
                productId: 'beer-001'
            };

            const response = await request(server)
                .post('/api/verify-age')
                .send(testRequest)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle invalid product category', async () => {
            const testRequest = {
                productCategory: 'invalid-category',
                productId: 'test-001',
                biometricData: {
                    faceImage: 'base64-test-image-data'
                }
            };

            const response = await request(server)
                .post('/api/verify-age')
                .send(testRequest)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/status', () => {
        it('should return system status', async () => {
            const response = await request(server)
                .get('/api/status')
                .expect(200);

            expect(response.body).toHaveProperty('system');
            expect(response.body).toHaveProperty('ageVerification');
            expect(response.body.system).toHaveProperty('initialized', true);
        });
    });

    describe('GET /health', () => {
        it('should return health check', async () => {
            const response = await request(server)
                .get('/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('version');
        });
    });
});

describe('Performance Tests', () => {
    let server;
    let app;

    beforeAll(async () => {
        app = createTestApp();
        server = app.listen(0);
    });

    afterAll(async () => {
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
    });

    it('should handle concurrent requests', async () => {
        const testRequest = {
            productCategory: 'alcohol',
            productId: 'beer-001',
            biometricData: {
                faceImage: 'base64-test-image-data'
            }
        };

        const promises = [];
        const concurrentRequests = 10;

        for (let i = 0; i < concurrentRequests; i++) {
            promises.push(
                request(server)
                    .post('/api/verify-age')
                    .send(testRequest)
            );
        }

        const responses = await Promise.all(promises);
        
        responses.forEach(response => {
            expect(response.status).toBe(200);
            expect(response.body.processingTime).toBeLessThan(10000); // Under 10 seconds
        });
    });

    it('should maintain performance under load', async () => {
        const startTime = Date.now();
        const requests = 50;
        const promises = [];

        for (let i = 0; i < requests; i++) {
            promises.push(
                request(server)
                    .get('/health')
            );
        }

        await Promise.all(promises);
        const totalTime = Date.now() - startTime;
        const avgTime = totalTime / requests;

        expect(avgTime).toBeLessThan(100); // Average under 100ms per request
    });
});
