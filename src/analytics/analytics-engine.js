const logger = require('../utils/logger');
const tf = require('@tensorflow/tfjs-node');

/**
 * Advanced Analytics Engine with Machine Learning
 * Provides intelligent insights, predictive analytics, and business intelligence
 */
class AnalyticsEngine {
    constructor(config = {}) {
        this.config = {
            enablePredictiveAnalytics: config.enablePredictiveAnalytics ?? true,
            enableAnomalyDetection: config.enableAnomalyDetection ?? true,
            enableBusinessIntelligence: config.enableBusinessIntelligence ?? true,
            dataRetentionDays: config.dataRetentionDays || 365,
            batchSize: config.batchSize || 1000,
            modelUpdateInterval: config.modelUpdateInterval || 24 * 60 * 60 * 1000, // 24 hours
            confidenceThreshold: config.confidenceThreshold || 0.8
        };

        this.models = {
            ageVerificationSuccess: null,
            fraudDetection: null,
            demandForecasting: null,
            anomalyDetection: null
        };

        this.dataStore = new Map();
        this.insights = new Map();
        this.isInitialized = false;
        this.lastModelUpdate = null;
    }

    /**
     * Initialize analytics engine and load ML models
     */
    async initialize() {
        try {
            logger.info('Initializing Advanced Analytics Engine...');

            // Initialize data structures
            this.initializeDataStructures();

            // Load or create ML models
            await this.loadModels();

            // Start background processes
            this.startBackgroundProcesses();

            this.isInitialized = true;
            logger.info('Analytics Engine initialized successfully');

        } catch (error) {
            logger.error('Failed to initialize Analytics Engine:', error);
            throw error;
        }
    }

    /**
     * Initialize data structures for analytics
     */
    initializeDataStructures() {
        // Transaction data
        this.dataStore.set('transactions', []);
        this.dataStore.set('ageVerifications', []);
        this.dataStore.set('systemMetrics', []);
        this.dataStore.set('userBehavior', []);
        this.dataStore.set('errorLogs', []);
        
        // Real-time metrics
        this.dataStore.set('realTimeMetrics', {
            currentHour: {
                transactions: 0,
                successfulVerifications: 0,
                failedVerifications: 0,
                averageProcessingTime: 0,
                uniqueUsers: new Set()
            },
            currentDay: {
                transactions: 0,
                revenue: 0,
                peakHour: null,
                popularProducts: new Map()
            }
        });

        // Insights storage
        this.insights.set('dailyInsights', []);
        this.insights.set('weeklyInsights', []);
        this.insights.set('monthlyInsights', []);
        this.insights.set('predictions', []);
        this.insights.set('anomalies', []);
    }

    /**
     * Load or create machine learning models
     */
    async loadModels() {
        try {
            logger.info('Loading machine learning models...');

            // Age verification success prediction model
            this.models.ageVerificationSuccess = await this.createAgeVerificationModel();

            // Fraud detection model
            this.models.fraudDetection = await this.createFraudDetectionModel();

            // Demand forecasting model
            this.models.demandForecasting = await this.createDemandForecastingModel();

            // Anomaly detection model
            this.models.anomalyDetection = await this.createAnomalyDetectionModel();

            this.lastModelUpdate = new Date();
            logger.info('Machine learning models loaded successfully');

        } catch (error) {
            logger.error('Failed to load ML models:', error);
            // Continue without ML models in case of failure
        }
    }

    /**
     * Create age verification success prediction model
     */
    async createAgeVerificationModel() {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 32, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 1, activation: 'sigmoid' })
            ]
        });

        model.compile({
            optimizer: 'adam',
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

        // In production, load pre-trained weights
        // await model.loadWeights('models/age_verification_model.json');

        return model;
    }

    /**
     * Create fraud detection model
     */
    async createFraudDetectionModel() {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [15], units: 128, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({ units: 64, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({ units: 32, activation: 'relu' }),
                tf.layers.dense({ units: 1, activation: 'sigmoid' })
            ]
        });

        model.compile({
            optimizer: 'adam',
            loss: 'binaryCrossentropy',
            metrics: ['accuracy', 'precision', 'recall']
        });

        return model;
    }

    /**
     * Create demand forecasting model (LSTM for time series)
     */
    async createDemandForecastingModel() {
        const model = tf.sequential({
            layers: [
                tf.layers.lstm({ 
                    units: 100, 
                    returnSequences: true, 
                    inputShape: [24, 5] // 24 hours, 5 features
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.lstm({ units: 50, returnSequences: false }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 25 }),
                tf.layers.dense({ units: 1 })
            ]
        });

        model.compile({
            optimizer: 'adam',
            loss: 'meanSquaredError',
            metrics: ['meanAbsoluteError']
        });

        return model;
    }

    /**
     * Create anomaly detection model (Autoencoder)
     */
    async createAnomalyDetectionModel() {
        const inputDim = 20;
        const encodingDim = 8;

        // Encoder
        const encoder = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [inputDim], units: 16, activation: 'relu' }),
                tf.layers.dense({ units: encodingDim, activation: 'relu' })
            ]
        });

        // Decoder
        const decoder = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [encodingDim], units: 16, activation: 'relu' }),
                tf.layers.dense({ units: inputDim, activation: 'sigmoid' })
            ]
        });

        // Autoencoder
        const autoencoder = tf.sequential({
            layers: [encoder, decoder]
        });

        autoencoder.compile({
            optimizer: 'adam',
            loss: 'meanSquaredError'
        });

        return autoencoder;
    }

    /**
     * Record transaction data for analytics
     */
    recordTransaction(transactionData) {
        try {
            const transaction = {
                id: transactionData.id,
                timestamp: new Date().toISOString(),
                locationId: transactionData.locationId,
                productType: transactionData.productType,
                ageRequired: transactionData.ageRequired,
                customerAge: transactionData.customerAge,
                verificationMethod: transactionData.verificationMethod,
                processingTime: transactionData.processingTime,
                success: transactionData.success,
                amount: transactionData.amount,
                biometricConfidence: transactionData.biometricConfidence,
                cardReadTime: transactionData.cardReadTime,
                fraudRisk: transactionData.fraudRisk || 0
            };

            // Store transaction
            this.dataStore.get('transactions').push(transaction);

            // Update real-time metrics
            this.updateRealTimeMetrics(transaction);

            // Trigger real-time analysis
            this.performRealTimeAnalysis(transaction);

            logger.debug('Transaction recorded for analytics', { transactionId: transaction.id });

        } catch (error) {
            logger.error('Failed to record transaction:', error);
        }
    }

    /**
     * Update real-time metrics
     */
    updateRealTimeMetrics(transaction) {
        const metrics = this.dataStore.get('realTimeMetrics');
        
        // Update hourly metrics
        metrics.currentHour.transactions++;
        if (transaction.success) {
            metrics.currentHour.successfulVerifications++;
        } else {
            metrics.currentHour.failedVerifications++;
        }

        // Update processing time average
        const currentAvg = metrics.currentHour.averageProcessingTime;
        const count = metrics.currentHour.transactions;
        metrics.currentHour.averageProcessingTime = 
            (currentAvg * (count - 1) + transaction.processingTime) / count;

        // Update daily metrics
        metrics.currentDay.transactions++;
        if (transaction.amount) {
            metrics.currentDay.revenue += transaction.amount;
        }

        // Track popular products
        const productCount = metrics.currentDay.popularProducts.get(transaction.productType) || 0;
        metrics.currentDay.popularProducts.set(transaction.productType, productCount + 1);
    }

    /**
     * Perform real-time analysis on transaction
     */
    async performRealTimeAnalysis(transaction) {
        try {
            // Fraud detection
            if (this.config.enableAnomalyDetection) {
                const fraudScore = await this.detectFraud(transaction);
                if (fraudScore > 0.8) {
                    this.createAlert('high_fraud_risk', {
                        transactionId: transaction.id,
                        fraudScore,
                        locationId: transaction.locationId
                    });
                }
            }

            // Age verification success prediction
            if (this.models.ageVerificationSuccess) {
                const successProbability = await this.predictVerificationSuccess(transaction);
                if (successProbability < 0.3 && !transaction.success) {
                    this.createInsight('verification_improvement_needed', {
                        locationId: transaction.locationId,
                        successProbability,
                        factors: this.analyzeFailureFactors(transaction)
                    });
                }
            }

            // Anomaly detection
            if (this.config.enableAnomalyDetection) {
                const isAnomaly = await this.detectAnomaly(transaction);
                if (isAnomaly) {
                    this.createAlert('transaction_anomaly', {
                        transactionId: transaction.id,
                        locationId: transaction.locationId,
                        anomalyScore: isAnomaly.score
                    });
                }
            }

        } catch (error) {
            logger.error('Real-time analysis failed:', error);
        }
    }

    /**
     * Detect fraud using machine learning
     */
    async detectFraud(transaction) {
        try {
            if (!this.models.fraudDetection) return 0;

            // Prepare features for fraud detection
            const features = this.prepareFraudFeatures(transaction);
            const prediction = this.models.fraudDetection.predict(tf.tensor2d([features]));
            const fraudScore = await prediction.data();

            return fraudScore[0];

        } catch (error) {
            logger.error('Fraud detection failed:', error);
            return 0;
        }
    }

    /**
     * Predict age verification success
     */
    async predictVerificationSuccess(transaction) {
        try {
            if (!this.models.ageVerificationSuccess) return 0.5;

            const features = this.prepareVerificationFeatures(transaction);
            const prediction = this.models.ageVerificationSuccess.predict(tf.tensor2d([features]));
            const successProbability = await prediction.data();

            return successProbability[0];

        } catch (error) {
            logger.error('Verification success prediction failed:', error);
            return 0.5;
        }
    }

    /**
     * Detect anomalies in transaction patterns
     */
    async detectAnomaly(transaction) {
        try {
            if (!this.models.anomalyDetection) return null;

            const features = this.prepareAnomalyFeatures(transaction);
            const reconstruction = this.models.anomalyDetection.predict(tf.tensor2d([features]));
            const reconstructionError = tf.losses.meanSquaredError(
                tf.tensor2d([features]), 
                reconstruction
            );
            const errorValue = await reconstructionError.data();

            const threshold = 0.1; // Anomaly threshold
            const isAnomaly = errorValue[0] > threshold;

            return isAnomaly ? { score: errorValue[0], threshold } : null;

        } catch (error) {
            logger.error('Anomaly detection failed:', error);
            return null;
        }
    }

    /**
     * Generate comprehensive business insights
     */
    async generateInsights(timeframe = 'daily') {
        try {
            logger.info(`Generating ${timeframe} business insights...`);

            const insights = {
                timeframe,
                timestamp: new Date().toISOString(),
                metrics: await this.calculateMetrics(timeframe),
                trends: await this.analyzeTrends(timeframe),
                predictions: await this.generatePredictions(timeframe),
                recommendations: await this.generateRecommendations(timeframe),
                anomalies: await this.findAnomalies(timeframe),
                performance: await this.analyzePerformance(timeframe)
            };

            // Store insights
            this.insights.get(`${timeframe}Insights`).push(insights);

            // Limit stored insights
            const maxInsights = timeframe === 'daily' ? 30 : timeframe === 'weekly' ? 12 : 6;
            const storedInsights = this.insights.get(`${timeframe}Insights`);
            if (storedInsights.length > maxInsights) {
                storedInsights.splice(0, storedInsights.length - maxInsights);
            }

            logger.info(`${timeframe} insights generated successfully`);
            return insights;

        } catch (error) {
            logger.error('Failed to generate insights:', error);
            throw error;
        }
    }

    /**
     * Calculate key metrics
     */
    async calculateMetrics(timeframe) {
        const transactions = this.getTransactionsForTimeframe(timeframe);
        
        return {
            totalTransactions: transactions.length,
            successfulVerifications: transactions.filter(t => t.success).length,
            averageProcessingTime: this.calculateAverage(transactions, 'processingTime'),
            averageAge: this.calculateAverage(transactions.filter(t => t.customerAge), 'customerAge'),
            revenueTotal: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
            topProducts: this.getTopProducts(transactions),
            peakHours: this.calculatePeakHours(transactions),
            locationPerformance: this.calculateLocationPerformance(transactions)
        };
    }

    /**
     * Analyze trends
     */
    async analyzeTrends(timeframe) {
        const transactions = this.getTransactionsForTimeframe(timeframe);
        const previousTransactions = this.getTransactionsForTimeframe(timeframe, true);

        return {
            transactionGrowth: this.calculateGrowthRate(transactions.length, previousTransactions.length),
            successRateChange: this.calculateSuccessRateChange(transactions, previousTransactions),
            averageAgeChange: this.calculateAverageChange(transactions, previousTransactions, 'customerAge'),
            revenueGrowth: this.calculateRevenueGrowth(transactions, previousTransactions),
            popularityShifts: this.analyzePopularityShifts(transactions, previousTransactions)
        };
    }

    /**
     * Generate predictions using ML models
     */
    async generatePredictions(timeframe) {
        const predictions = {};

        try {
            if (this.models.demandForecasting) {
                predictions.demandForecast = await this.forecastDemand(timeframe);
            }

            predictions.expectedTransactions = await this.predictTransactionVolume(timeframe);
            predictions.optimalStaffing = await this.predictStaffingNeeds(timeframe);
            predictions.maintenanceNeeds = await this.predictMaintenanceNeeds(timeframe);

        } catch (error) {
            logger.error('Prediction generation failed:', error);
        }

        return predictions;
    }

    /**
     * Generate actionable recommendations
     */
    async generateRecommendations(timeframe) {
        const metrics = await this.calculateMetrics(timeframe);
        const recommendations = [];

        // Performance recommendations
        if (metrics.averageProcessingTime > 30) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                title: 'Optimize Processing Time',
                description: 'Average processing time exceeds 30 seconds',
                action: 'Review hardware performance and optimize algorithms',
                expectedImpact: 'Reduce processing time by 20-30%'
            });
        }

        // Success rate recommendations
        const successRate = metrics.successfulVerifications / metrics.totalTransactions;
        if (successRate < 0.9) {
            recommendations.push({
                type: 'quality',
                priority: 'high',
                title: 'Improve Verification Success Rate',
                description: `Success rate is ${(successRate * 100).toFixed(1)}%`,
                action: 'Enhance biometric algorithms and user guidance',
                expectedImpact: 'Increase success rate to >95%'
            });
        }

        // Revenue optimization
        const lowPerformingLocations = Object.entries(metrics.locationPerformance)
            .filter(([_, perf]) => perf.revenue < metrics.revenueTotal / Object.keys(metrics.locationPerformance).length * 0.8)
            .map(([location, _]) => location);

        if (lowPerformingLocations.length > 0) {
            recommendations.push({
                type: 'business',
                priority: 'medium',
                title: 'Optimize Low-Performing Locations',
                description: `${lowPerformingLocations.length} locations underperforming`,
                action: 'Analyze location-specific factors and adjust product mix',
                expectedImpact: 'Increase overall revenue by 10-15%'
            });
        }

        return recommendations;
    }

    /**
     * Create alert for important events
     */
    createAlert(type, data) {
        const alert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            data,
            timestamp: new Date().toISOString(),
            severity: this.getAlertSeverity(type),
            resolved: false
        };

        // Store alert
        if (!this.dataStore.has('alerts')) {
            this.dataStore.set('alerts', []);
        }
        this.dataStore.get('alerts').push(alert);

        // Log alert
        logger.warn(`Analytics alert: ${type}`, data);

        return alert;
    }

    /**
     * Create insight for business intelligence
     */
    createInsight(type, data) {
        const insight = {
            id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            data,
            timestamp: new Date().toISOString(),
            category: this.getInsightCategory(type)
        };

        // Store insight
        if (!this.dataStore.has('insights')) {
            this.dataStore.set('insights', []);
        }
        this.dataStore.get('insights').push(insight);

        logger.info(`Analytics insight: ${type}`, data);
        return insight;
    }

    /**
     * Helper methods for feature preparation and analysis
     */
    prepareFraudFeatures(transaction) {
        return [
            transaction.processingTime / 1000, // Normalize to seconds
            transaction.biometricConfidence || 0,
            transaction.cardReadTime / 1000,
            transaction.customerAge / 100, // Normalize age
            transaction.amount / 100, // Normalize amount
            this.getHourOfDay(transaction.timestamp) / 24, // Normalize hour
            this.getDayOfWeek(transaction.timestamp) / 7, // Normalize day
            transaction.ageRequired / 100,
            this.getLocationRisk(transaction.locationId),
            this.getRecentFailureRate(transaction.locationId),
            this.getTimeFromLastTransaction(transaction.locationId),
            this.getProductRisk(transaction.productType),
            this.getWeatherFactor(transaction.locationId), // If available
            this.getEventFactor(transaction.locationId), // Special events
            this.getSeasonalFactor()
        ];
    }

    prepareVerificationFeatures(transaction) {
        return [
            transaction.biometricConfidence || 0,
            transaction.cardReadTime / 1000,
            transaction.customerAge / 100,
            this.getHourOfDay(transaction.timestamp) / 24,
            this.getLightingCondition(transaction.locationId),
            this.getHardwareHealth(transaction.locationId),
            this.getUserExperience(transaction.locationId),
            this.getProductComplexity(transaction.productType),
            this.getLocationTraffic(transaction.locationId),
            this.getSystemLoad()
        ];
    }

    prepareAnomalyFeatures(transaction) {
        return [
            transaction.processingTime / 1000,
            transaction.biometricConfidence || 0,
            transaction.cardReadTime / 1000,
            transaction.customerAge / 100,
            transaction.amount / 100,
            this.getHourOfDay(transaction.timestamp) / 24,
            this.getDayOfWeek(transaction.timestamp) / 7,
            this.getLocationTraffic(transaction.locationId),
            this.getRecentFailureRate(transaction.locationId),
            this.getSystemLoad(),
            this.getWeatherFactor(transaction.locationId),
            this.getSeasonalFactor(),
            this.getProductPopularity(transaction.productType),
            this.getUserBehaviorScore(transaction),
            this.getTimeFromLastTransaction(transaction.locationId),
            this.getHardwareHealth(transaction.locationId),
            this.getNetworkLatency(transaction.locationId),
            this.getSecurityScore(transaction),
            this.getComplianceScore(transaction),
            this.getBusinessScore(transaction)
        ];
    }

    // Utility methods for feature calculation
    getHourOfDay(timestamp) { return new Date(timestamp).getHours(); }
    getDayOfWeek(timestamp) { return new Date(timestamp).getDay(); }
    getLocationRisk(locationId) { return 0.1; } // Placeholder
    getRecentFailureRate(locationId) { return 0.05; } // Placeholder
    getTimeFromLastTransaction(locationId) { return 300; } // Placeholder (seconds)
    getProductRisk(productType) { return 0.1; } // Placeholder
    getWeatherFactor(locationId) { return 0.5; } // Placeholder
    getEventFactor(locationId) { return 0.5; } // Placeholder
    getSeasonalFactor() { return 0.5; } // Placeholder
    getLightingCondition(locationId) { return 0.8; } // Placeholder
    getHardwareHealth(locationId) { return 0.9; } // Placeholder
    getUserExperience(locationId) { return 0.8; } // Placeholder
    getProductComplexity(productType) { return 0.5; } // Placeholder
    getLocationTraffic(locationId) { return 0.6; } // Placeholder
    getSystemLoad() { return 0.3; } // Placeholder
    getProductPopularity(productType) { return 0.7; } // Placeholder
    getUserBehaviorScore(transaction) { return 0.8; } // Placeholder
    getNetworkLatency(locationId) { return 0.1; } // Placeholder
    getSecurityScore(transaction) { return 0.9; } // Placeholder
    getComplianceScore(transaction) { return 0.95; } // Placeholder
    getBusinessScore(transaction) { return 0.85; } // Placeholder

    /**
     * Start background processes
     */
    startBackgroundProcesses() {
        // Generate insights periodically
        setInterval(async () => {
            try {
                await this.generateInsights('daily');
            } catch (error) {
                logger.error('Background insight generation failed:', error);
            }
        }, 60 * 60 * 1000); // Every hour

        // Update models periodically
        setInterval(async () => {
            try {
                await this.updateModels();
            } catch (error) {
                logger.error('Model update failed:', error);
            }
        }, this.config.modelUpdateInterval);

        // Clean up old data
        setInterval(() => {
            this.cleanupOldData();
        }, 24 * 60 * 60 * 1000); // Daily
    }

    /**
     * Get analytics status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            config: this.config,
            modelsLoaded: Object.keys(this.models).reduce((acc, key) => {
                acc[key] = this.models[key] !== null;
                return acc;
            }, {}),
            dataPoints: {
                transactions: this.dataStore.get('transactions').length,
                insights: this.insights.get('dailyInsights').length,
                alerts: (this.dataStore.get('alerts') || []).length
            },
            lastModelUpdate: this.lastModelUpdate,
            realTimeMetrics: this.dataStore.get('realTimeMetrics')
        };
    }

    /**
     * Cleanup analytics engine
     */
    async cleanup() {
        try {
            logger.info('Cleaning up Analytics Engine...');
            
            // Dispose of TensorFlow models
            for (const [name, model] of Object.entries(this.models)) {
                if (model) {
                    model.dispose();
                    logger.debug(`Disposed ML model: ${name}`);
                }
            }

            this.isInitialized = false;
            logger.info('Analytics Engine cleanup completed');

        } catch (error) {
            logger.error('Error during Analytics Engine cleanup:', error);
        }
    }
}

module.exports = AnalyticsEngine;
