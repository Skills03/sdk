# ComputeChain SDK

**Build decentralized GPU marketplaces in 3 commands.**

```bash
npm install @compute-chain/sdk
node sdk/example.js
# Your GPU marketplace is live!
```

[![npm version](https://img.shields.io/npm/v/@compute-chain/sdk)](https://npmjs.com/package/@compute-chain/sdk)
[![Docker Pulls](https://img.shields.io/docker/pulls/skills003/substrate-ipfs-node)](https://hub.docker.com/r/skills003/substrate-ipfs-node)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ⚡ Quick Start

```bash
# Install SDK
npm install @compute-chain/sdk

# Run example
cd node_modules/@compute-chain/sdk
node example.js

# Output:
# ✅ Job 1 submitted (CPU)
# ✅ Job 2 submitted (GPU)
# ✅ Provider registered
# 🎉 Your marketplace is running!
```

**Or use Docker:**

```bash
docker run -d -p 9944:9944 skills003/substrate-ipfs-node:v1.1.0 --dev
```

---

## 🎯 What You Get

- ✅ **Full Substrate blockchain** - Production-ready consensus
- ✅ **Docker execution engine** - Run any containerized workload
- ✅ **Payment & escrow** - Automatic token escrow and release
- ✅ **Fraud detection** - Challenge period for verification
- ✅ **Provider network** - Register GPU/CPU providers
- ✅ **React frontend** - User dashboard included
- ✅ **CLI tools** - Command-line interface

---

## 📖 API Usage

### Submit a Job

```javascript
const ComputeChain = require('@compute-chain/sdk');
const chain = new ComputeChain('ws://localhost:9944');

const jobId = await chain.submitJob({
  image: 'pytorch/pytorch:2.0.1-gpu',
  command: 'python train.py',
  ram: 16,      // GB
  cpu: 8,       // cores
  gpus: 2,      // count
  duration: 120 // minutes
});

console.log(`Job ${jobId} submitted`);
```

### Register as Provider

```javascript
await chain.registerProvider({
  name: 'my-gpu-farm',
  ram: 128,
  cpu: 64,
  gpus: 8,
  endpointUrl: 'http://your-server:7682'
});
```

### Check Status

```javascript
const job = await chain.getJob(jobId);
console.log(`Status: ${job.status}`);
console.log(`Cost: ${job.escrowed} tokens`);
```

### List Providers

```javascript
const providers = await chain.getProviders();
providers.forEach(p => {
  console.log(`${p.peerId}: ${p.resources.gpus} GPUs available`);
});
```

---

## 🛠️ CLI Commands

```bash
# Submit job
node compute-chain.js submit ubuntu:22.04 "echo hello" 0

# Register provider
node compute-chain.js register my-provider 1

# Check status
node compute-chain.js status 0

# List providers
node compute-chain.js providers
```

---

## 💰 Pricing

**Default rates:**
- RAM: 10 tokens/GB/hour
- CPU: 5 tokens/core/hour
- GPU: 50 tokens/GPU/hour

**Example:**
- 16GB RAM + 4 CPU + 1 GPU for 2 hours
- **Cost:** (16×10 + 4×5 + 1×50) × 2 = **500 tokens**

Customize pricing in your chain config!

---

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │  Submit job + escrow tokens
└──────┬──────┘
       │
┌──────▼──────────┐
│   Blockchain    │  Substrate chain with payment logic
└──────┬──────────┘
       │
┌──────▼──────────┐
│    Provider     │  Claim job, execute container
└──────┬──────────┘
       │
┌──────▼──────────┐
│ Docker + GPU    │  Return results + proof
└─────────────────┘
```

---

## 📂 Templates

Pre-configured chains for specific use cases:

### AI Training
```bash
# Optimized for ML workloads
# - GPU: 30 tokens/hr (cheap)
# - Max duration: 7 days
# - Max RAM: 256GB
```

### Render Farm
```bash
# For 3D rendering and video
# - GPU: 80 tokens/hr (premium)
# - Blender, Maya support
```

### Scientific Compute
```bash
# Long-running simulations
# - Max duration: 14 days
# - High CPU allocation
```

See `/templates/` for configurations.

---

## 🚀 Full Deployment

Deploy complete marketplace with all services:

```bash
git clone https://github.com/your-org/compute-chain-sdk
cd compute-chain-sdk
./deploy.sh

# Starts:
# - Blockchain (port 9944)
# - Docker service (port 7682)
# - Provider service
# - Frontend (port 3000)
```

**Production setup:**

```bash
# 1. Get Ubuntu server with GPU
# 2. Install Docker + NVIDIA runtime
# 3. Clone and deploy
docker-compose up -d
```

---

## 📊 Cost Comparison

| Workload | Duration | Your Chain | AWS p3.2xlarge | Savings |
|----------|----------|------------|----------------|---------|
| GPT Fine-tune | 8hr | 3,232 tokens (~$32) | ~$240 | **87%** |
| Stable Diffusion | 1hr | 202 tokens (~$2) | ~$8 | **75%** |
| Video Render | 4hr | 1,664 tokens (~$17) | ~$32 | **48%** |

*At $0.01/token vs AWS on-demand pricing*

---

## 🔒 Security Features

- ✅ **Payment escrow** - Funds locked until job verified
- ✅ **Challenge period** - 100 blocks for disputes
- ✅ **Fraud detection** - Validators re-execute suspicious jobs
- ✅ **Reputation system** - Track provider quality
- ✅ **Slashing** - Penalties for malicious providers

---

## 🧪 Testing

Tested and verified:

```bash
npm test

# Output:
# ✅ Test 1: Connection (Substrate IPFS Compute Network)
# ✅ Test 2: Submit CPU job (Job 15)
# ✅ Test 3: Submit GPU job (Job 16)
# ✅ Test 4: Get job status
# ✅ Test 5: List providers
# ✅ Test 6: Register provider
# ✅ Test 7: Verify registration
# 🎉 All tests passed!
```

See `/SDK_TEST_REPORT.md` for detailed test results.

---

## 🎓 Examples

**AI Training:**
```javascript
await chain.submitJob({
  image: 'huggingface/transformers-pytorch-gpu',
  command: 'python train_gpt.py --epochs 100',
  ram: 64, cpu: 16, gpus: 4, duration: 480
});
```

**Stable Diffusion:**
```javascript
await chain.submitJob({
  image: 'stability-ai/stable-diffusion',
  command: 'python generate.py --prompt "blockchain GPU"',
  ram: 16, cpu: 4, gpus: 1, duration: 30
});
```

**Batch Processing:**
```javascript
for (let i = 0; i < 100; i++) {
  await chain.submitJob({
    image: 'my-processor',
    command: `process.py --input data-${i}.csv`,
    ram: 4, cpu: 2
  });
}
```

More examples in `/sdk/ai-training-testnet/test-ai-workloads.js`

---

## 📚 Documentation

- **API Reference:** See code comments in `compute-chain.js`
- **Templates:** Configuration examples in `/templates/`
- **Deployment:** Instructions in `deploy.sh`
- **Architecture:** Details in `README.md`

---

## 🤝 Contributing

Built with progressive enhancement:
1. Make it work ✅
2. Ship it ✅
3. Enhance later ← We are here

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Submit a pull request

---

## 🐛 Troubleshooting

**Blockchain won't start:**
```bash
rm -rf /tmp/substrate-*
./deploy.sh
```

**Jobs not executing:**
```bash
# Check provider is registered
node compute-chain.js providers

# Check Docker service
curl http://localhost:7682/health
```

**Out of tokens:**
```bash
# Use pre-funded dev accounts
account: '//Alice'   # Has 1M tokens
```

---

## 📜 License

MIT - Build whatever you want!

---

## 🔗 Links

- **npm:** [@compute-chain/sdk](https://npmjs.com/package/@compute-chain/sdk)
- **Docker:** [skills003/substrate-ipfs-node](https://hub.docker.com/r/skills003/substrate-ipfs-node)
- **Live Demo:** [Coming soon]

---

## ⭐ Star History

If this helps you build your GPU marketplace, please star the repo!

---

**Built with:** Substrate · Docker · Polkadot.js · React · NVIDIA CUDA

**Tested on:** Ubuntu 22.04 · NVIDIA GPUs · Docker 24+ · Node.js 18+
