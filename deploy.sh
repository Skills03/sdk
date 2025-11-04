#!/bin/bash

###############################################################################
# Compute Chain - One-Command Deployment
#
# Deploys a complete decentralized GPU marketplace:
#   - Substrate blockchain
#   - Docker execution service
#   - GPU provider service
#   - Frontend dashboard
#
# Usage: ./deploy.sh
###############################################################################

set -e

echo "╔═══════════════════════════════════════════════╗"
echo "║  Compute Chain Deployment                     ║"
echo "╚═══════════════════════════════════════════════╝"
echo

# Check dependencies
echo "🔍 Checking dependencies..."
command -v cargo >/dev/null 2>&1 || { echo "❌ Rust not found. Install from rustup.rs"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found. Install from nodejs.org"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not found. Install from docker.com"; exit 1; }
echo "✅ All dependencies found"
echo

# Build blockchain
echo "🏗️  Building blockchain (this takes ~5 minutes)..."
cargo build --release 2>&1 | grep -E "(Compiling|Finished)" | tail -5
echo "✅ Blockchain built"
echo

# Install Node dependencies
echo "📦 Installing Node.js dependencies..."
npm install --silent 2>/dev/null || true
cd docker-service && npm install --silent 2>/dev/null || true
cd ../provider-service-gpu && npm install --silent 2>/dev/null || true
cd ../compute-marketplace && npm install --silent 2>/dev/null || true
cd ..
echo "✅ Dependencies installed"
echo

# Start services
echo "🚀 Starting services..."

# 1. Blockchain
echo "   Starting blockchain on port 9944..."
nohup ./target/release/solochain-template-node --dev --tmp --rpc-external --rpc-cors all \
    > /tmp/blockchain.log 2>&1 &
echo $! > /tmp/blockchain.pid

sleep 5

# 2. Docker service
echo "   Starting docker-service on port 7682..."
cd docker-service
nohup node index.js > /tmp/docker-service.log 2>&1 &
echo $! > /tmp/docker-service.pid
cd ..

sleep 2

# 3. GPU Provider
echo "   Starting GPU provider..."
cd provider-service-gpu
nohup node index.js > /tmp/provider.log 2>&1 &
echo $! > /tmp/provider.pid
cd ..

sleep 3

# 4. Frontend
echo "   Starting frontend on port 3000..."
cd compute-marketplace
nohup npm start > /tmp/frontend.log 2>&1 &
echo $! > /tmp/frontend.pid
cd ..

echo "✅ All services started"
echo

# Print status
echo "╔═══════════════════════════════════════════════╗"
echo "║  🎉 Compute Chain is live!                    ║"
echo "╚═══════════════════════════════════════════════╝"
echo
echo "📊 Services:"
echo "   • Blockchain:    http://localhost:9944"
echo "   • Docker API:    http://localhost:7682"
echo "   • Frontend:      http://localhost:3000"
echo
echo "🔧 Management:"
echo "   • View logs:     tail -f /tmp/blockchain.log"
echo "   • Stop all:      ./sdk/stop.sh"
echo "   • Submit job:    node sdk/compute-chain.js submit ubuntu:22.04"
echo
echo "📚 Next steps:"
echo "   1. Open http://localhost:3000"
echo "   2. Connect wallet (Polkadot.js extension)"
echo "   3. Submit your first job!"
echo
echo "   Or use the SDK:"
echo "   node sdk/example.js"
echo
