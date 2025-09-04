const BiometricVerifier = require('../../src/biometric/biometric-verifier');

describe('BiometricVerifier Unit Tests', () => {
    let verifier;

    beforeEach(() => {
        process.env.MOCK_BIOMETRIC = 'true';
        verifier = new BiometricVerifier({
            confidenceThreshold: 0.8
        });
    });

    afterEach(() => {
        if (verifier) {
            verifier.cleanup();
        }
    });

    describe('Initialization', () => {
        it('should initialize successfully', async () => {
            await verifier.initialize();
            
            const status = verifier.getStatus();
            expect(status.initialized).toBe(true);
            expect(status.models.faceDetection.loaded).toBe(true);
            expect(status.models.faceRecognition.loaded).toBe(true);
            expect(status.models.faceLandmark.loaded).toBe(true);
        });

        it('should load face-api models', async () => {
            await verifier.initialize();
            
            const status = verifier.getStatus();
            expect(status.faceApi).toBe('loaded');
        });
    });

    describe('Face Detection', () => {
        beforeEach(async () => {
            await verifier.initialize();
        });

        it('should detect faces in mock mode', async () => {
            const mockImageData = 'base64-mock-image-data';
            
            const faces = await verifier.detectFaces(mockImageData);
            expect(Array.isArray(faces)).toBe(true);
            expect(faces.length).toBeGreaterThan(0);
        });

        it('should handle no faces detected', async () => {
            const emptyImageData = '';
            
            const faces = await verifier.detectFaces(emptyImageData);
            expect(Array.isArray(faces)).toBe(true);
        });
    });

    describe('Face Verification', () => {
        beforeEach(async () => {
            await verifier.initialize();
        });

        it('should perform face verification', async () => {
            const cardPhoto = 'base64-card-photo';
            const liveImage = 'base64-live-image';
            
            const result = await verifier.verifyFace(cardPhoto, liveImage);
            
            expect(result).toHaveProperty('verified');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('livenessScore');
            expect(typeof result.verified).toBe('boolean');
            expect(typeof result.confidence).toBe('number');
            expect(typeof result.livenessScore).toBe('number');
        });

        it('should calculate similarity score', async () => {
            const cardPhoto = 'base64-card-photo';
            const liveImage = 'base64-live-image';
            
            const result = await verifier.verifyFace(cardPhoto, liveImage);
            
            expect(typeof result.confidence).toBe('number');
            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
        });

        it('should perform liveness detection', async () => {
            const liveImage = 'base64-live-image';
            
            const result = await verifier.verifyFace('base64-card-photo', liveImage);
            
            expect(typeof result.livenessScore).toBe('number');
            expect(result.livenessScore).toBeGreaterThanOrEqual(0);
            expect(result.livenessScore).toBeLessThanOrEqual(1);
        });
    });

    describe('Configuration', () => {
        it('should use correct confidence threshold', async () => {
            await verifier.initialize();
            
            const status = verifier.getStatus();
            expect(status.confidenceThreshold).toBe(0.8);
        });

        it('should allow threshold configuration', async () => {
            const customThreshold = 0.9;
            verifier.confidenceThreshold = customThreshold;
            
            await verifier.initialize();
            
            const status = verifier.getStatus();
            expect(status.confidenceThreshold).toBe(customThreshold);
        });
    });

    describe('Performance', () => {
        beforeEach(async () => {
            await verifier.initialize();
        });

        it('should process verification quickly', async () => {
            const startTime = Date.now();
            
            const cardPhoto = 'base64-card-photo';
            const liveImage = 'base64-live-image';
            
            await verifier.verifyFace(cardPhoto, liveImage);
            
            const processingTime = Date.now() - startTime;
            expect(processingTime).toBeLessThan(5000); // Under 5 seconds
        });

        it('should handle multiple concurrent verifications', async () => {
            const promises = [];
            const concurrentVerifications = 5;
            
            for (let i = 0; i < concurrentVerifications; i++) {
                promises.push(
                    verifier.verifyFace('card-photo-' + i, 'live-image-' + i)
                );
            }
            
            const results = await Promise.all(promises);
            
            expect(results.length).toBe(concurrentVerifications);
            results.forEach(result => {
                expect(result).toHaveProperty('verified');
                expect(result).toHaveProperty('confidence');
                expect(result).toHaveProperty('livenessScore');
            });
        });
    });

    describe('Error Handling', () => {
        beforeEach(async () => {
            await verifier.initialize();
        });

        it('should handle invalid image data', async () => {
            try {
                await verifier.detectFaces(null);
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        it('should handle corrupted image data', async () => {
            const corruptedImage = 'invalid-base64-data';
            
            try {
                await verifier.detectFaces(corruptedImage);
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });
});
