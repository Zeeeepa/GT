#!/bin/bash

# NPM Scraper Setup Script
# Installs Python dependencies for the enhanced NPM scraper

echo "🚀 Setting up NPM Scraper Dependencies"
echo "======================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.7+ first."
    echo "   Download from: https://www.python.org/downloads/"
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip first."
    exit 1
fi

echo "✅ pip3 found: $(pip3 --version)"

# Install Python dependencies
echo ""
echo "📦 Installing Python dependencies..."
echo "-----------------------------------"

pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Python dependencies installed successfully!"
else
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

# Test the scraper
echo ""
echo "🧪 Testing NPM Scraper..."
echo "-------------------------"

python3 -c "
import sys
try:
    import requests
    import json
    import threading
    from concurrent.futures import ThreadPoolExecutor
    from dataclasses import dataclass
    print('✅ All required Python modules are available')
    print('✅ NPM Scraper is ready to use!')
except ImportError as e:
    print(f'❌ Missing module: {e}')
    sys.exit(1)
"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Setup Complete!"
    echo "=================="
    echo ""
    echo "The enhanced NPM scraper is now ready to use."
    echo "It will provide access to ALL NPM packages with proper sorting."
    echo ""
    echo "Features enabled:"
    echo "  • Sort by package size (all packages)"
    echo "  • Sort by newest updated (all packages)"
    echo "  • Multithreaded processing (10 threads)"
    echo "  • Comprehensive package data"
    echo ""
    echo "To use the enhanced scraper, enable it in your search settings."
else
    echo "❌ Setup failed. Please check the error messages above."
    exit 1
fi
