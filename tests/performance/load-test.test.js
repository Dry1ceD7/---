const request = require('supertest');
const express = require('express');

// Create a test app instance for performance testing
const createTestApp = () => {
    const app = express();
    app.use(express.json());
    
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            uptime: process.uptime(),
            version: '1.0.0'
        });
    });
    
    app.get('/api/status', (req, res) => {
        res.json({
            system: { initialized: true },
            ageVerification: { initialized: true }
        });
    });
    
    app.post('/api/verify-age', (req, res) => {
        res.json({
            sessionId: 'test-session-id',
            success: true,
            authorized: false,
            processingTime: Math.random() * 100 // Simulate variable processing time
        });
    });
    
    return app;
};

describe('Load Testing', () => {
    let server;
    let app;

    beforeAll(async () => {
        app = createTestApp();
        server = app.listen(0);
        // Wait for server to fully initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    afterAll(async () => {
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
    });

    describe('API Endpoint Performance', () => {
        it('should handle high concurrent load on health endpoint', async () => {
            const concurrentRequests = 100;
            const promises = [];
            const startTime = Date.now();

            for (let i = 0; i < concurrentRequests; i++) {
                promises.push(
                    request(server)
                        .get('/health')
                        .expect(200)
                );
            }

            const results = await Promise.all(promises);
            const totalTime = Date.now() - startTime;
            const avgTime = totalTime / concurrentRequests;

            console.log(`Concurrent requests: ${concurrentRequests}`);
            console.log(`Total time: ${totalTime}ms`);
            console.log(`Average time per request: ${avgTime.toFixed(2)}ms`);

            expect(results.length).toBe(concurrentRequests);
            expect(avgTime).toBeLessThan(50); // Average under 50ms per request
        });

        it('should handle sustained load on status endpoint', async () => {
            const requestsPerBatch = 20;
            const batches = 5;
            const delayBetweenBatches = 100; // ms

            for (let batch = 0; batch < batches; batch++) {
                const promises = [];
                const batchStartTime = Date.now();

                for (let i = 0; i < requestsPerBatch; i++) {
                    promises.push(
                        request(server)
                            .get('/api/status')
                            .expect(200)
                    );
                }

                const results = await Promise.all(promises);
                const batchTime = Date.now() - batchStartTime;
                const avgBatchTime = batchTime / requestsPerBatch;

                console.log(`Batch ${batch + 1}: ${requestsPerBatch} requests in ${batchTime}ms (avg: ${avgBatchTime.toFixed(2)}ms)`);

                expect(results.length).toBe(requestsPerBatch);
                expect(avgBatchTime).toBeLessThan(100); // Average under 100ms per request

                // Delay between batches
                if (batch < batches - 1) {
                    await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
                }
            }
        });

        it('should handle age verification under load', async () => {
            const concurrentVerifications = 10;
            const promises = [];
            const testRequest = {
                productCategory: 'alcohol',
                productId: 'beer-001',
                biometricData: {
                    faceImage: 'base64-test-image-data'
                }
            };

            const startTime = Date.now();

            for (let i = 0; i < concurrentVerifications; i++) {
                promises.push(
                    request(server)
                        .post('/api/verify-age')
                        .send(testRequest)
                        .expect(200)
                );
            }

            const results = await Promise.all(promises);
            const totalTime = Date.now() - startTime;
            const avgTime = totalTime / concurrentVerifications;

            console.log(`Age verification load test:`);
            console.log(`Concurrent verifications: ${concurrentVerifications}`);
            console.log(`Total time: ${totalTime}ms`);
            console.log(`Average time per verification: ${avgTime.toFixed(2)}ms`);

            expect(results.length).toBe(concurrentVerifications);
            results.forEach(result => {
                expect(result.body).toHaveProperty('sessionId');
                expect(result.body).toHaveProperty('success');
                expect(result.body.processingTime).toBeLessThan(10000); // Under 10 seconds
            });

            expect(avgTime).toBeLessThan(5000); // Average under 5 seconds
        });
    });

    describe('Memory and Resource Usage', () => {
        it('should maintain stable memory usage under load', async () => {
            const initialMemory = process.memoryUsage();
            const requests = 50;
            const promises = [];

            for (let i = 0; i < requests; i++) {
                promises.push(
                    request(server)
                        .get('/health')
                );
            }

            await Promise.all(promises);

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }

            const finalMemory = process.memoryUsage();
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
            const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

            console.log(`Memory usage:`);
            console.log(`Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
            console.log(`Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
            console.log(`Increase: ${memoryIncreaseMB.toFixed(2)}MB`);

            // Memory increase should be reasonable (under 50MB for 50 requests)
            expect(memoryIncreaseMB).toBeLessThan(50);
        });

        it('should handle rapid successive requests', async () => {
            const rapidRequests = 30;
            const delay = 10; // 10ms between requests

            for (let i = 0; i < rapidRequests; i++) {
                const response = await request(server)
                    .get('/health')
                    .expect(200);

                expect(response.body.status).toBe('healthy');

                // Small delay between requests
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        });
    });

    describe('Stress Testing', () => {
        it('should survive extended load test', async () => {
            const duration = 10000; // 10 seconds
            const requestInterval = 100; // Request every 100ms
            const startTime = Date.now();
            let requestCount = 0;
            let errorCount = 0;

            const makeRequest = async () => {
                try {
                    await request(server)
                        .get('/health')
                        .expect(200);
                    requestCount++;
                } catch (error) {
                    errorCount++;
                }
            };

            const promises = [];
            while (Date.now() - startTime < duration) {
                promises.push(makeRequest());
                await new Promise(resolve => setTimeout(resolve, requestInterval));
            }

            await Promise.all(promises);

            console.log(`Stress test results:`);
            console.log(`Duration: ${duration}ms`);
            console.log(`Total requests: ${requestCount}`);
            console.log(`Errors: ${errorCount}`);
            console.log(`Success rate: ${((requestCount / (requestCount + errorCount)) * 100).toFixed(2)}%`);

            expect(requestCount).toBeGreaterThan(50); // Should handle at least 50 requests
            expect(errorCount).toBeLessThan(requestCount * 0.05); // Less than 5% error rate
        });
    });
});
