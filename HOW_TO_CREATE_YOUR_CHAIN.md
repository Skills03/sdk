# 🚀 How to Create Your Own Compute Chain

## Quick Start (3 Commands)

```bash
# 1. Create your chain
./sdk/create-chain.js my-chain --template ai-training

# 2. Start it
cd my-chain
docker-compose up -d

# 3. Use it
node ../compute-chain.js submit pytorch/pytorch "python train.py" 1
```

---

## 📋 Available Templates

### **1. AI Training** (Recommended for ML/AI)
```bash
./sdk/create-chain.js ai-marketplace --template ai-training
```
- **GPU:** 30 tokens/hr (40% cheaper)
- **RAM:** 5 tokens/GB/hr (cheap for large models)
- **Max Duration:** 7 days (long training jobs)
- **Max RAM:** 256GB (huge models)
- **Best for:** LLM fine-tuning, Stable Diffusion, computer vision

### **2. Render Farm** (For 3D/Video)
```bash
./sdk/create-chain.js render-farm --template render-farm
```
- **GPU:** 80 tokens/hr (premium)
- **CPU:** 10 tokens/core/hr
- **Max Duration:** 8 hours
- **Best for:** Blender, Maya, video rendering

### **3. Batch Jobs** (High-volume CPU)
```bash
./sdk/create-chain.js batch-processor --template batch-jobs
```
- **CPU:** 8 tokens/core/hr
- **Max Duration:** 2 hours (fast turnaround)
- **Best for:** Data processing, simulations, testing

### **4. Default** (Balanced)
```bash
./sdk/create-chain.js general-compute --template default
```
- Balanced pricing for mixed workloads

---

## 🎯 Real-World Examples

### Example 1: AI Training Marketplace

```bash
# Create chain optimized for ML
./sdk/create-chain.js ml-compute --template ai-training
cd ml-compute

# Start services
docker-compose up -d

# Wait 30s for blockchain to start
sleep 30

# Submit LLM fine-tuning job
node ../compute-chain.js submit \
  huggingface/transformers-pytorch-gpu:latest \
  "python train_gpt.py --epochs 100" \
  2  # 2 GPUs

# Check status
node ../compute-chain.js status 0
```

**Cost Calculation:**
- Resources: 64GB RAM, 8 CPU, 2 GPU
- Duration: 24 hours
- Cost: (64×5 + 8×3 + 2×30) × 24 = **9,216 tokens**

### Example 2: Rendering Farm

```bash
# Create rendering chain
./sdk/create-chain.js blender-farm --template render-farm
cd blender-farm
docker-compose up -d

# Submit Blender render job
node ../compute-chain.js submit \
  blender:latest \
  "blender -b scene.blend -o //output -F PNG -x 1 -f 1" \
  1  # 1 GPU
```

**Cost:** (32×8 + 4×10 + 1×80) × 2 = **792 tokens** for 2hr render

### Example 3: Scientific Compute

```bash
# Create custom chain
./sdk/create-chain.js physics-sim --template default
cd physics-sim

# Edit chain-spec.json for longer jobs
nano chain-spec.json
# Change: "maxDurationMinutes": 20160  (14 days)

# Start chain
docker-compose up -d
```

---

## 🛠️ Customization

### Change Pricing

Edit `chain-spec.json`:

```json
{
  "ipfsHost": {
    "chainConfigStorage": [{
      "ramCostPerGbHour": 3,     // ← Change RAM price
      "cpuCostPerCoreHour": 2,   // ← Change CPU price
      "gpuCostPerGpuHour": 20,   // ← Change GPU price
      "maxDurationMinutes": 10080 // ← 7 days
    }]
  }
}
```

### Enable Longer Jobs

```json
{
  "maxDurationMinutes": 20160,  // 14 days
  "challengePeriodBlocks": 500  // Longer verification
}
```

### Adjust Security

```json
{
  "slashPercentage": 80,        // Higher penalties
  "minProviderStake": 10000     // More trust required
}
```

---

## 📊 Cost Comparison

| Workload | Resources | Duration | Your Chain | AWS | Savings |
|----------|-----------|----------|------------|-----|---------|
| **GPT-2 Fine-tune** | 64GB, 8CPU, 1GPU | 8hr | 3,232 tokens | ~$240 | 87% |
| **Stable Diffusion** | 32GB, 4CPU, 1GPU | 1hr | 202 tokens | ~$8 | 75% |
| **Video Render** | 16GB, 8CPU, 1GPU | 4hr | 1,664 tokens | ~$32 | 48% |
| **Data Processing** | 8GB, 16CPU, 0GPU | 2hr | 148 tokens | ~$4 | 63% |

*At $0.01/token*

---

## 🌍 Production Deployment

### Single Server

```bash
# 1. Get Ubuntu 22.04 server with GPU
# AWS p3.2xlarge, Azure NC6, etc.

# 2. Clone your chain
git clone https://github.com/your-org/ml-compute
cd ml-compute

# 3. Install Docker + NVIDIA runtime
curl -fsSL https://get.docker.com | sh
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt update && sudo apt install -y nvidia-docker2
sudo systemctl restart docker

# 4. Deploy
docker-compose up -d

# 5. Monitor
docker-compose logs -f
```

### Multi-Provider Network

```bash
# On main blockchain server
docker-compose up -d blockchain

# On each GPU provider server
export SUBSTRATE_WS=wss://your-blockchain.com:9944
export PROVIDER_SEED="unique seed phrase"
docker-compose up -d docker-service provider-service
```

---

## 🧪 Testing Your Chain

```bash
# Test job submission
node ../compute-chain.js submit ubuntu:22.04 "echo test" 0

# Check providers
node ../compute-chain.js providers

# Monitor job
watch -n1 'node ../compute-chain.js status 0'

# Check pricing
node -e "
const cost = (ram, cpu, gpu, hours) => {
  return (ram*5 + cpu*3 + gpu*30) * hours;
};
console.log('8hr GPU job:', cost(64, 8, 1, 8), 'tokens');
"
```

---

## 🔧 Advanced Features

### Multi-Region Deployment

```bash
# Deploy blockchain in US
aws ec2 run-instances --region us-east-1 ...

# Add provider in Europe
aws ec2 run-instances --region eu-west-1 ...

# Add provider in Asia
aws ec2 run-instances --region ap-southeast-1 ...
```

### Custom Pricing via Governance

```javascript
const { ApiPromise, Keyring } = require('@polkadot/api');

const api = await ApiPromise.create({ provider });
const keyring = new Keyring({ type: 'sr25519' });
const sudo = keyring.addFromUri('//Alice');

// Update pricing
await api.tx.sudo.sudo(
  api.tx.ipfsHost.updateChainConfig(
    3,  // ram_cost_per_gb_hour
    2,  // cpu_cost_per_core_hour
    20, // gpu_cost_per_gpu_hour (cheaper!)
    256, 32, 8, 10080, 500, 200, 30, 5000
  )
).signAndSend(sudo);
```

### Auto-Scaling

```javascript
// Monitor job queue
const jobs = await api.query.ipfsHost.jobs.entries();
const pending = jobs.filter(([_, j]) => j.status === 'Pending');

if (pending.length > 10) {
  // Launch additional provider instance
  await launchEC2Instance();
}
```

---

## 💡 Use Cases

### AI/ML Training
- LLM fine-tuning (GPT, BERT, T5)
- Stable Diffusion training
- Computer vision (YOLO, ResNet)
- Reinforcement learning

### Rendering
- Blender 3D rendering
- Video processing (FFmpeg)
- Game asset rendering
- CAD rendering

### Scientific Computing
- Physics simulations
- Climate modeling
- Drug discovery
- Genome analysis

### Data Processing
- ETL pipelines
- Log analysis
- Image processing
- Video transcoding

---

## 🆘 Troubleshooting

**Chain won't start:**
```bash
# Check logs
docker-compose logs blockchain

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**No providers:**
```bash
# Check provider service
docker-compose logs provider-service

# Verify GPU
nvidia-smi

# Check registration
node ../compute-chain.js providers
```

**Jobs not executing:**
```bash
# Check docker service
curl http://localhost:7682/health

# Verify provider resources
node ../compute-chain.js providers
```

**Container conflicts:**
```bash
# Clean old containers
docker rm -f $(docker ps -aq --filter "name=job-")
```

---

## 📚 Next Steps

1. **Create your chain** - Pick a template
2. **Test locally** - Submit test jobs
3. **Deploy to server** - Production setup
4. **Add providers** - Build your network
5. **Monitor** - Set up Grafana dashboards
6. **Scale** - Add more regions

---

## 🔗 Resources

- **SDK Documentation:** `sdk/README.md`
- **Example Scripts:** `sdk/example.js`, `sdk/test-ai-workloads.js`
- **Templates:** `sdk/templates/`
- **Polkadot.js Apps:** https://polkadot.js.org/apps/

---

## 📞 Support

Questions? Found a bug?
- **GitHub Issues:** https://github.com/your-org/substrate-ipfs-host/issues
- **Docs:** Full documentation in `/docs`
- **Examples:** Real-world examples in `/sdk`

---

**Built with:** Substrate, Docker, NVIDIA CUDA, Polkadot.js
**License:** MIT - Build whatever you want!
