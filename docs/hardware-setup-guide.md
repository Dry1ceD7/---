# 🔧 Hardware Setup Guide
## Advanced Vending Machine Age Verification System

This guide provides comprehensive instructions for setting up and testing physical hardware components with the Advanced Vending Machine Age Verification System.

---

## 📋 **Hardware Requirements**

### **Essential Components**

#### **1. Smart Card Reader**
- **Recommended**: ACS ACR122U NFC Reader
- **Alternative**: Any PC/SC compatible reader
- **Requirements**: 
  - USB connection
  - PC/SC driver support
  - ISO 14443 Type A/B support
  - NFC capability for Thai National ID cards

#### **2. Camera System**
- **Recommended**: Logitech C920 or C930e
- **Requirements**:
  - USB 3.0 connection (preferred)
  - 1920x1080 resolution minimum
  - 30fps capability
  - Auto-focus support
  - Good low-light performance

#### **3. MDB Interface** (Optional)
- **MDB Level 3 compatible interface**
- **Serial/USB connection**
- **Vending machine integration**

#### **4. System Requirements**
- **OS**: Ubuntu 20.04+, Windows 10+, or macOS 12+
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 50GB available space
- **USB Ports**: 3+ available ports
- **Network**: Ethernet or WiFi connectivity

---

## 🔧 **Hardware Setup Instructions**

### **Step 1: Smart Card Reader Setup**

#### **Linux (Ubuntu/Debian)**
```bash
# Install PC/SC daemon and tools
sudo apt update
sudo apt install pcscd pcsc-tools libpcsclite-dev

# Start PC/SC daemon
sudo systemctl start pcscd
sudo systemctl enable pcscd

# Test reader detection
pcsc_scan
```

#### **macOS**
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PC/SC tools
brew install pcsc-lite

# Test reader detection
system_profiler SPUSBDataType | grep -i acr
```

#### **Windows**
1. Download ACS ACR122U driver from official website
2. Install driver following manufacturer instructions
3. Verify installation in Device Manager
4. Test with provided ACS software

#### **Verification Steps**
```bash
# Run hardware test
REAL_HARDWARE=true ./scripts/test-hardware.sh

# Check specific smart card functionality
node -e "
const SmartCardReader = require('./src/smartcard/smartcard-reader');
const reader = new SmartCardReader();
reader.initialize().then(() => {
    console.log('✅ Smart card reader initialized');
    console.log('Reader available:', reader.isReaderAvailable());
}).catch(console.error);
"
```

### **Step 2: Camera Setup**

#### **Linux Camera Configuration**
```bash
# Install camera tools
sudo apt install v4l-utils cheese

# List available cameras
v4l2-ctl --list-devices

# Test camera
cheese  # GUI camera test
# OR
ffplay /dev/video0  # Command line test

# Set camera permissions
sudo usermod -a -G video $USER
```

#### **Camera Optimization**
```bash
# Set optimal camera settings
v4l2-ctl -d /dev/video0 --set-ctrl=brightness=128
v4l2-ctl -d /dev/video0 --set-ctrl=contrast=128
v4l2-ctl -d /dev/video0 --set-ctrl=saturation=128
v4l2-ctl -d /dev/video0 --set-ctrl=white_balance_temperature_auto=1
v4l2-ctl -d /dev/video0 --set-ctrl=exposure_auto=3
```

#### **Camera Testing**
```bash
# Test camera integration
node -e "
const CameraIntegration = require('./src/hardware/camera-integration');
const camera = new CameraIntegration({mock: false});
camera.initialize().then(async () => {
    console.log('✅ Camera initialized');
    const frame = await camera.captureFrame();
    console.log('Frame captured:', frame.width + 'x' + frame.height);
    await camera.cleanup();
}).catch(console.error);
"
```

### **Step 3: MDB Interface Setup** (Optional)

#### **MDB Hardware Connection**
1. Connect MDB interface to vending machine
2. Configure serial port settings:
   - Baud Rate: 9600
   - Data Bits: 8
   - Parity: None
   - Stop Bits: 1
   - Flow Control: None

#### **MDB Testing**
```bash
# Test MDB communication
node -e "
const MDBCommunicator = require('./src/mdb/mdb-communicator');
const mdb = new MDBCommunicator({mock: false});
mdb.initialize().then(async () => {
    console.log('✅ MDB initialized');
    const handshake = await mdb.performHandshake();
    console.log('Handshake:', handshake);
    await mdb.cleanup();
}).catch(console.error);
"
```

---

## 🧪 **Hardware Testing Procedures**

### **Comprehensive Hardware Test**
```bash
# Run complete hardware test suite
REAL_HARDWARE=true ./scripts/test-hardware.sh
```

### **Individual Component Tests**

#### **Smart Card Reader Test**
```bash
# Test smart card functionality
node -e "
const HardwareTestingSuite = require('./src/testing/hardware-testing-suite');
const suite = new HardwareTestingSuite({realHardwareMode: true});
suite.initialize().then(() => suite.runSmartCardTests())
.then(results => console.log('Smart Card Tests:', results))
.catch(console.error);
"
```

#### **Camera System Test**
```bash
# Test camera functionality
node -e "
const HardwareTestingSuite = require('./src/testing/hardware-testing-suite');
const suite = new HardwareTestingSuite({realHardwareMode: true});
suite.initialize().then(() => suite.runCameraTests())
.then(results => console.log('Camera Tests:', results))
.catch(console.error);
"
```

#### **MDB Protocol Test**
```bash
# Test MDB functionality
node -e "
const HardwareTestingSuite = require('./src/testing/hardware-testing-suite');
const suite = new HardwareTestingSuite({realHardwareMode: true});
suite.initialize().then(() => suite.runMDBTests())
.then(results => console.log('MDB Tests:', results))
.catch(console.error);
"
```

---

## 🔍 **Troubleshooting Guide**

### **Smart Card Reader Issues**

#### **Reader Not Detected**
```bash
# Check USB connection
lsusb | grep -i acs

# Restart PC/SC daemon
sudo systemctl restart pcscd

# Check permissions
sudo usermod -a -G pcscd $USER

# Test with different USB port
```

#### **Card Reading Errors**
```bash
# Check card compatibility
pcsc_scan  # Insert Thai National ID card

# Verify APDU commands
# Use provided test scripts

# Check for interference
# Remove other NFC devices
```

### **Camera Issues**

#### **Camera Not Detected**
```bash
# Check camera connection
v4l2-ctl --list-devices

# Test with different applications
cheese
guvcview

# Check permissions
sudo usermod -a -G video $USER
```

#### **Poor Image Quality**
```bash
# Adjust camera settings
v4l2-ctl -d /dev/video0 --list-ctrls
v4l2-ctl -d /dev/video0 --set-ctrl=exposure_auto=1
v4l2-ctl -d /dev/video0 --set-ctrl=exposure_absolute=200

# Check lighting conditions
# Ensure adequate lighting (>300 lux)
```

### **MDB Interface Issues**

#### **Connection Problems**
```bash
# Check serial port
ls /dev/ttyUSB* /dev/ttyACM*

# Test serial communication
minicom -D /dev/ttyUSB0 -b 9600

# Verify wiring
# Check MDB interface documentation
```

---

## 📊 **Performance Benchmarks**

### **Expected Performance Metrics**

| Component | Metric | Target | Acceptable |
|-----------|---------|---------|------------|
| Smart Card | Read Time | <800ms | <1200ms |
| Camera | Capture Time | <200ms | <500ms |
| Face Detection | Processing | <300ms | <800ms |
| Complete Flow | Total Time | <1500ms | <3000ms |
| Memory Usage | System RAM | <100MB | <200MB |
| CPU Usage | Average | <15% | <30% |

### **Performance Testing**
```bash
# Run performance benchmarks
./scripts/test-hardware.sh 2>&1 | grep -E "(Performance|duration|time)"

# Monitor system resources
htop  # During testing
```

---

## 🏭 **Production Deployment Checklist**

### **Pre-Deployment Validation**
- [ ] All hardware components detected and functional
- [ ] Complete test suite passes (95%+ success rate)
- [ ] Performance metrics meet targets
- [ ] Error handling tested and validated
- [ ] Security configurations verified
- [ ] Network connectivity established
- [ ] Backup and recovery procedures tested

### **Deployment Steps**
1. **Hardware Installation**
   - Mount smart card reader securely
   - Position camera for optimal face capture
   - Connect MDB interface to vending machine
   - Verify all cable connections

2. **System Configuration**
   - Run automated setup: `./scripts/automated-setup.sh`
   - Configure location-specific settings
   - Test complete age verification flow
   - Validate with real Thai ID cards

3. **Operational Testing**
   - Test with multiple users
   - Validate different age groups
   - Test error scenarios
   - Verify logging and monitoring

4. **Go-Live Preparation**
   - Train operators
   - Document procedures
   - Set up monitoring alerts
   - Schedule maintenance

---

## 🔧 **Maintenance Procedures**

### **Daily Checks**
```bash
# Automated health check
curl http://localhost:3000/health

# Hardware status check
./scripts/test-hardware.sh --quick
```

### **Weekly Maintenance**
```bash
# Complete hardware test
REAL_HARDWARE=true ./scripts/test-hardware.sh

# Clean camera lens
# Check smart card reader
# Review system logs
```

### **Monthly Procedures**
- Update system software
- Review performance metrics
- Clean hardware components
- Test backup procedures
- Update ML models with new data

---

## 📞 **Support and Resources**

### **Hardware Vendors**
- **ACS**: Smart card reader support and drivers
- **Logitech**: Camera drivers and software
- **MDB Interface**: Vendor-specific documentation

### **System Support**
- **Documentation**: `/docs` directory
- **Logs**: `/logs` directory
- **Test Reports**: `/reports/hardware`
- **Configuration**: `/config` directory

### **Emergency Procedures**
1. **Hardware Failure**: Switch to mock mode temporarily
2. **Performance Issues**: Check system resources and restart services
3. **Network Issues**: Verify connectivity and failover procedures
4. **Complete System Failure**: Follow disaster recovery procedures

---

## 🎯 **Next Steps**

After successful hardware setup and testing:

1. **Field Testing**: Deploy to test location
2. **User Acceptance Testing**: Test with real users
3. **Performance Optimization**: Tune based on real-world usage
4. **Production Deployment**: Roll out to all locations
5. **Monitoring Setup**: Configure alerts and dashboards
6. **Operator Training**: Train support staff

**🏆 With proper hardware setup and testing, your Advanced Vending Machine Age Verification System is ready for production deployment!**
