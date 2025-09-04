# Advanced Vending Machine Age Verification System

A comprehensive age verification system for vending machines featuring Thai National ID card integration, biometric verification, MDB protocol support, and privacy-compliant data handling.

## 🚀 Features

### Core Capabilities
- **Thai National ID Card Reading**: PC/SC compatible reader with ISO 7816 standard compliance
- **Biometric Verification**: Facial recognition with privacy-compliant processing
- **MDB Protocol**: Multi-Drop Bus communication for vending machine integration
- **Real-time Decision Engine**: Instant purchase authorization
- **Privacy-First Design**: No permanent storage of personal information
- **Encrypted Communication**: Secure channels between all system components

### Technical Stack
- **Cross-Platform**: Windows, Linux, and embedded OS support
- **Multi-Language**: Node.js, Python, C#, C/C++ support
- **Cloud Integration**: Remote monitoring and firmware updates
- **Multi-Machine Management**: Centralized configuration across locations
- **Payment Integration**: Seamless cashless payment coordination

## 📋 Prerequisites

### System Requirements
- **Operating System**: Windows 10+, Ubuntu 20.04+, or embedded Linux
- **Hardware**: PC/SC compatible smart card reader, camera for biometrics
- **Memory**: Minimum 4GB RAM, 2GB storage
- **Network**: Internet connectivity for cloud features

### Development Tools
- **Node.js**: 18.0.0 or higher
- **Python**: 3.8 or higher (optional)
- **Docker**: For containerized deployment
- **Git**: For version control

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/advanced-vending-machine-age-verification.git
cd advanced-vending-machine-age-verification
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Install Smart Card Tools
```bash
# Ubuntu/Debian
sudo apt-get install pcscd libpcsclite-dev libpcsclite1

# Windows (using Chocolatey)
choco install pcsc-lite

# macOS (using Homebrew)
brew install pcsc-lite
```

### 5. Start the System
```bash
# Development mode
npm run dev

# Production mode
npm start

# With Docker
docker-compose up -d
```

## 🏗️ Project Structure

```
advanced-vending-machine-age-verification/
├── src/                          # Source code
│   ├── core/                     # Core system components
│   ├── smartcard/                # Smart card integration
│   ├── biometric/                # Biometric verification
│   ├── mdb/                      # MDB protocol implementation
│   ├── security/                 # Security and encryption
│   ├── cloud/                    # Cloud connectivity
│   ├── ui/                       # User interface components
│   ├── api/                      # API endpoints
│   └── utils/                    # Utility functions
├── tests/                        # Test suites
├── config/                       # Configuration files
├── scripts/                      # Setup and deployment scripts
├── deployment/                   # Deployment configurations
├── monitoring/                   # Monitoring and logging
└── docs/                         # Documentation
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/vending_db
REDIS_URL=redis://localhost:6379

# Smart Card
SMARTCARD_READER_NAME=ACS ACR122U
SMARTCARD_TIMEOUT=5000

# Biometric
BIOMETRIC_MODEL_PATH=./models/face_recognition_model
BIOMETRIC_CONFIDENCE_THRESHOLD=0.8

# MDB Protocol
MDB_SERIAL_PORT=/dev/ttyUSB0
MDB_BAUD_RATE=9600

# Security
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key

# Cloud
CLOUD_API_URL=https://api.yourcloud.com
CLOUD_API_KEY=your-api-key
```

## 🚀 Usage

### API Endpoints

#### Age Verification
```bash
POST /api/verify-age
Content-Type: application/json

{
  "productCategory": "alcohol",
  "productId": "beer-001",
  "biometricData": {
    "faceImage": "base64-encoded-image"
  }
}
```

#### System Status
```bash
GET /api/status
```

#### Health Check
```bash
GET /health
```

### WebSocket Events

#### Real-time Verification
```javascript
const socket = io('ws://localhost:3000');

socket.emit('verify-age', {
  productCategory: 'alcohol',
  productId: 'beer-001',
  biometricData: { faceImage: 'base64-image' }
});

socket.on('verification-result', (result) => {
  console.log('Verification result:', result);
});
```

## 🔒 Security Features

- **End-to-End Encryption**: All communications encrypted using AES-256
- **Privacy Compliance**: No permanent storage of biometric data
- **Secure Authentication**: JWT-based authentication for API access
- **Audit Logging**: Comprehensive activity tracking
- **Access Control**: Role-based permissions

## 📊 Monitoring

- **Real-time Metrics**: System performance monitoring
- **Health Checks**: Automated system health verification
- **Alert System**: Proactive issue notification
- **Log Aggregation**: Centralized logging and analysis

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Test specific components
npm run smartcard:test
npm run biometric:test
npm run mdb:test
```

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/yourusername/advanced-vending-machine-age-verification/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/advanced-vending-machine-age-verification/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/advanced-vending-machine-age-verification/discussions)

## 🙏 Acknowledgments

- PC/SC Working Group for smart card standards
- OpenCV community for computer vision tools
- MDB Protocol specification contributors
- Privacy and security best practices community
