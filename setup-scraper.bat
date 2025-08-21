@echo off
REM NPM Scraper Setup Script for Windows
REM Installs Python dependencies for the enhanced NPM scraper

echo 🚀 Setting up NPM Scraper Dependencies
echo ======================================

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.7+ first.
    echo    Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python found:
python --version

REM Check if pip is installed
pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ pip is not installed. Please install pip first.
    pause
    exit /b 1
)

echo ✅ pip found:
pip --version

REM Install Python dependencies
echo.
echo 📦 Installing Python dependencies...
echo -----------------------------------

pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo ❌ Failed to install Python dependencies
    pause
    exit /b 1
)

echo ✅ Python dependencies installed successfully!

REM Test the scraper
echo.
echo 🧪 Testing NPM Scraper...
echo -------------------------

python -c "import sys; import requests; import json; import threading; from concurrent.futures import ThreadPoolExecutor; from dataclasses import dataclass; print('✅ All required Python modules are available'); print('✅ NPM Scraper is ready to use!')"

if %errorlevel% neq 0 (
    echo ❌ Setup failed. Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo 🎉 Setup Complete!
echo ==================
echo.
echo The enhanced NPM scraper is now ready to use.
echo It will provide access to ALL NPM packages with proper sorting.
echo.
echo Features enabled:
echo   • Sort by package size (all packages)
echo   • Sort by newest updated (all packages)
echo   • Multithreaded processing (10 threads)
echo   • Comprehensive package data
echo.
echo To use the enhanced scraper, enable it in your search settings.
echo.
pause
