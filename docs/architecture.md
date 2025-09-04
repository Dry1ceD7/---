# System Architecture: Advanced Vending Machine Age Verification System

## Architecture Overview

The Advanced Vending Machine Age Verification System follows a modular, microservices architecture designed for high reliability, security, and scalability. The system integrates multiple components including smart card reading, biometric verification, MDB protocol communication, and cloud connectivity.

## System Components

### 1. Smart Card Integration Layer
- **PC/SC Reader Interface**: Direct communication with smart card readers
- **APDU Command Processor**: Handles Thai National ID card specific commands
- **ISO 7816 Compliance**: Ensures broad smart card compatibility
- **Data Extraction Engine**: Parses age and birth date information

### 2. Biometric Verification Module
- **Facial Recognition Engine**: Real-time face detection and matching
- **Liveness Detection**: Prevents spoofing attacks
- **Privacy-Compliant Processing**: No permanent storage of biometric data
- **Confidence Scoring**: Configurable accuracy thresholds

### 3. MDB Protocol Communication
- **MDB Level 3 Implementation**: Full compliance with MDB specification
- **Vending Machine Interface**: Seamless integration with existing systems
- **Command Processing**: Handles purchase authorization and denial
- **Status Monitoring**: Real-time machine status and error reporting

### 4. Security Framework
- **End-to-End Encryption**: All communications encrypted using AES-256
- **Authentication System**: JWT-based authentication for API access
- **Audit Logging**: Comprehensive activity tracking
- **Privacy Protection**: Zero permanent storage of personal information

### 5. Cloud Connectivity
- **Remote Monitoring**: Real-time system health monitoring
- **Firmware Updates**: Over-the-air update capability
- **Compliance Reporting**: Automated regulatory reporting
- **Multi-machine Management**: Centralized configuration and monitoring

## Technical Stack

### Backend Services
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with Socket.io for real-time communication
- **Database**: MongoDB for configuration, Redis for caching
- **Authentication**: JWT with bcrypt for password hashing
- **API Documentation**: Swagger/OpenAPI 3.0

### Smart Card Integration
- **PC/SC Library**: Native PC/SC API integration
- **APDU Commands**: Custom implementation for Thai ID cards
- **Reader Management**: Automatic reader detection and management
- **Error Handling**: Comprehensive error recovery and diagnostics

### Biometric Processing
- **Computer Vision**: OpenCV with face-api.js
- **Face Detection**: Real-time face detection and recognition
- **Image Processing**: Sharp.js for image optimization
- **Privacy Compliance**: In-memory processing only

### MDB Protocol
- **Serial Communication**: SerialPort for RS-485 communication
- **Protocol Implementation**: Custom MDB Level 3 implementation
- **Command Processing**: Purchase authorization and status reporting
- **Error Recovery**: Automatic retry and error handling

### Frontend Interface
- **Framework**: React.js with TypeScript
- **UI Components**: Material-UI for consistent design
- **Real-time Updates**: Socket.io client for live status updates
- **Responsive Design**: Mobile-first approach for various screen sizes

## Data Flow Architecture

### 1. Age Verification Process
```
Customer Interaction → ID Card Insertion → Smart Card Reading → 
Data Extraction → Age Calculation → Biometric Verification → 
Decision Engine → MDB Communication → Vending Machine Response
```

### 2. Security Flow
```
Request → Authentication → Authorization → Processing → 
Audit Logging → Response → Data Cleanup
```

### 3. Cloud Integration Flow
```
Local System → Data Aggregation → Encryption → 
Cloud Transmission → Remote Processing → Response → Local Update
```

## Security Architecture

### Encryption Standards
- **Transport**: TLS 1.3 for all network communications
- **Storage**: AES-256 encryption for sensitive configuration data
- **Memory**: Secure memory handling with automatic cleanup
- **API**: JWT tokens with short expiration times

### Privacy Compliance
- **Data Minimization**: Only collect necessary age verification data
- **No Permanent Storage**: All personal data processed in memory only
- **Audit Trails**: Comprehensive logging without personal information
- **Right to Erasure**: Automatic data cleanup after processing

### Access Control
- **Role-Based Access**: Different permission levels for operators and administrators
- **API Authentication**: JWT-based authentication for all API endpoints
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive input sanitization and validation

## Deployment Architecture

### Local Deployment
- **Single Machine**: All components on one vending machine
- **Docker Containers**: Containerized deployment for easy management
- **Health Monitoring**: Built-in health checks and monitoring
- **Automatic Updates**: Over-the-air update capability

### Cloud Integration
- **Hybrid Architecture**: Local processing with cloud connectivity
- **Edge Computing**: Local decision making with cloud analytics
- **Backup Systems**: Cloud-based backup and disaster recovery
- **Scalability**: Horizontal scaling for multiple machines

### Monitoring and Logging
- **Application Metrics**: Performance and usage metrics
- **System Health**: Hardware and software health monitoring
- **Security Events**: Security incident detection and logging
- **Compliance Reporting**: Automated regulatory compliance reporting

## Performance Requirements

### Response Times
- **ID Card Reading**: < 5 seconds for card detection and data extraction
- **Age Verification**: < 2 seconds for age calculation and validation
- **Biometric Verification**: < 10 seconds for facial recognition
- **Total Process**: < 60 seconds for complete verification cycle

### Reliability Standards
- **Uptime**: 99.9% system availability
- **Error Recovery**: Automatic recovery from 95% of error conditions
- **Data Integrity**: 99.99% accuracy in age verification
- **Security**: Zero successful security breaches

### Scalability
- **Concurrent Users**: Support for 100+ concurrent verification processes
- **Machine Support**: Manage 1000+ vending machines from single cloud instance
- **Data Processing**: Handle 10,000+ verifications per day per machine
- **Storage**: Efficient storage with automatic cleanup and archiving

## Integration Points

### Vending Machine Integration
- **MDB Protocol**: Direct communication with MDB-compatible machines
- **Hardware Interface**: RS-485 serial communication
- **Command Set**: Standard MDB commands for purchase authorization
- **Status Reporting**: Real-time machine status and error reporting

### Smart Card Reader Integration
- **PC/SC API**: Standard PC/SC interface for card readers
- **Reader Detection**: Automatic detection and configuration
- **APDU Commands**: Thai ID card specific command sequences
- **Error Handling**: Comprehensive error detection and recovery

### Cloud Services Integration
- **REST APIs**: Standard RESTful API communication
- **WebSocket**: Real-time bidirectional communication
- **Message Queues**: Reliable message delivery for critical operations
- **Data Synchronization**: Efficient data sync with conflict resolution

## Development Environment

### Local Development
- **Docker Compose**: Complete local development environment
- **Hot Reloading**: Automatic code reloading for development
- **Debug Tools**: Comprehensive debugging and profiling tools
- **Testing Framework**: Unit, integration, and end-to-end testing

### CI/CD Pipeline
- **Automated Testing**: Comprehensive test suite execution
- **Code Quality**: Automated code quality checks and linting
- **Security Scanning**: Automated security vulnerability scanning
- **Deployment**: Automated deployment to staging and production

### Version Control
- **Git Workflow**: Feature branch workflow with pull requests
- **Code Review**: Mandatory code review process
- **Documentation**: Automated documentation generation
- **Release Management**: Semantic versioning with automated releases
