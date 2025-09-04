#!/bin/bash

# Physical Hardware Testing Script
# Comprehensive testing of all hardware components

set -e

# Configuration
TEST_LOG="logs/hardware-test-$(date +%Y%m%d-%H%M%S).log"
REAL_HARDWARE=${REAL_HARDWARE:-false}
TEST_TIMEOUT=${TEST_TIMEOUT:-300}

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Logging
log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$TEST_LOG"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$TEST_LOG"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$TEST_LOG"; }
error() { echo -e "${RED}[ERROR]${NC} $1" | tee -a "$TEST_LOG"; }
info() { echo -e "${PURPLE}[INFO]${NC} $1" | tee -a "$TEST_LOG"; }

# Create directories
mkdir -p logs reports/hardware data/hardware-tests

echo -e "${PURPLE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🔬 PHYSICAL HARDWARE TESTING SUITE                       ║
║                                                              ║
║    Comprehensive Hardware Validation & Integration          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check hardware mode
if [ "$REAL_HARDWARE" = "true" ]; then
    info "🔧 REAL HARDWARE MODE: Testing with actual devices"
    info "📋 Prerequisites:"
    echo "   • ACS ACR122U smart card reader connected"
    echo "   • Thai National ID card available"
    echo "   • Logitech C920/C930e camera connected"
    echo "   • MDB-compatible vending machine (optional)"
    echo ""
    read -p "Are all hardware components connected? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        warning "Switching to mock mode for testing"
        REAL_HARDWARE=false
    fi
else
    info "🤖 MOCK MODE: Testing with simulated hardware"
fi

# Set environment variables
export MOCK_SMARTCARD=$([ "$REAL_HARDWARE" = "true" ] && echo "false" || echo "true")
export MOCK_BIOMETRIC=$([ "$REAL_HARDWARE" = "true" ] && echo "false" || echo "true")
export MOCK_MDB=$([ "$REAL_HARDWARE" = "true" ] && echo "false" || echo "true")

log "🚀 Starting hardware testing suite..."
log "Environment: MOCK_SMARTCARD=$MOCK_SMARTCARD, MOCK_BIOMETRIC=$MOCK_BIOMETRIC, MOCK_MDB=$MOCK_MDB"

# Run hardware tests
node -e "
const HardwareTestingSuite = require('./src/testing/hardware-testing-suite');

async function runTests() {
    const testSuite = new HardwareTestingSuite({
        realHardwareMode: process.env.MOCK_SMARTCARD !== 'true',
        testTimeout: ${TEST_TIMEOUT} * 1000,
        retryAttempts: 3,
        enableDetailedLogging: true,
        generateReports: true
    });

    try {
        console.log('🔬 Initializing hardware testing suite...');
        await testSuite.initialize();
        
        console.log('🧪 Running comprehensive test suite...');
        const results = await testSuite.runCompleteTestSuite();
        
        console.log('\\n📊 TEST RESULTS SUMMARY:');
        console.log('========================');
        
        let totalTests = 0;
        let totalPassed = 0;
        let totalFailed = 0;
        
        for (const [groupName, groupResults] of Object.entries(results)) {
            const successRate = (groupResults.passedTests / groupResults.totalTests * 100).toFixed(1);
            console.log(\`\${groupResults.groupName}: \${groupResults.passedTests}/\${groupResults.totalTests} (\${successRate}%)\`);
            
            totalTests += groupResults.totalTests;
            totalPassed += groupResults.passedTests;
            totalFailed += groupResults.failedTests;
        }
        
        console.log('========================');
        console.log(\`Overall: \${totalPassed}/\${totalTests} (\${(totalPassed/totalTests*100).toFixed(1)}%)\`);
        
        if (totalFailed === 0) {
            console.log('\\n✅ All hardware tests passed successfully!');
            process.exit(0);
        } else {
            console.log(\`\\n⚠️ \${totalFailed} tests failed. Check detailed report.\`);
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Hardware testing failed:', error.message);
        process.exit(1);
    } finally {
        await testSuite.cleanup();
    }
}

runTests();
" 2>&1 | tee -a "$TEST_LOG"

TEST_EXIT_CODE=${PIPESTATUS[0]}

if [ $TEST_EXIT_CODE -eq 0 ]; then
    success "🎉 Hardware testing completed successfully!"
    
    # Generate summary
    echo ""
    info "📋 TESTING SUMMARY"
    echo "=================="
    echo "• Test Log: $TEST_LOG"
    echo "• Hardware Mode: $([ "$REAL_HARDWARE" = "true" ] && echo "Real Hardware" || echo "Mock Mode")"
    echo "• Reports: reports/hardware/"
    echo "• Test Data: data/hardware-tests/"
    
    if [ "$REAL_HARDWARE" = "true" ]; then
        echo ""
        success "🔧 REAL HARDWARE VALIDATION COMPLETE"
        echo "✅ Smart card reader tested and validated"
        echo "✅ Camera integration tested and validated"  
        echo "✅ MDB protocol tested and validated"
        echo "✅ Complete system integration verified"
        echo ""
        info "🚀 READY FOR PRODUCTION DEPLOYMENT"
        echo "The system has been validated with real hardware"
        echo "and is ready for field deployment."
    else
        echo ""
        info "🤖 MOCK MODE TESTING COMPLETE"
        echo "All hardware interfaces tested in simulation mode."
        echo "Connect real hardware and run with REAL_HARDWARE=true"
        echo "for complete validation."
    fi
    
else
    error "❌ Hardware testing failed"
    echo ""
    warning "🔍 TROUBLESHOOTING STEPS:"
    echo "1. Check hardware connections"
    echo "2. Verify driver installations"
    echo "3. Review test log: $TEST_LOG"
    echo "4. Check hardware compatibility"
    echo "5. Test individual components separately"
    
    exit 1
fi
