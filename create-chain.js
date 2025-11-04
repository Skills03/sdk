#!/usr/bin/env node

/**
 * Proof-of-Compute Chain Generator
 *
 * Creates custom compute marketplace chains with configurable:
 * - Pricing (RAM/CPU/GPU costs)
 * - Resource limits
 * - Verification parameters
 * - Economic parameters
 *
 * Usage: ./create-chain.js <chain-name> --template <template-name>
 * Example: ./create-chain.js my-ai-chain --template ai-training
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Template configurations
const TEMPLATES = {
    'default': {
        name: 'Default Compute Chain',
        description: 'Balanced pricing for general compute workloads',
        config: {
            ramCostPerGbHour: 10,
            cpuCostPerCoreHour: 5,
            gpuCostPerGpuHour: 50,
            maxMemoryGb: 64,
            maxCpuCores: 16,
            maxGpuCount: 8,
            maxDurationMinutes: 1440,
            maxDiskGb: 100,
            challengePeriodBlocks: 100,
            slashPercentage: 50,
            minProviderStake: 1000,
        }
    },
    'ai-training': {
        name: 'AI Training Chain',
        description: 'Optimized for long-running GPU workloads',
        config: {
            ramCostPerGbHour: 5,          // Cheap RAM for large models
            cpuCostPerCoreHour: 3,         // Cheap CPU (not critical)
            gpuCostPerGpuHour: 30,         // Affordable GPU for long training
            maxMemoryGb: 256,              // High RAM for large models
            maxCpuCores: 32,               // Many cores
            maxGpuCount: 8,                // Multi-GPU support
            maxDurationMinutes: 10080,     // 7 days max
            maxDiskGb: 500,                // Large datasets
            challengePeriodBlocks: 200,    // Longer verification (training is slow)
            slashPercentage: 30,           // Lower slashing (verification is hard)
            minProviderStake: 5000,        // Higher stake (expensive hardware)
        }
    },
    'render-farm': {
        name: 'Rendering Farm Chain',
        description: 'Optimized for GPU rendering tasks',
        config: {
            ramCostPerGbHour: 8,           // Moderate RAM
            cpuCostPerCoreHour: 10,        // CPU important for some renders
            gpuCostPerGpuHour: 80,         // Premium GPU (rendering is valuable)
            maxMemoryGb: 128,              // High RAM for scene data
            maxCpuCores: 32,               // Many cores
            maxGpuCount: 4,                // Multi-GPU rendering
            maxDurationMinutes: 480,       // 8 hours max per task
            maxDiskGb: 200,                // Moderate storage
            challengePeriodBlocks: 50,     // Fast verification (renders are deterministic)
            slashPercentage: 70,           // High slashing (easy to verify)
            minProviderStake: 3000,        // High stake (quality important)
        }
    },
    'batch-jobs': {
        name: 'Batch Processing Chain',
        description: 'High-volume CPU tasks with strict limits',
        config: {
            ramCostPerGbHour: 15,          // Premium RAM
            cpuCostPerCoreHour: 8,         // Main resource
            gpuCostPerGpuHour: 100,        // Expensive (discouraged)
            maxMemoryGb: 32,               // Lower limit
            maxCpuCores: 64,               // Many cores for parallel
            maxGpuCount: 2,                // Limited GPU
            maxDurationMinutes: 120,       // Short jobs only
            maxDiskGb: 50,                 // Small disk
            challengePeriodBlocks: 30,     // Fast turnaround
            slashPercentage: 60,           // Moderate slashing
            minProviderStake: 500,         // Low barrier to entry
        }
    },
};

function printUsage() {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Proof-of-Compute Chain Generator                              ║
╚════════════════════════════════════════════════════════════════╝

Usage:
  npx create-chain <chain-name> [options]

Options:
  --template <name>    Use a preset template (default: default)
  --custom             Create with custom config (interactive)
  --list               List available templates

Templates:
${Object.entries(TEMPLATES).map(([key, t]) =>
    `  ${key.padEnd(15)} - ${t.description}`
).join('\n')}

Examples:
  npx create-chain my-ai-chain --template ai-training
  npx create-chain render-farm --template render-farm
  npx create-chain custom-chain --custom
`);
}

function generateGenesisConfig(chainName, template) {
    const config = TEMPLATES[template].config;

    // Generate genesis JSON with custom chain config
    const genesis = {
        "name": chainName,
        "id": chainName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        "chainType": "Development",
        "bootNodes": [],
        "telemetryEndpoints": null,
        "protocolId": null,
        "properties": {
            "tokenDecimals": 12,
            "tokenSymbol": "COMPUTE"
        },
        "codeSubstitutes": {},
        "genesis": {
            "runtimeGenesis": {
                "code": "0x", // Will be filled by build
                "patch": {
                    "balances": {
                        "balances": [
                            ["5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", "1000000000000000000"],
                            ["5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", "1000000000000000000"]
                        ]
                    },
                    "sudo": {
                        "key": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
                    },
                    "ipfsHost": {
                        "chainConfigStorage": [config]
                    }
                }
            }
        }
    };

    return genesis;
}

function createChain(chainName, templateName) {
    console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
    console.log(`║  Creating: ${chainName.padEnd(50)} ║`);
    console.log(`║  Template: ${templateName.padEnd(49)} ║`);
    console.log(`╚════════════════════════════════════════════════════════════════╝\n`);

    const template = TEMPLATES[templateName];
    const outputDir = path.join(process.cwd(), chainName);

    // Check if directory exists
    if (fs.existsSync(outputDir)) {
        console.error(`❌ Error: Directory ${chainName} already exists`);
        process.exit(1);
    }

    // Create directory
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✅ Created directory: ${outputDir}`);

    // Copy blockchain source (reference, not modify)
    const sourceDir = path.join(__dirname, '..');
    console.log(`\n📦 Blockchain will reference: ${sourceDir}`);
    console.log(`   (No code copying - uses same codebase)`);

    // Generate genesis config
    console.log(`\n⚙️  Generating genesis configuration...`);
    const genesis = generateGenesisConfig(chainName, templateName);
    const genesisPath = path.join(outputDir, 'chain-spec.json');
    fs.writeFileSync(genesisPath, JSON.stringify(genesis, null, 2));
    console.log(`✅ Genesis config: ${genesisPath}`);

    // Create config summary
    console.log(`\n💰 Chain Configuration:`);
    console.log(`   Pricing:`);
    console.log(`      RAM: ${template.config.ramCostPerGbHour} tokens/GB/hour`);
    console.log(`      CPU: ${template.config.cpuCostPerCoreHour} tokens/core/hour`);
    console.log(`      GPU: ${template.config.gpuCostPerGpuHour} tokens/GPU/hour`);
    console.log(`   Limits:`);
    console.log(`      Max RAM: ${template.config.maxMemoryGb}GB`);
    console.log(`      Max CPU: ${template.config.maxCpuCores} cores`);
    console.log(`      Max GPU: ${template.config.maxGpuCount} GPUs`);
    console.log(`      Max duration: ${template.config.maxDurationMinutes} minutes`);

    // Create docker-compose for local dev
    console.log(`\n🐳 Generating docker-compose.yml...`);
    const dockerCompose = `version: '3.8'

services:
  blockchain:
    build:
      context: ${sourceDir}
      dockerfile: Dockerfile
    command: |
      --dev
      --rpc-external
      --rpc-cors=all
      --chain=/data/chain-spec.json
    volumes:
      - ./chain-spec.json:/data/chain-spec.json:ro
      - chain-data:/data
    ports:
      - "9944:9944"  # WebSocket RPC
      - "9933:9933"  # HTTP RPC
      - "30333:30333" # P2P
    restart: unless-stopped

  docker-service:
    build:
      context: ${sourceDir}/docker-service
    environment:
      - PORT=7682
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    ports:
      - "7682:7682"
    restart: unless-stopped
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

  provider-service:
    build:
      context: ${sourceDir}/provider-service-gpu
    environment:
      - SUBSTRATE_WS=ws://blockchain:9944
      - DOCKER_SERVICE=http://docker-service:7682
      - PROVIDER_SEED=//Alice
    depends_on:
      - blockchain
      - docker-service
    restart: unless-stopped

volumes:
  chain-data:
`;

    fs.writeFileSync(path.join(outputDir, 'docker-compose.yml'), dockerCompose);
    console.log(`✅ Docker Compose: ${path.join(outputDir, 'docker-compose.yml')}`);

    // Create README
    const readme = `# ${chainName}

${template.name} - ${template.description}

## Quick Start

\`\`\`bash
# Start the chain (local development)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the chain
docker-compose down
\`\`\`

## Configuration

This chain uses the following configuration:

### Pricing
- RAM: ${template.config.ramCostPerGbHour} tokens/GB/hour
- CPU: ${template.config.cpuCostPerCoreHour} tokens/core/hour
- GPU: ${template.config.gpuCostPerGpuHour} tokens/GPU/hour

### Resource Limits
- Max RAM: ${template.config.maxMemoryGb}GB
- Max CPU: ${template.config.maxCpuCores} cores
- Max GPU: ${template.config.maxGpuCount} GPUs
- Max duration: ${template.config.maxDurationMinutes} minutes
- Max disk: ${template.config.maxDiskGb}GB

### Verification
- Challenge period: ${template.config.challengePeriodBlocks} blocks
- Slash percentage: ${template.config.slashPercentage}%
- Min provider stake: ${template.config.minProviderStake} tokens

## Updating Configuration

Configuration can be updated via governance:

\`\`\`javascript
// Example: Update pricing
api.tx.sudo.sudo(
  api.tx.ipfsHost.updateChainConfig(
    20, // ram_cost_per_gb_hour
    10, // cpu_cost_per_core_hour
    60, // gpu_cost_per_gpu_hour
    // ... other parameters
  )
).signAndSend(sudoAccount);
\`\`\`

## Architecture

This chain references the main proof-of-compute codebase at:
\`${sourceDir}\`

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
`;

    fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
    console.log(`✅ README: ${path.join(outputDir, 'README.md')}`);

    console.log(`\n✅ Chain created successfully!`);
    console.log(`\n📋 Next steps:`);
    console.log(`   cd ${chainName}`);
    console.log(`   docker-compose up -d`);
    console.log(`   # Wait for blockchain to start, then:`);
    console.log(`   # Open https://polkadot.js.org/apps/#/explorer`);
    console.log(`   # Connect to ws://localhost:9944\n`);
}

// Main
const args = process.argv.slice(2);

if (args.includes('--list')) {
    console.log('\n📋 Available templates:\n');
    Object.entries(TEMPLATES).forEach(([key, t]) => {
        console.log(`  ${key}`);
        console.log(`    ${t.name}`);
        console.log(`    ${t.description}\n`);
    });
    process.exit(0);
}

if (args.includes('--help') || args.length === 0) {
    printUsage();
    process.exit(0);
}

const chainName = args[0];
const templateIndex = args.indexOf('--template');
const templateName = templateIndex !== -1 ? args[templateIndex + 1] : 'default';

if (!TEMPLATES[templateName]) {
    console.error(`❌ Unknown template: ${templateName}`);
    console.error(`   Available: ${Object.keys(TEMPLATES).join(', ')}`);
    process.exit(1);
}

createChain(chainName, templateName);
