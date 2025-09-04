#!/bin/bash

# Advanced Vending Machine Age Verification System Setup Script
# This script sets up the development environment and installs dependencies

set -e

echo "🚀 Setting up Advanced Vending Machine Age Verification System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install system dependencies
echo "📦 Installing system dependencies..."

# Detect OS and install appropriate packages
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "🐧 Detected Linux system"
    sudo apt-get update
    sudo apt-get install -y pcscd libpcsclite-dev libpcsclite1 libusb-dev
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "🍎 Detected macOS system"
    if command -v brew &> /dev/null; then
        brew install pcsc-lite
    else
        echo "⚠️  Homebrew not found. Please install PC/SC manually."
    fi
    
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    echo "🪟 Detected Windows system"
    echo "⚠️  Please install PC/SC manually on Windows"
    
else
    echo "⚠️  Unknown OS. Please install PC/SC manually."
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create necessary directories
echo "📁 Creating project directories..."
mkdir -p logs
mkdir -p models
mkdir -p public
mkdir -p ssl

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating environment configuration..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration"
fi

# Set up Python virtual environment (optional)
if command -v python3 &> /dev/null; then
    echo "🐍 Setting up Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    
    if [ -f requirements.txt ]; then
        pip install -r requirements.txt
    fi
    deactivate
fi

# Create log files
echo "📝 Creating log files..."
touch logs/app.log
touch logs/error.log
touch logs/audit.log

# Set permissions
echo "🔐 Setting file permissions..."
chmod +x scripts/*.sh
chmod 755 logs/

echo "✅ Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Connect your smart card reader"
echo "3. Run 'npm start' to start the system"
echo "4. Visit http://localhost:3000/health to check system status"
echo ""
echo "For more information, see README.md"
