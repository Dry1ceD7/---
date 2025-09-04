const tf = require('@tensorflow/tfjs-node');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

/**
 * Advanced ML Training Pipeline
 * Trains machine learning models with real-world transaction data
 */
class MLTrainingPipeline {
    constructor(config = {}) {
        this.config = {
            dataPath: config.dataPath || 'data/training',
            modelsPath: config.modelsPath || 'models',
            batchSize: config.batchSize || 32,
            epochs: config.epochs || 100,
            validationSplit: config.validationSplit || 0.2,
            learningRate: config.learningRate || 0.001,
            enableEarlyStopping: config.enableEarlyStopping ?? true,
            patience: config.patience || 10,
            minDelta: config.minDelta || 0.001,
            saveCheckpoints: config.saveCheckpoints ?? true,
            enableTensorBoard: config.enableTensorBoard ?? true
        };

        this.models = {};
        this.trainingHistory = {};
        this.isTraining = false;
        this.currentTrainingJob = null;
    }

    /**
     * Initialize ML training pipeline
     */
    async initialize() {
        try {
            logger.info('Initializing ML Training Pipeline...');

            // Create necessary directories
            await this.createDirectories();

            // Load existing models if available
            await this.loadExistingModels();

            // Generate synthetic training data if no real data available
            await this.ensureTrainingData();

            logger.info('ML Training Pipeline initialized successfully');

        } catch (error) {
            logger.error('Failed to initialize ML Training Pipeline:', error);
            throw error;
        }
    }

    /**
     * Create necessary directories
     */
    async createDirectories() {
        const directories = [
            this.config.dataPath,
            this.config.modelsPath,
            path.join(this.config.modelsPath, 'checkpoints'),
            path.join(this.config.dataPath, 'processed'),
            path.join(this.config.dataPath, 'raw'),
            'logs/training'
        ];

        for (const dir of directories) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    throw error;
                }
            }
        }

        logger.info('Training directories created');
    }

    /**
     * Load existing models
     */
    async loadExistingModels() {
        try {
            const modelTypes = ['ageVerification', 'fraudDetection', 'demandForecasting', 'anomalyDetection'];
            
            for (const modelType of modelTypes) {
                const modelPath = path.join(this.config.modelsPath, `${modelType}.json`);
                
                try {
                    await fs.access(modelPath);
                    this.models[modelType] = await tf.loadLayersModel(`file://${modelPath}`);
                    logger.info(`Loaded existing ${modelType} model`);
                } catch (error) {
                    logger.info(`No existing ${modelType} model found, will train new one`);
                }
            }
        } catch (error) {
            logger.error('Error loading existing models:', error);
        }
    }

    /**
     * Ensure training data is available
     */
    async ensureTrainingData() {
        const dataFiles = [
            'transactions.json',
            'age_verifications.json',
            'fraud_cases.json',
            'demand_data.json'
        ];

        let hasRealData = false;
        for (const file of dataFiles) {
            const filePath = path.join(this.config.dataPath, 'raw', file);
            try {
                await fs.access(filePath);
                hasRealData = true;
                logger.info(`Found real data file: ${file}`);
            } catch (error) {
                logger.info(`No real data file found: ${file}`);
            }
        }

        if (!hasRealData) {
            logger.info('No real training data found, generating synthetic data...');
            await this.generateSyntheticData();
        }
    }

    /**
     * Generate synthetic training data
     */
    async generateSyntheticData() {
        logger.info('Generating synthetic training data...');

        // Generate transaction data
        const transactions = this.generateSyntheticTransactions(10000);
        await this.saveData('transactions.json', transactions);

        // Generate age verification data
        const ageVerifications = this.generateSyntheticAgeVerifications(5000);
        await this.saveData('age_verifications.json', ageVerifications);

        // Generate fraud cases
        const fraudCases = this.generateSyntheticFraudCases(1000);
        await this.saveData('fraud_cases.json', fraudCases);

        // Generate demand data
        const demandData = this.generateSyntheticDemandData(365);
        await this.saveData('demand_data.json', demandData);

        logger.info('Synthetic training data generated');
    }

    /**
     * Generate synthetic transaction data
     */
    generateSyntheticTransactions(count) {
        const transactions = [];
        const locations = ['LOC001', 'LOC002', 'LOC003', 'LOC004', 'LOC005'];
        const products = ['BEER001', 'BEER002', 'CIG001', 'CIG002'];
        
        for (let i = 0; i < count; i++) {
            const age = Math.floor(Math.random() * 60) + 15; // 15-75 years
            const ageRequired = Math.random() > 0.5 ? 20 : 18;
            const processingTime = Math.random() * 5000 + 500; // 0.5-5.5 seconds
            const biometricConfidence = Math.random() * 0.4 + 0.6; // 0.6-1.0
            const cardReadTime = Math.random() * 2000 + 200; // 0.2-2.2 seconds
            
            transactions.push({
                id: `tx_${i.toString().padStart(6, '0')}`,
                timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                locationId: locations[Math.floor(Math.random() * locations.length)],
                productType: products[Math.floor(Math.random() * products.length)],
                ageRequired,
                customerAge: age,
                verificationMethod: 'smartcard_biometric',
                processingTime,
                success: age >= ageRequired && biometricConfidence > 0.7,
                amount: Math.random() * 100 + 20,
                biometricConfidence,
                cardReadTime,
                fraudRisk: Math.random() * 0.3,
                hour: new Date().getHours(),
                dayOfWeek: new Date().getDay(),
                weatherCondition: ['sunny', 'rainy', 'cloudy'][Math.floor(Math.random() * 3)],
                isHoliday: Math.random() > 0.9
            });
        }

        return transactions;
    }

    /**
     * Generate synthetic age verification data
     */
    generateSyntheticAgeVerifications(count) {
        const verifications = [];
        
        for (let i = 0; i < count; i++) {
            const age = Math.floor(Math.random() * 60) + 15;
            const ageRequired = Math.random() > 0.5 ? 20 : 18;
            const lightingQuality = Math.random();
            const imageQuality = Math.random();
            const cardQuality = Math.random();
            
            verifications.push({
                id: `av_${i.toString().padStart(6, '0')}`,
                customerAge: age,
                ageRequired,
                lightingQuality,
                imageQuality,
                cardQuality,
                processingTime: Math.random() * 3000 + 500,
                success: age >= ageRequired && lightingQuality > 0.3 && imageQuality > 0.4 && cardQuality > 0.5,
                biometricScore: Math.random() * 0.4 + 0.6,
                livenessScore: Math.random() * 0.4 + 0.6,
                cardReadSuccess: cardQuality > 0.5,
                retryCount: Math.floor(Math.random() * 3),
                timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
            });
        }

        return verifications;
    }

    /**
     * Generate synthetic fraud cases
     */
    generateSyntheticFraudCases(count) {
        const fraudCases = [];
        
        for (let i = 0; i < count; i++) {
            const isFraud = Math.random() > 0.8; // 20% fraud rate
            
            fraudCases.push({
                id: `fraud_${i.toString().padStart(6, '0')}`,
                isFraud,
                suspiciousActivity: isFraud ? Math.random() > 0.3 : Math.random() > 0.8,
                multipleAttempts: isFraud ? Math.random() > 0.4 : Math.random() > 0.9,
                unusualTiming: isFraud ? Math.random() > 0.5 : Math.random() > 0.85,
                cardAnomalies: isFraud ? Math.random() > 0.6 : Math.random() > 0.95,
                biometricAnomalies: isFraud ? Math.random() > 0.4 : Math.random() > 0.9,
                locationRisk: Math.random(),
                timeRisk: Math.random(),
                behaviorRisk: Math.random(),
                amountRisk: Math.random(),
                velocityRisk: Math.random(),
                timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
            });
        }

        return fraudCases;
    }

    /**
     * Generate synthetic demand data
     */
    generateSyntheticDemandData(days) {
        const demandData = [];
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() - days);
        
        for (let i = 0; i < days; i++) {
            const date = new Date(baseDate);
            date.setDate(date.getDate() + i);
            
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = Math.random() > 0.95;
            
            // Generate hourly data for each day
            for (let hour = 0; hour < 24; hour++) {
                let baseDemand = 10;
                
                // Adjust for time of day
                if (hour >= 7 && hour <= 9) baseDemand *= 1.5; // Morning rush
                if (hour >= 12 && hour <= 14) baseDemand *= 1.8; // Lunch rush
                if (hour >= 17 && hour <= 19) baseDemand *= 1.6; // Evening rush
                if (hour >= 22 || hour <= 5) baseDemand *= 0.3; // Night time
                
                // Adjust for day of week
                if (isWeekend) baseDemand *= 1.2;
                if (isHoliday) baseDemand *= 0.7;
                
                // Add some randomness
                const demand = Math.max(0, Math.floor(baseDemand * (0.8 + Math.random() * 0.4)));
                
                demandData.push({
                    timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour).toISOString(),
                    hour,
                    dayOfWeek,
                    isWeekend,
                    isHoliday,
                    demand,
                    temperature: 20 + Math.random() * 15, // 20-35°C
                    humidity: 40 + Math.random() * 40, // 40-80%
                    rainfall: Math.random() > 0.8 ? Math.random() * 10 : 0,
                    events: isHoliday ? 'holiday' : (Math.random() > 0.9 ? 'special_event' : 'normal')
                });
            }
        }

        return demandData;
    }

    /**
     * Save data to file
     */
    async saveData(filename, data) {
        const filePath = path.join(this.config.dataPath, 'raw', filename);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        logger.info(`Saved ${data.length} records to ${filename}`);
    }

    /**
     * Train age verification model
     */
    async trainAgeVerificationModel() {
        logger.info('Training age verification success prediction model...');

        try {
            // Load and preprocess data
            const data = await this.loadAndPreprocessData('age_verifications.json');
            const { xTrain, yTrain, xVal, yVal } = await this.prepareTrainingData(data, 'ageVerification');

            // Create model architecture
            const model = tf.sequential({
                layers: [
                    tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
                    tf.layers.dropout({ rate: 0.3 }),
                    tf.layers.dense({ units: 32, activation: 'relu' }),
                    tf.layers.dropout({ rate: 0.2 }),
                    tf.layers.dense({ units: 16, activation: 'relu' }),
                    tf.layers.dense({ units: 1, activation: 'sigmoid' })
                ]
            });

            // Compile model
            model.compile({
                optimizer: tf.train.adam(this.config.learningRate),
                loss: 'binaryCrossentropy',
                metrics: ['accuracy', 'precision', 'recall']
            });

            // Set up callbacks
            const callbacks = this.setupCallbacks('ageVerification');

            // Train model
            const history = await model.fit(xTrain, yTrain, {
                epochs: this.config.epochs,
                batchSize: this.config.batchSize,
                validationData: [xVal, yVal],
                callbacks,
                verbose: 1
            });

            // Save model
            await this.saveModel(model, 'ageVerification');
            this.models.ageVerification = model;
            this.trainingHistory.ageVerification = history;

            // Evaluate model
            const evaluation = await this.evaluateModel(model, xVal, yVal, 'ageVerification');
            logger.info(`Age verification model trained - Accuracy: ${(evaluation.accuracy * 100).toFixed(2)}%`);

            return { model, history, evaluation };

        } catch (error) {
            logger.error('Age verification model training failed:', error);
            throw error;
        }
    }

    /**
     * Train fraud detection model
     */
    async trainFraudDetectionModel() {
        logger.info('Training fraud detection model...');

        try {
            const data = await this.loadAndPreprocessData('fraud_cases.json');
            const { xTrain, yTrain, xVal, yVal } = await this.prepareTrainingData(data, 'fraudDetection');

            // Create more complex model for fraud detection
            const model = tf.sequential({
                layers: [
                    tf.layers.dense({ inputShape: [15], units: 128, activation: 'relu' }),
                    tf.layers.dropout({ rate: 0.4 }),
                    tf.layers.dense({ units: 64, activation: 'relu' }),
                    tf.layers.dropout({ rate: 0.3 }),
                    tf.layers.dense({ units: 32, activation: 'relu' }),
                    tf.layers.dropout({ rate: 0.2 }),
                    tf.layers.dense({ units: 1, activation: 'sigmoid' })
                ]
            });

            model.compile({
                optimizer: tf.train.adam(this.config.learningRate * 0.5), // Lower learning rate for stability
                loss: 'binaryCrossentropy',
                metrics: ['accuracy', 'precision', 'recall', 'auc']
            });

            const callbacks = this.setupCallbacks('fraudDetection');

            const history = await model.fit(xTrain, yTrain, {
                epochs: this.config.epochs,
                batchSize: this.config.batchSize,
                validationData: [xVal, yVal],
                callbacks,
                verbose: 1
            });

            await this.saveModel(model, 'fraudDetection');
            this.models.fraudDetection = model;
            this.trainingHistory.fraudDetection = history;

            const evaluation = await this.evaluateModel(model, xVal, yVal, 'fraudDetection');
            logger.info(`Fraud detection model trained - Accuracy: ${(evaluation.accuracy * 100).toFixed(2)}%`);

            return { model, history, evaluation };

        } catch (error) {
            logger.error('Fraud detection model training failed:', error);
            throw error;
        }
    }

    /**
     * Train demand forecasting model
     */
    async trainDemandForecastingModel() {
        logger.info('Training demand forecasting model...');

        try {
            const data = await this.loadAndPreprocessData('demand_data.json');
            const { xTrain, yTrain, xVal, yVal } = await this.prepareTimeSeriesData(data);

            // LSTM model for time series forecasting
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
                    tf.layers.dense({ units: 25, activation: 'relu' }),
                    tf.layers.dense({ units: 1, activation: 'linear' })
                ]
            });

            model.compile({
                optimizer: tf.train.adam(this.config.learningRate),
                loss: 'meanSquaredError',
                metrics: ['meanAbsoluteError', 'meanAbsolutePercentageError']
            });

            const callbacks = this.setupCallbacks('demandForecasting');

            const history = await model.fit(xTrain, yTrain, {
                epochs: Math.floor(this.config.epochs * 0.8), // Fewer epochs for LSTM
                batchSize: Math.floor(this.config.batchSize / 2), // Smaller batch size
                validationData: [xVal, yVal],
                callbacks,
                verbose: 1
            });

            await this.saveModel(model, 'demandForecasting');
            this.models.demandForecasting = model;
            this.trainingHistory.demandForecasting = history;

            const evaluation = await this.evaluateModel(model, xVal, yVal, 'demandForecasting');
            logger.info(`Demand forecasting model trained - MAE: ${evaluation.meanAbsoluteError.toFixed(2)}`);

            return { model, history, evaluation };

        } catch (error) {
            logger.error('Demand forecasting model training failed:', error);
            throw error;
        }
    }

    /**
     * Train all models
     */
    async trainAllModels() {
        if (this.isTraining) {
            throw new Error('Training already in progress');
        }

        this.isTraining = true;
        const startTime = Date.now();

        try {
            logger.info('🚀 Starting comprehensive ML model training...');

            const results = {};

            // Train models sequentially to avoid memory issues
            results.ageVerification = await this.trainAgeVerificationModel();
            results.fraudDetection = await this.trainFraudDetectionModel();
            results.demandForecasting = await this.trainDemandForecastingModel();

            const totalTime = Date.now() - startTime;
            logger.info(`✅ All models trained successfully in ${(totalTime / 1000).toFixed(2)} seconds`);

            // Generate training report
            await this.generateTrainingReport(results, totalTime);

            return results;

        } catch (error) {
            logger.error('Model training failed:', error);
            throw error;
        } finally {
            this.isTraining = false;
        }
    }

    /**
     * Load and preprocess data
     */
    async loadAndPreprocessData(filename) {
        const filePath = path.join(this.config.dataPath, 'raw', filename);
        const rawData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        
        // Basic preprocessing
        return rawData.map(item => ({
            ...item,
            timestamp: new Date(item.timestamp).getTime()
        }));
    }

    /**
     * Prepare training data
     */
    async prepareTrainingData(data, modelType) {
        let features, labels;

        switch (modelType) {
            case 'ageVerification':
                features = data.map(item => [
                    item.customerAge / 100,
                    item.ageRequired / 100,
                    item.lightingQuality,
                    item.imageQuality,
                    item.cardQuality,
                    item.processingTime / 10000,
                    item.biometricScore,
                    item.livenessScore,
                    item.cardReadSuccess ? 1 : 0,
                    item.retryCount / 10
                ]);
                labels = data.map(item => item.success ? 1 : 0);
                break;

            case 'fraudDetection':
                features = data.map(item => [
                    item.suspiciousActivity ? 1 : 0,
                    item.multipleAttempts ? 1 : 0,
                    item.unusualTiming ? 1 : 0,
                    item.cardAnomalies ? 1 : 0,
                    item.biometricAnomalies ? 1 : 0,
                    item.locationRisk,
                    item.timeRisk,
                    item.behaviorRisk,
                    item.amountRisk,
                    item.velocityRisk,
                    new Date(item.timestamp).getHours() / 24,
                    new Date(item.timestamp).getDay() / 7,
                    Math.sin(2 * Math.PI * new Date(item.timestamp).getHours() / 24),
                    Math.cos(2 * Math.PI * new Date(item.timestamp).getHours() / 24),
                    Math.random() // Additional noise feature
                ]);
                labels = data.map(item => item.isFraud ? 1 : 0);
                break;
        }

        // Convert to tensors
        const xTensor = tf.tensor2d(features);
        const yTensor = tf.tensor1d(labels);

        // Split into train/validation
        const splitIndex = Math.floor(features.length * (1 - this.config.validationSplit));
        
        const xTrain = xTensor.slice([0, 0], [splitIndex, -1]);
        const xVal = xTensor.slice([splitIndex, 0], [-1, -1]);
        const yTrain = yTensor.slice([0], [splitIndex]);
        const yVal = yTensor.slice([splitIndex], [-1]);

        // Cleanup
        xTensor.dispose();
        yTensor.dispose();

        return { xTrain, yTrain, xVal, yVal };
    }

    /**
     * Prepare time series data for LSTM
     */
    async prepareTimeSeriesData(data) {
        // Group by day and create sequences
        const sequences = [];
        const targets = [];

        // Sort by timestamp
        data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Create 24-hour sequences
        for (let i = 0; i < data.length - 24; i++) {
            const sequence = data.slice(i, i + 24).map(item => [
                item.hour / 24,
                item.dayOfWeek / 7,
                item.isWeekend ? 1 : 0,
                item.temperature / 50,
                item.humidity / 100
            ]);
            
            sequences.push(sequence);
            targets.push(data[i + 24].demand / 100); // Normalize target
        }

        const xTensor = tf.tensor3d(sequences);
        const yTensor = tf.tensor1d(targets);

        // Split into train/validation
        const splitIndex = Math.floor(sequences.length * (1 - this.config.validationSplit));
        
        const xTrain = xTensor.slice([0, 0, 0], [splitIndex, -1, -1]);
        const xVal = xTensor.slice([splitIndex, 0, 0], [-1, -1, -1]);
        const yTrain = yTensor.slice([0], [splitIndex]);
        const yVal = yTensor.slice([splitIndex], [-1]);

        // Cleanup
        xTensor.dispose();
        yTensor.dispose();

        return { xTrain, yTrain, xVal, yVal };
    }

    /**
     * Setup training callbacks
     */
    setupCallbacks(modelType) {
        const callbacks = [];

        // Early stopping
        if (this.config.enableEarlyStopping) {
            callbacks.push(tf.callbacks.earlyStopping({
                monitor: 'val_loss',
                patience: this.config.patience,
                minDelta: this.config.minDelta,
                restoreBestWeights: true
            }));
        }

        // Model checkpointing
        if (this.config.saveCheckpoints) {
            const checkpointPath = path.join(this.config.modelsPath, 'checkpoints', `${modelType}_checkpoint`);
            // Note: TensorFlow.js doesn't have built-in model checkpointing like Python
            // This would need custom implementation
        }

        return callbacks;
    }

    /**
     * Evaluate model performance
     */
    async evaluateModel(model, xVal, yVal, modelType) {
        const evaluation = await model.evaluate(xVal, yVal, { verbose: 0 });
        
        const metrics = {};
        const metricNames = model.metricsNames;
        
        for (let i = 0; i < metricNames.length; i++) {
            const value = await evaluation[i].data();
            metrics[metricNames[i]] = value[0];
        }

        // Additional custom metrics
        const predictions = model.predict(xVal);
        const predData = await predictions.data();
        const trueData = await yVal.data();
        
        // Calculate additional metrics based on model type
        if (modelType === 'ageVerification' || modelType === 'fraudDetection') {
            // Classification metrics
            const binaryPreds = predData.map(p => p > 0.5 ? 1 : 0);
            const trueLabels = Array.from(trueData);
            
            let tp = 0, tn = 0, fp = 0, fn = 0;
            for (let i = 0; i < binaryPreds.length; i++) {
                if (binaryPreds[i] === 1 && trueLabels[i] === 1) tp++;
                else if (binaryPreds[i] === 0 && trueLabels[i] === 0) tn++;
                else if (binaryPreds[i] === 1 && trueLabels[i] === 0) fp++;
                else fn++;
            }
            
            metrics.precision = tp / (tp + fp) || 0;
            metrics.recall = tp / (tp + fn) || 0;
            metrics.f1Score = 2 * (metrics.precision * metrics.recall) / (metrics.precision + metrics.recall) || 0;
            metrics.specificity = tn / (tn + fp) || 0;
        }

        predictions.dispose();
        
        return metrics;
    }

    /**
     * Save trained model
     */
    async saveModel(model, modelType) {
        const modelPath = path.join(this.config.modelsPath, modelType);
        await model.save(`file://${modelPath}`);
        logger.info(`Model saved: ${modelType}`);
    }

    /**
     * Generate training report
     */
    async generateTrainingReport(results, totalTime) {
        const reportPath = path.join('reports', `ml-training-report-${new Date().toISOString().split('T')[0]}.md`);
        
        let report = `# ML Training Report\n\n`;
        report += `**Date**: ${new Date().toISOString()}\n`;
        report += `**Total Training Time**: ${(totalTime / 1000).toFixed(2)} seconds\n\n`;
        
        for (const [modelType, result] of Object.entries(results)) {
            report += `## ${modelType.charAt(0).toUpperCase() + modelType.slice(1)} Model\n\n`;
            report += `### Performance Metrics\n`;
            
            for (const [metric, value] of Object.entries(result.evaluation)) {
                report += `- **${metric}**: ${typeof value === 'number' ? value.toFixed(4) : value}\n`;
            }
            
            report += `\n### Training History\n`;
            const finalEpoch = result.history.epoch.length;
            report += `- **Epochs Trained**: ${finalEpoch}\n`;
            report += `- **Final Training Loss**: ${result.history.history.loss[finalEpoch - 1].toFixed(4)}\n`;
            report += `- **Final Validation Loss**: ${result.history.history.val_loss[finalEpoch - 1].toFixed(4)}\n\n`;
        }
        
        await fs.mkdir('reports', { recursive: true });
        await fs.writeFile(reportPath, report);
        logger.info(`Training report generated: ${reportPath}`);
    }

    /**
     * Get training status
     */
    getTrainingStatus() {
        return {
            isTraining: this.isTraining,
            currentJob: this.currentTrainingJob,
            modelsAvailable: Object.keys(this.models),
            trainingHistory: Object.keys(this.trainingHistory),
            config: this.config
        };
    }

    /**
     * Cleanup training pipeline
     */
    async cleanup() {
        try {
            logger.info('Cleaning up ML Training Pipeline...');
            
            // Dispose of models
            for (const [name, model] of Object.entries(this.models)) {
                if (model && model.dispose) {
                    model.dispose();
                    logger.debug(`Disposed model: ${name}`);
                }
            }
            
            this.models = {};
            this.trainingHistory = {};
            this.isTraining = false;
            
            logger.info('ML Training Pipeline cleanup completed');
            
        } catch (error) {
            logger.error('Error during ML Training Pipeline cleanup:', error);
        }
    }
}

module.exports = MLTrainingPipeline;
