#!/bin/bash

echo "Setting up Weather API..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Please install Node.js 18+"
    exit 1
fi

echo "Node.js version: $(node -v)"

# Install dependencies
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "Failed to install dependencies"
    exit 1
fi

echo "Dependencies installed"

# Create .env file
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "Please update .env with your settings"
else
    echo ".env file exists"
fi

# Create logs folder
mkdir -p logs

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "Failed to generate Prisma client"
    exit 1
fi

echo "Prisma client ready"

# Check services
echo "Checking services..."

# PostgreSQL
if command -v pg_isready &> /dev/null; then
    if pg_isready -q; then
        echo "PostgreSQL: running"
    else
        echo "PostgreSQL: not running (you'll need to start it)"
    fi
else
    echo "PostgreSQL: not found"
fi

# Redis
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "Redis: running"
    else
        echo "Redis: not running (you'll need to start it)"
    fi
else
    echo "Redis: not found"
fi

# Run linting
echo "Running linting..."
npm run lint

echo ""
echo "Setup done!"
echo ""
echo "Next steps:"
echo "1. Update .env file"
echo "2. Start PostgreSQL and Redis"
echo "3. Get OpenWeather API key"
echo "4. Run: npm run db:push"
echo "5. Run: npm run dev"
echo ""
echo "Test with: npm test" 