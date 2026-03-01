#!/bin/bash

# Setup script for YeahIWroteThis-AI

# 1. Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# 2. Setup Python environment
echo "Setting up Python environment..."
if [ ! -d "backend/venv" ]; then
    python3 -m venv backend/venv
fi

# 3. Install Python dependencies
echo "Installing Python dependencies..."
source backend/venv/bin/activate
pip install -r backend/requirements.txt

echo "Setup complete! Use 'npm run dev:all' to start both frontend and backend."
