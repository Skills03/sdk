# Compute Chain SDK

Build your own decentralized GPU marketplace in **3 commands**.

## 🚀 Quick Start

```bash
# 1. Deploy blockchain + services (5 minutes)
./sdk/deploy.sh

# 2. Run example
node sdk/example.js

# 3. Open dashboard
open http://localhost:3000
```

That's it! You now have a running compute marketplace.

---

## 📖 SDK Usage

### Submit a Job

```javascript
const ComputeChain = require('./sdk/compute-chain');

const chain = new ComputeChain('ws://localhost:9944');

const jobId = await chain.submitJob({
  image: 'pytorch/pytorch:2.0.1',
  command: 'python train.py',
  ram: 16,      // GB
  cpu: 8,       // cores
  gpus: 2,      // count
  duration: 120 // minutes
});

console.log(`Job ${jobId} submitted`);
```

### Register Provider

```javascript
await chain.registerProvider({
  name: 'my-gpu-farm',
  ram: 128,
  cpu: 64,
  gpus: 8
});
```

### Check Status

```javascript
const job = await chain.getJob(jobId);
console.log(`Status: ${job.status}`);
console.log(`Cost: ${job.escrowed} tokens`);
console.log(`TFLOPS: ${job.tflops}`);
```

### List Providers

```javascript
const providers = await chain.getProviders();
providers.forEach(p => {
  console.log(`${p.peerId}: ${p.resources.gpus} GPUs`);
});
```

---

## 💰 Pricing

```
RAM:  10 tokens/GB/hour
CPU:   5 tokens/core/hour
GPU:  50 tokens/GPU/hour
```

**Example:**
- 16GB RAM + 4 CPU + 1 GPU for 2 hours
- Cost: (16×10 + 4×5 + 1×50) × 2 = **500 tokens**

---

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │  Submit job + payment
└──────┬──────┘
       │
┌──────▼──────────┐
│   Blockchain    │  Escrow + verification
└──────┬──────────┘
       │
┌──────▼──────────┐
│    Provider     │  Execute job
└──────┬──────────┘
       │
┌──────▼──────────┐
│ Docker+GPU      │  Run container
└─────────────────┘
```

---

## 🔧 CLI Commands

```bash
# Submit job
node sdk/compute-chain.js submit ubuntu:22.04 "ls -la" 0

# Register provider
node sdk/compute-chain.js register my-provider 1

# Check job status
node sdk/compute-chain.js status 0

# List providers
node sdk/compute-chain.js providers
```

---

## 📂 Project Structure

```
/
├── sdk/
│   ├── compute-chain.js   # Main SDK (250 lines)
│   ├── example.js         # Usage examples
│   ├── deploy.sh          # One-command deployment
│   └── README.md          # This file
│
├── pallets/ipfs-host/     # Blockchain logic
├── docker-service/        # Container execution
├── provider-service-gpu/  # Provider daemon
└── compute-marketplace/   # React frontend
```

---

## 🚢 Deployment Options

### Local Development
```bash
./sdk/deploy.sh
```

### Production Server
```bash
# Set environment variables
export WS_ENDPOINT=wss://your-chain.com
export DOCKER_SERVICE=https://docker.your-chain.com

./sdk/deploy.sh
```

### Docker Compose
```yaml
version: '3'
services:
  blockchain:
    build: .
    ports: ["9944:9944"]

  docker-service:
    build: ./docker-service
    ports: ["7682:7682"]
    volumes: ["/var/run/docker.sock:/var/run/docker.sock"]

  provider:
    build: ./provider-service-gpu
    environment:
      SUBSTRATE_WS: ws://blockchain:9944
```

---

## 🎓 Examples

### AI Training Job
```javascript
await chain.submitJob({
  image: 'pytorch/pytorch:2.0.1',
  command: 'python train_gpt.py --epochs 100',
  ram: 64,
  cpu: 16,
  gpus: 4,
  duration: 480  // 8 hours
});
```

### Stable Diffusion
```javascript
await chain.submitJob({
  image: 'stability-ai/stable-diffusion',
  command: 'python generate.py --prompt "AI marketplace"',
  ram: 16,
  cpu: 4,
  gpus: 1,
  duration: 30
});
```

### Batch Processing
```javascript
for (let i = 0; i < 100; i++) {
  await chain.submitJob({
    image: 'my-batch-processor',
    command: `process.py --input data-${i}.csv`,
    ram: 4,
    cpu: 2
  });
}
```

---

## 🔒 Security

- ✅ Payment escrow (funds locked until verified)
- ✅ Challenge period (100 blocks for disputes)
- ✅ Fraud detection (validators re-execute)
- ✅ Reputation system (track provider quality)

---

## 🛠️ Customization

### Change Pricing
Edit `pallets/ipfs-host/src/lib.rs` line 738:
```rust
let ram_cost = (memory_gb as u128) * 10 * hours;  // Change 10
let cpu_cost = (cpu_cores as u128) * 5 * hours;   // Change 5
let gpu_cost = (gpu_count as u128) * 50 * hours;  // Change 50
```

### Add New Features
```bash
# Extend blockchain
code pallets/ipfs-host/src/lib.rs

# Rebuild
cargo build --release

# Restart
./sdk/deploy.sh
```

---

## 📊 Monitoring

```bash
# View logs
tail -f /tmp/blockchain.log
tail -f /tmp/provider.log
tail -f /tmp/docker-service.log

# Check status
curl http://localhost:7682/health
curl http://localhost:9944  # RPC endpoint
```

---

## 🐛 Troubleshooting

**Blockchain won't start:**
```bash
rm -rf /tmp/substrate-*
./sdk/deploy.sh
```

**Jobs not executing:**
```bash
# Check provider is registered
node sdk/compute-chain.js providers

# Check Docker service
curl http://localhost:7682/health
```

**Out of tokens:**
```bash
# Use dev accounts (pre-funded)
account: '//Alice'   # Has 1M tokens
account: '//Bob'
account: '//Charlie'
```

---

## 🤝 Contributing

Built with progressive enhancement:
1. Make it work
2. Ship it
3. Enhance later

Add features by:
1. Updating blockchain pallet
2. Extending SDK API
3. Testing with example
4. Committing

---

## 📜 License

MIT - Build whatever you want!

---

## 🔗 Links

- GitHub: [your-repo]
- Docs: [your-docs]
- Discord: [your-community]

**Built with:** Substrate, Docker, React, Node.js
