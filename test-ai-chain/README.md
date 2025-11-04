# test-ai-chain

AI Training Chain - Optimized for long-running GPU workloads

## Quick Start

```bash
# Start the chain (local development)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the chain
docker-compose down
```

## Configuration

This chain uses the following configuration:

### Pricing
- RAM: 5 tokens/GB/hour
- CPU: 3 tokens/core/hour
- GPU: 30 tokens/GPU/hour

### Resource Limits
- Max RAM: 256GB
- Max CPU: 32 cores
- Max GPU: 8 GPUs
- Max duration: 10080 minutes
- Max disk: 500GB

### Verification
- Challenge period: 200 blocks
- Slash percentage: 30%
- Min provider stake: 5000 tokens

## Updating Configuration

Configuration can be updated via governance:

```javascript
// Example: Update pricing
api.tx.sudo.sudo(
  api.tx.ipfsHost.updateChainConfig(
    20, // ram_cost_per_gb_hour
    10, // cpu_cost_per_core_hour
    60, // gpu_cost_per_gpu_hour
    // ... other parameters
  )
).signAndSend(sudoAccount);
```

## Architecture

This chain references the main proof-of-compute codebase at:
`/home/ubuntu/substrate-ipfs-host/substrate-ipfs-host`

Benefits:
- Bug fixes and improvements flow to all chains
- No code duplication
- Easy to upgrade

## Endpoints

- WebSocket RPC: ws://localhost:9944
- HTTP RPC: http://localhost:9933
- Docker Service: http://localhost:7682

## Next Steps

1. Customize chain-spec.json if needed
2. Deploy to production environment
3. Configure monitoring and alerting
4. Set up governance process
