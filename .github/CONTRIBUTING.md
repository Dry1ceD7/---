# Contributing to Advanced Vending Machine Age Verification System

Thank you for your interest in contributing to the Advanced Vending Machine Age Verification System! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Docker and Docker Compose
- Git

### Development Setup
1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/AutoVendingMachine.git
   cd AutoVendingMachine
   ```

2. **Run automated setup**
   ```bash
   ./scripts/automated-setup.sh
   ```

3. **Start development environment**
   ```bash
   npm run dev
   cd frontend && npm start
   ```

## 🏗️ Project Structure

```
AutoVendingMachine/
├── src/                    # Backend source code
│   ├── core/              # Core age verification engine
│   ├── smartcard/         # Smart card integration
│   ├── biometric/         # Facial recognition
│   ├── mdb/               # Vending machine protocol
│   ├── auth/              # Authentication system
│   ├── config/            # Configuration management
│   └── websocket/         # Real-time communication
├── frontend/              # React TypeScript frontend
├── tests/                 # Test suites
├── docs/                  # Documentation
├── scripts/               # Automation scripts
└── .github/               # GitHub workflows and templates
```

## 🧪 Testing

### Running Tests
```bash
# All tests
npm test

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Performance tests
npm run test:performance

# Test coverage
npm run test:coverage
```

### Test Requirements
- Minimum 80% code coverage for new features
- All tests must pass before merging
- Include both unit and integration tests
- Mock external dependencies appropriately

## 📝 Code Style

### JavaScript/TypeScript
- Use ESLint and Prettier configurations
- Follow airbnb-base style guide
- Use TypeScript for new frontend code
- Document complex functions with JSDoc

### Commit Messages
Follow conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat(smartcard): add Thai ID card birth date parsing`
- `fix(auth): resolve JWT token expiration issue`
- `docs(api): update authentication endpoints`

## 🔧 Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Follow coding standards
- Add/update tests
- Update documentation
- Test thoroughly

### 3. Run Quality Checks
```bash
npm run lint
npm run test
npm run build
```

### 4. Submit Pull Request
- Use the PR template
- Include detailed description
- Reference related issues
- Request appropriate reviewers

## 🏷️ Issue Guidelines

### Bug Reports
- Use the bug report template
- Include reproduction steps
- Provide system information
- Attach relevant logs

### Feature Requests
- Use the feature request template
- Explain use case and business value
- Consider implementation complexity
- Define acceptance criteria

## 🔒 Security

### Security Issues
- **DO NOT** create public issues for security vulnerabilities
- Email security concerns to: security@vendingmachine.local
- Include detailed vulnerability description
- Allow time for assessment and patching

### Security Best Practices
- Never commit secrets or credentials
- Use environment variables for configuration
- Follow OWASP security guidelines
- Validate all user inputs
- Implement proper authentication and authorization

## 🚀 Deployment

### Development Environment
```bash
docker-compose up -d
```

### Production Deployment
```bash
./scripts/deploy.sh
```

### Environment Variables
Required environment variables:
- `JWT_SECRET`: JWT signing secret
- `ENCRYPTION_KEY`: Data encryption key
- `MONGODB_URI`: Database connection string
- `REDIS_URL`: Cache connection string

## 📚 Documentation

### Code Documentation
- Document all public APIs
- Include usage examples
- Explain complex algorithms
- Document configuration options

### User Documentation
- Update relevant docs in `/docs`
- Include screenshots for UI changes
- Provide migration guides for breaking changes
- Update API documentation

## 🎯 Component-Specific Guidelines

### Smart Card Integration
- Test with actual Thai National ID cards when possible
- Implement proper error handling for card read failures
- Follow ISO 7816 standards
- Use mock mode for development

### Biometric System
- Ensure privacy compliance (no permanent storage)
- Test with diverse facial features
- Implement liveness detection
- Optimize for performance

### MDB Protocol
- Follow MDB Level 3 specifications
- Test with actual vending machines
- Implement proper timeout handling
- Support multiple vending machine brands

### Frontend Development
- Use Material-UI components
- Implement responsive design
- Follow accessibility guidelines
- Optimize for performance

## 🤝 Code Review Process

### For Reviewers
- Check code quality and style
- Verify test coverage
- Test functionality locally
- Review security implications
- Provide constructive feedback

### For Contributors
- Respond to feedback promptly
- Make requested changes
- Retest after modifications
- Update documentation if needed

## 🏆 Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

## 📞 Getting Help

- **Documentation**: Check `/docs` directory
- **Issues**: Search existing issues first
- **Discussions**: Use GitHub Discussions for questions
- **Email**: development@vendingmachine.local

## 📋 Checklist for Contributors

Before submitting a PR, ensure:
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Performance impact considered
- [ ] Breaking changes documented
- [ ] Related issues referenced

## 🎉 Thank You!

Your contributions help make the Advanced Vending Machine Age Verification System better for everyone. We appreciate your time and effort in improving this project!

---

*This contributing guide is subject to updates. Please check back regularly for the latest information.*
