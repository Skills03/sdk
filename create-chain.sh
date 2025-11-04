#!/bin/bash

###############################################################################
# Create Compute Chain - Deploy Your Own Proof-of-Compute Blockchain
#
# Spins up a new blockchain with:
#   - Job submission + verification
#   - Payment escrow
#   - Provider network
#   - Fraud detection
#   - Custom tokenomics
#
# Usage: ./create-chain.sh my-chain-name
###############################################################################

set -e

CHAIN_NAME=${1:-"my-compute-chain"}
TEMPLATE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "╔═══════════════════════════════════════════════════╗"
echo "║  Create Compute Chain                             ║"
echo "╚═══════════════════════════════════════════════════╝"
echo
echo "🚀 Deploying: $CHAIN_NAME"
echo "📍 Location: ./$CHAIN_NAME"
echo

# Create project directory
mkdir -p "$CHAIN_NAME"
cd "$CHAIN_NAME"

echo "📦 Copying blockchain template..."
cp -r "$TEMPLATE_DIR/pallets" .
cp -r "$TEMPLATE_DIR/runtime" .
cp -r "$TEMPLATE_DIR/node" .
cp "$TEMPLATE_DIR/Cargo.toml" .

echo "📦 Copying provider services..."
cp -r "$TEMPLATE_DIR/docker-service" .
cp -r "$TEMPLATE_DIR/provider-service-gpu" .

echo "📦 Copying frontend..."
cp -r "$TEMPLATE_DIR/compute-marketplace" ./dashboard

echo "📝 Creating configuration..."
cat > chain.config.js << 'EOF'
/**
 * Compute Chain Configuration
 *
 * Customize your blockchain's behavior
 */

module.exports = {
  // Chain identity
  chain: {
    name: "My Compute Chain",
    symbol: "COMP",
    decimals: 12,
    ss58Format: 42
  },

  // Pricing (tokens per resource per hour)
  pricing: {
    ram_gb: 10,      // 10 tokens/GB/hour
    cpu_core: 5,     // 5 tokens/core/hour
    gpu: 50,         // 50 tokens/GPU/hour
    disk_gb: 1       // 1 token/GB/hour (not yet implemented)
  },

  // Verification settings
  verification: {
    challengePeriodBlocks: 100,  // How long to wait for challenges
    minValidators: 1,            // Min validators to verify
    slashPercentage: 10,         // % of stake to slash for fraud
    rewardPercentage: 5          // % reward for catching fraud
  },

  // Resource limits
  limits: {
    maxRamGb: 128,
    maxCpuCores: 64,
    maxGpus: 8,
    maxDurationMinutes: 1440,  // 24 hours
    maxDiskGb: 1000
  },

  // Network settings
  network: {
    blockTimeMs: 6000,           // 6 second blocks
    wsPort: 9944,
    httpPort: 9933
  },

  // Provider settings
  provider: {
    minStake: 1000,              // Minimum stake to register
    autoAssign: true,            // Auto-assign jobs to providers
    allowCpuOnly: true           // Allow CPU-only providers
  }
};
EOF

echo "📝 Creating deployment script..."
cat > deploy.sh << 'DEPLOY_EOF'
#!/bin/bash
set -e

# Load configuration
CONFIG_FILE="chain.config.js"

echo "🏗️  Building blockchain..."
cargo build --release

echo "🚀 Starting services..."

# Start blockchain
nohup ./target/release/solochain-template-node \
  --dev \
  --tmp \
  --rpc-external \
  --rpc-cors all \
  --ws-port 9944 \
  --port 30333 \
  > /tmp/chain.log 2>&1 &
echo $! > /tmp/chain.pid

sleep 5

# Start Docker service
cd docker-service
nohup node index.js > /tmp/docker.log 2>&1 &
echo $! > /tmp/docker.pid
cd ..

sleep 2

# Start provider (optional)
cd provider-service-gpu
nohup node index.js > /tmp/provider.log 2>&1 &
echo $! > /tmp/provider.pid
cd ..

sleep 2

# Start dashboard
cd dashboard
nohup npm start > /tmp/dashboard.log 2>&1 &
echo $! > /tmp/dashboard.pid
cd ..

echo
echo "✅ Chain deployed!"
echo
echo "🔗 RPC endpoint:   ws://localhost:9944"
echo "🎨 Dashboard:      http://localhost:3000"
echo "📊 Docker API:     http://localhost:7682"
echo
echo "📝 Logs:"
echo "   tail -f /tmp/chain.log"
echo "   tail -f /tmp/provider.log"
echo
DEPLOY_EOF

chmod +x deploy.sh

echo "📝 Creating stop script..."
cat > stop.sh << 'STOP_EOF'
#!/bin/bash
for pid in chain docker provider dashboard; do
  [ -f "/tmp/${pid}.pid" ] && kill $(cat "/tmp/${pid}.pid") 2>/dev/null
done
rm -f /tmp/*.pid
echo "✅ Chain stopped"
STOP_EOF

chmod +x stop.sh

echo "📝 Creating README..."
cat > README.md << 'README_EOF'
# My Compute Chain

Your own proof-of-compute blockchain!

## Quick Start

```bash
# 1. Build and deploy
./deploy.sh

# 2. Open dashboard
open http://localhost:3000

# 3. Submit jobs
node ../sdk/compute-chain.js submit pytorch/pytorch "python train.py" 1
```

## Configuration

Edit `chain.config.js` to customize:
- Pricing (RAM/CPU/GPU costs)
- Verification rules
- Resource limits
- Network settings

## Architecture

```
Your Chain
    ├── Blockchain (Substrate)
    ├── Docker Service (job execution)
    ├── Provider Network (GPU/CPU resources)
    └── Dashboard (React UI)
```

## Customize

### Change Pricing
Edit `chain.config.js`:
```javascript
pricing: {
  ram_gb: 20,    // Double RAM price
  gpu: 100       // Double GPU price
}
```

Then apply:
```bash
node apply-config.js
cargo build --release
./deploy.sh
```

### Add Custom Logic
Edit `pallets/ipfs-host/src/lib.rs` to add:
- Custom verification rules
- New job types
- Payment models
- Reputation systems

### Deploy Production

1. **Get a server**
```bash
# AWS, Digital Ocean, etc.
ssh user@your-server.com
```

2. **Clone your chain**
```bash
git clone your-chain-repo
cd your-chain
```

3. **Configure**
```bash
# Edit chain.config.js with production settings
# Set up domain, SSL, etc.
```

4. **Deploy**
```bash
./deploy.sh
```

5. **Connect providers**
```bash
# Run on GPU servers
cd provider-service-gpu
export SUBSTRATE_WS=wss://your-chain.com
node index.js
```

## Examples

### AI Training Chain
```javascript
// Specialized for ML training
pricing: {
  gpu: 30,  // Cheap GPUs
  ram_gb: 5
}
verification: {
  challengePeriodBlocks: 200  // Longer for training
}
```

### Rendering Farm
```javascript
// For Blender/3D rendering
pricing: {
  cpu_core: 10,  // High CPU cost
  gpu: 100       // Premium GPUs
}
limits: {
  maxDurationMinutes: 4320  // 3 days
}
```

### Scientific Compute
```javascript
// For research workloads
provider: {
  minStake: 10000  // Higher trust requirement
}
verification: {
  minValidators: 3  // More verification
}
```

## Monitoring

```bash
# Check chain status
curl http://localhost:9944 -X POST -H "Content-Type: application/json" \
  -d '{"id":1,"jsonrpc":"2.0","method":"system_health"}'

# List providers
node ../sdk/compute-chain.js providers

# View jobs
node ../sdk/compute-chain.js status 0
```

## Troubleshooting

**Chain won't start:**
```bash
# Clean state and rebuild
rm -rf /tmp/substrate-*
cargo clean
cargo build --release
./deploy.sh
```

**No providers:**
```bash
# Check provider logs
tail -f /tmp/provider.log

# Register manually
node ../sdk/compute-chain.js register my-provider 1
```

**Jobs not executing:**
```bash
# Verify docker service
curl http://localhost:7682/health

# Check GPU availability
nvidia-smi
```

## License

MIT - Do whatever you want!
README_EOF

echo
echo "╔═══════════════════════════════════════════════════╗"
echo "║  ✅ Chain created: $CHAIN_NAME"
echo "╚═══════════════════════════════════════════════════╝"
echo
echo "Next steps:"
echo
echo "  cd $CHAIN_NAME"
echo "  ./deploy.sh"
echo
echo "📝 Customize:"
echo "  - Edit chain.config.js for pricing/rules"
echo "  - Edit pallets/ipfs-host/src/lib.rs for logic"
echo "  - Edit dashboard/ for UI"
echo
echo "🚀 Deploy production:"
echo "  - Get a server"
echo "  - Run ./deploy.sh"
echo "  - Connect providers"
echo
