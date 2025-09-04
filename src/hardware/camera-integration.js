const cv = require('opencv4nodejs');
const faceapi = require('face-api.js');
const logger = require('../utils/logger');

/**
 * Advanced Camera Integration for Biometric Verification
 * Supports multiple camera types and advanced facial recognition
 */
class CameraIntegration {
    constructor(config = {}) {
        this.config = {
            deviceIndex: config.deviceIndex || 0,
            width: config.width || 1280,
            height: config.height || 720,
            fps: config.fps || 30,
            format: config.format || 'MJPG',
            
            // Face detection settings
            minFaceSize: config.minFaceSize || 150,
            maxFaceSize: config.maxFaceSize || 800,
            scaleFactor: config.scaleFactor || 1.1,
            minNeighbors: config.minNeighbors || 3,
            
            // Quality settings
            brightness: config.brightness || 0.5,
            contrast: config.contrast || 0.5,
            saturation: config.saturation || 0.5,
            exposure: config.exposure || 0.5,
            
            // Advanced features
            enableHDR: config.enableHDR || false,
            enableStabilization: config.enableStabilization || true,
            enableNightMode: config.enableNightMode || false,
            
            mock: process.env.MOCK_BIOMETRIC === 'true'
        };

        this.camera = null;
        this.isInitialized = false;
        this.isCapturing = false;
        this.faceDetector = null;
        this.lastFrame = null;
        this.statistics = {
            framesProcessed: 0,
            facesDetected: 0,
            avgProcessingTime: 0,
            totalProcessingTime: 0
        };
    }

    /**
     * Initialize camera and face detection models
     */
    async initialize() {
        try {
            logger.info('Initializing advanced camera integration...');

            if (this.config.mock) {
                logger.info('Camera running in mock mode');
                this.isInitialized = true;
                return;
            }

            // Initialize OpenCV camera
            await this.initializeCamera();

            // Initialize face detection models
            await this.initializeFaceDetection();

            // Configure camera settings
            await this.configureCameraSettings();

            this.isInitialized = true;
            logger.info('Camera integration initialized successfully');

        } catch (error) {
            logger.error('Failed to initialize camera integration:', error);
            throw error;
        }
    }

    /**
     * Initialize OpenCV camera
     */
    async initializeCamera() {
        try {
            logger.info(`Initializing camera device ${this.config.deviceIndex}...`);

            this.camera = new cv.VideoCapture(this.config.deviceIndex);

            // Set camera properties
            this.camera.set(cv.CAP_PROP_FRAME_WIDTH, this.config.width);
            this.camera.set(cv.CAP_PROP_FRAME_HEIGHT, this.config.height);
            this.camera.set(cv.CAP_PROP_FPS, this.config.fps);

            // Set format if supported
            const fourcc = cv.VideoWriter.fourcc(this.config.format);
            this.camera.set(cv.CAP_PROP_FOURCC, fourcc);

            // Test camera capture
            const testFrame = this.camera.read();
            if (testFrame.empty) {
                throw new Error('Camera capture test failed');
            }

            logger.info(`Camera initialized: ${this.config.width}x${this.config.height} @ ${this.config.fps}fps`);

        } catch (error) {
            logger.error('Camera initialization failed:', error);
            throw new Error(`Camera initialization failed: ${error.message}`);
        }
    }

    /**
     * Initialize face detection models
     */
    async initializeFaceDetection() {
        try {
            logger.info('Loading face detection models...');

            // Load face-api.js models (in production, these would be loaded from files)
            if (!this.config.mock) {
                await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models');
                await faceapi.nets.faceLandmark68Net.loadFromDisk('./models');
                await faceapi.nets.faceRecognitionNet.loadFromDisk('./models');
                await faceapi.nets.ageGenderNet.loadFromDisk('./models');
            }

            // Initialize OpenCV face detector as backup
            this.faceDetector = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);

            logger.info('Face detection models loaded successfully');

        } catch (error) {
            logger.warn('Face-api.js models not available, using OpenCV only:', error.message);
            // Continue with OpenCV only
        }
    }

    /**
     * Configure advanced camera settings
     */
    async configureCameraSettings() {
        if (this.config.mock || !this.camera) return;

        try {
            logger.info('Configuring advanced camera settings...');

            // Basic settings
            this.camera.set(cv.CAP_PROP_BRIGHTNESS, this.config.brightness);
            this.camera.set(cv.CAP_PROP_CONTRAST, this.config.contrast);
            this.camera.set(cv.CAP_PROP_SATURATION, this.config.saturation);
            this.camera.set(cv.CAP_PROP_EXPOSURE, this.config.exposure);

            // Advanced settings (if supported)
            if (this.config.enableHDR) {
                this.camera.set(cv.CAP_PROP_WB_TEMPERATURE, -1); // Auto white balance
            }

            if (this.config.enableStabilization) {
                // Image stabilization (camera dependent)
                this.camera.set(cv.CAP_PROP_BUFFERSIZE, 1);
            }

            logger.info('Camera settings configured successfully');

        } catch (error) {
            logger.warn('Some camera settings may not be supported:', error.message);
        }
    }

    /**
     * Capture single frame from camera
     */
    async captureFrame() {
        const startTime = Date.now();

        try {
            if (this.config.mock) {
                return this.generateMockFrame();
            }

            if (!this.camera) {
                throw new Error('Camera not initialized');
            }

            const frame = this.camera.read();
            if (frame.empty) {
                throw new Error('Failed to capture frame');
            }

            this.lastFrame = frame;
            this.updateStatistics(Date.now() - startTime);

            return {
                image: frame,
                timestamp: new Date().toISOString(),
                width: frame.cols,
                height: frame.rows,
                channels: frame.channels
            };

        } catch (error) {
            logger.error('Frame capture failed:', error);
            throw error;
        }
    }

    /**
     * Detect faces in frame using multiple algorithms
     */
    async detectFaces(frame) {
        const startTime = Date.now();

        try {
            const faces = [];

            if (this.config.mock) {
                return this.generateMockFaces();
            }

            // Primary detection with OpenCV
            const grayFrame = frame.bgrToGray();
            const cvFaces = this.faceDetector.detectMultiScale(grayFrame, {
                scaleFactor: this.config.scaleFactor,
                minNeighbors: this.config.minNeighbors,
                minSize: new cv.Size(this.config.minFaceSize, this.config.minFaceSize),
                maxSize: new cv.Size(this.config.maxFaceSize, this.config.maxFaceSize)
            });

            // Convert OpenCV rectangles to face objects
            for (const rect of cvFaces.objects) {
                faces.push({
                    bbox: {
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height
                    },
                    confidence: 0.9, // OpenCV doesn't provide confidence
                    landmarks: null,
                    descriptor: null,
                    age: null,
                    gender: null,
                    expression: null
                });
            }

            // Enhanced detection with face-api.js (if available)
            try {
                const canvas = this.matToCanvas(frame);
                const faceApiResults = await faceapi
                    .detectAllFaces(canvas)
                    .withFaceLandmarks()
                    .withFaceDescriptors()
                    .withAgeAndGender()
                    .withFaceExpressions();

                // Merge results (prefer face-api.js for additional data)
                for (let i = 0; i < faceApiResults.length && i < faces.length; i++) {
                    const apiResult = faceApiResults[i];
                    faces[i] = {
                        ...faces[i],
                        confidence: apiResult.detection.score,
                        landmarks: apiResult.landmarks,
                        descriptor: apiResult.descriptor,
                        age: apiResult.age,
                        gender: apiResult.gender,
                        expression: apiResult.expressions
                    };
                }

            } catch (error) {
                logger.debug('Face-api.js detection skipped:', error.message);
            }

            const processingTime = Date.now() - startTime;
            this.statistics.facesDetected += faces.length;
            this.updateStatistics(processingTime);

            logger.debug(`Detected ${faces.length} faces in ${processingTime}ms`);

            return faces;

        } catch (error) {
            logger.error('Face detection failed:', error);
            throw error;
        }
    }

    /**
     * Perform advanced face analysis
     */
    async analyzeFace(frame, faceRegion) {
        try {
            if (this.config.mock) {
                return this.generateMockAnalysis();
            }

            const analysis = {
                quality: await this.assessImageQuality(frame, faceRegion),
                liveness: await this.detectLiveness(frame, faceRegion),
                pose: await this.estimateHeadPose(frame, faceRegion),
                lighting: await this.analyzeLighting(frame, faceRegion),
                blur: await this.detectBlur(frame, faceRegion)
            };

            return analysis;

        } catch (error) {
            logger.error('Face analysis failed:', error);
            throw error;
        }
    }

    /**
     * Assess image quality for face recognition
     */
    async assessImageQuality(frame, faceRegion) {
        try {
            const faceROI = frame.getRegion(new cv.Rect(
                faceRegion.x, faceRegion.y, 
                faceRegion.width, faceRegion.height
            ));

            // Calculate sharpness using Laplacian variance
            const gray = faceROI.bgrToGray();
            const laplacian = gray.laplacian(cv.CV_64F);
            const mean = laplacian.mean();
            const stddev = laplacian.stdDev();
            const sharpness = stddev[0] * stddev[0]; // Variance

            // Calculate brightness
            const brightness = gray.mean()[0] / 255;

            // Calculate contrast
            const contrast = stddev[0] / 255;

            return {
                sharpness,
                brightness,
                contrast,
                overall: this.calculateOverallQuality(sharpness, brightness, contrast)
            };

        } catch (error) {
            logger.error('Image quality assessment failed:', error);
            return { sharpness: 0, brightness: 0, contrast: 0, overall: 0 };
        }
    }

    /**
     * Detect liveness to prevent spoofing
     */
    async detectLiveness(frame, faceRegion) {
        try {
            // Simple liveness detection using texture analysis
            const faceROI = frame.getRegion(new cv.Rect(
                faceRegion.x, faceRegion.y, 
                faceRegion.width, faceRegion.height
            ));

            const gray = faceROI.bgrToGray();
            
            // Local Binary Pattern for texture analysis
            const lbp = this.calculateLBP(gray);
            const textureScore = this.analyzeTexture(lbp);

            // Color analysis (real faces have more color variation)
            const colorScore = this.analyzeColorVariation(faceROI);

            // Motion analysis (would require multiple frames)
            const motionScore = 0.7; // Placeholder

            const livenessScore = (textureScore * 0.4 + colorScore * 0.4 + motionScore * 0.2);

            return {
                score: livenessScore,
                isLive: livenessScore > 0.6,
                textureScore,
                colorScore,
                motionScore
            };

        } catch (error) {
            logger.error('Liveness detection failed:', error);
            return { score: 0.5, isLive: false };
        }
    }

    /**
     * Estimate head pose for face orientation
     */
    async estimateHeadPose(frame, faceRegion) {
        try {
            // Simplified head pose estimation
            const centerX = faceRegion.x + faceRegion.width / 2;
            const centerY = faceRegion.y + faceRegion.height / 2;
            const frameCenterX = frame.cols / 2;
            const frameCenterY = frame.rows / 2;

            // Calculate rough angles based on position
            const yaw = (centerX - frameCenterX) / frameCenterX * 45; // -45 to +45 degrees
            const pitch = (centerY - frameCenterY) / frameCenterY * 30; // -30 to +30 degrees
            const roll = 0; // Would need landmark detection for accurate roll

            return {
                yaw,
                pitch,
                roll,
                isFrontal: Math.abs(yaw) < 15 && Math.abs(pitch) < 15
            };

        } catch (error) {
            logger.error('Head pose estimation failed:', error);
            return { yaw: 0, pitch: 0, roll: 0, isFrontal: true };
        }
    }

    /**
     * Analyze lighting conditions
     */
    async analyzeLighting(frame, faceRegion) {
        try {
            const faceROI = frame.getRegion(new cv.Rect(
                faceRegion.x, faceRegion.y, 
                faceRegion.width, faceRegion.height
            ));

            const gray = faceROI.bgrToGray();
            const histogram = cv.calcHist([gray], [0], new cv.Mat(), [256], [0, 256]);
            
            // Analyze histogram for lighting conditions
            const mean = gray.mean()[0];
            const stddev = gray.stdDev()[0];
            
            let condition = 'good';
            if (mean < 50) condition = 'too_dark';
            else if (mean > 200) condition = 'too_bright';
            else if (stddev < 30) condition = 'low_contrast';

            return {
                mean,
                stddev,
                condition,
                isGood: condition === 'good'
            };

        } catch (error) {
            logger.error('Lighting analysis failed:', error);
            return { mean: 128, stddev: 50, condition: 'unknown', isGood: false };
        }
    }

    /**
     * Detect motion blur
     */
    async detectBlur(frame, faceRegion) {
        try {
            const faceROI = frame.getRegion(new cv.Rect(
                faceRegion.x, faceRegion.y, 
                faceRegion.width, faceRegion.height
            ));

            const gray = faceROI.bgrToGray();
            const laplacian = gray.laplacian(cv.CV_64F);
            const variance = laplacian.stdDev()[0] ** 2;

            const isBlurred = variance < 100; // Threshold for blur detection

            return {
                variance,
                isBlurred,
                quality: isBlurred ? 'blurred' : 'sharp'
            };

        } catch (error) {
            logger.error('Blur detection failed:', error);
            return { variance: 0, isBlurred: true, quality: 'unknown' };
        }
    }

    /**
     * Start continuous face monitoring
     */
    async startMonitoring(callback) {
        if (this.isCapturing) {
            logger.warn('Monitoring already started');
            return;
        }

        this.isCapturing = true;
        logger.info('Starting continuous face monitoring...');

        const monitorLoop = async () => {
            try {
                if (!this.isCapturing) return;

                const frameData = await this.captureFrame();
                const faces = await this.detectFaces(frameData.image);

                // Analyze each face
                const analyzedFaces = [];
                for (const face of faces) {
                    const analysis = await this.analyzeFace(frameData.image, face.bbox);
                    analyzedFaces.push({
                        ...face,
                        analysis
                    });
                }

                // Call callback with results
                if (callback) {
                    callback({
                        frame: frameData,
                        faces: analyzedFaces,
                        timestamp: new Date().toISOString()
                    });
                }

                // Schedule next frame
                setTimeout(monitorLoop, 1000 / this.config.fps);

            } catch (error) {
                logger.error('Monitoring loop error:', error);
                if (this.isCapturing) {
                    setTimeout(monitorLoop, 1000); // Retry after 1 second
                }
            }
        };

        monitorLoop();
    }

    /**
     * Stop continuous monitoring
     */
    stopMonitoring() {
        this.isCapturing = false;
        logger.info('Face monitoring stopped');
    }

    /**
     * Helper methods for mock mode and utilities
     */
    generateMockFrame() {
        // Generate mock frame data
        return {
            image: null, // Would be a mock Mat object
            timestamp: new Date().toISOString(),
            width: this.config.width,
            height: this.config.height,
            channels: 3
        };
    }

    generateMockFaces() {
        return [{
            bbox: { x: 300, y: 200, width: 200, height: 200 },
            confidence: 0.95,
            landmarks: null,
            descriptor: new Float32Array(128).fill(0.5),
            age: 25,
            gender: 'male',
            expression: { happy: 0.8, neutral: 0.2 }
        }];
    }

    generateMockAnalysis() {
        return {
            quality: { sharpness: 150, brightness: 0.6, contrast: 0.7, overall: 0.8 },
            liveness: { score: 0.85, isLive: true },
            pose: { yaw: 5, pitch: -2, roll: 1, isFrontal: true },
            lighting: { mean: 120, stddev: 45, condition: 'good', isGood: true },
            blur: { variance: 200, isBlurred: false, quality: 'sharp' }
        };
    }

    calculateOverallQuality(sharpness, brightness, contrast) {
        // Weighted quality score
        const sharpnessScore = Math.min(sharpness / 200, 1);
        const brightnessScore = 1 - Math.abs(brightness - 0.5) * 2;
        const contrastScore = Math.min(contrast * 2, 1);
        
        return (sharpnessScore * 0.5 + brightnessScore * 0.3 + contrastScore * 0.2);
    }

    calculateLBP(grayImage) {
        // Simplified Local Binary Pattern calculation
        // In production, this would be a proper LBP implementation
        return grayImage; // Placeholder
    }

    analyzeTexture(lbpImage) {
        // Analyze texture patterns for liveness
        // Real implementation would calculate LBP histogram and analyze patterns
        return 0.7; // Placeholder
    }

    analyzeColorVariation(colorImage) {
        // Analyze color variation in face region
        const channels = colorImage.split();
        let variation = 0;
        
        for (const channel of channels) {
            variation += channel.stdDev()[0];
        }
        
        return Math.min(variation / 150, 1); // Normalize
    }

    matToCanvas(mat) {
        // Convert OpenCV Mat to Canvas for face-api.js
        // This would require proper implementation with canvas creation
        return null; // Placeholder
    }

    updateStatistics(processingTime) {
        this.statistics.framesProcessed++;
        this.statistics.totalProcessingTime += processingTime;
        this.statistics.avgProcessingTime = this.statistics.totalProcessingTime / this.statistics.framesProcessed;
    }

    /**
     * Get camera status and statistics
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            capturing: this.isCapturing,
            config: this.config,
            statistics: this.statistics,
            lastFrame: this.lastFrame ? {
                timestamp: new Date().toISOString(),
                width: this.lastFrame.cols,
                height: this.lastFrame.rows
            } : null
        };
    }

    /**
     * Cleanup camera resources
     */
    async cleanup() {
        try {
            logger.info('Cleaning up camera integration...');
            
            this.stopMonitoring();
            
            if (this.camera && !this.config.mock) {
                this.camera.release();
            }
            
            this.isInitialized = false;
            logger.info('Camera integration cleanup completed');
            
        } catch (error) {
            logger.error('Error during camera cleanup:', error);
        }
    }
}

module.exports = CameraIntegration;
