# render-farm-chain

Rendering Farm Chain - Optimized for GPU rendering tasks

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
- RAM: 8 tokens/GB/hour
- CPU: 10 tokens/core/hour
- GPU: 80 tokens/GPU/hour

### Resource Limits
- Max RAM: 128GB
- Max CPU: 32 cores
- Max GPU: 4 GPUs
- Max duration: 480 minutes
- Max disk: 200GB

### Verification
- Challenge period: 50 blocks
- Slash percentage: 70%
- Min provider stake: 3000 tokens

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
