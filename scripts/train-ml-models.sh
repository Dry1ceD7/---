#!/bin/bash

# Advanced ML Model Training Script
# Trains machine learning models with real-world data

set -e

# Configuration
TRAINING_LOG="logs/ml-training-$(date +%Y%m%d-%H%M%S).log"
MODELS_DIR="models"
DATA_DIR="data/training"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Logging
log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$TRAINING_LOG"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$TRAINING_LOG"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$TRAINING_LOG"; }
error() { echo -e "${RED}[ERROR]${NC} $1" | tee -a "$TRAINING_LOG"; }
info() { echo -e "${PURPLE}[INFO]${NC} $1" | tee -a "$TRAINING_LOG"; }

# Create directories
mkdir -p logs models data/training reports

echo -e "${PURPLE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🧠 ADVANCED ML MODEL TRAINING SYSTEM                     ║
║                                                              ║
║    Machine Learning Pipeline for Real-World Data            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Start training
log "🚀 Starting ML model training pipeline..."

# Run the training pipeline
node -e "
const MLTrainingPipeline = require('./src/ml/training-pipeline');

async function main() {
    try {
        const pipeline = new MLTrainingPipeline({
            dataPath: 'data/training',
            modelsPath: 'models',
            batchSize: 32,
            epochs: 50,
            validationSplit: 0.2,
            learningRate: 0.001,
            enableEarlyStopping: true,
            patience: 10
        });

        await pipeline.initialize();
        const results = await pipeline.trainAllModels();
        
        console.log('✅ All models trained successfully!');
        console.log('📊 Training Results:');
        
        for (const [modelType, result] of Object.entries(results)) {
            console.log(\`\n🔹 \${modelType}:\`);
            for (const [metric, value] of Object.entries(result.evaluation)) {
                console.log(\`   \${metric}: \${typeof value === 'number' ? value.toFixed(4) : value}\`);
            }
        }
        
        await pipeline.cleanup();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Training failed:', error);
        process.exit(1);
    }
}

main();
" 2>&1 | tee -a "$TRAINING_LOG"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    success "🎉 ML model training completed successfully!"
    info "📋 Training log: $TRAINING_LOG"
    info "🤖 Models saved to: $MODELS_DIR"
    info "📊 Reports available in: reports/"
else
    error "❌ ML model training failed"
    info "🔍 Check training log: $TRAINING_LOG"
    exit 1
fi
