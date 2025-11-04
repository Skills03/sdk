#!/usr/bin/env node

/**
 * Compute Chain SDK Example
 *
 * Shows how to:
 * 1. Submit jobs
 * 2. Register providers
 * 3. Check status
 */

const ComputeChain = require('./compute-chain');

async function main() {
    console.log('🚀 Compute Chain SDK Example\n');

    // Initialize SDK
    const chain = new ComputeChain('ws://localhost:9944');

    // 1. Submit a simple job
    console.log('═══ Example 1: Submit CPU Job ═══');
    const jobId1 = await chain.submitJob({
        image: 'ubuntu:22.04',
        command: 'echo "Hello from Compute Chain"',
        ram: 2,
        cpu: 1,
        gpus: 0,
        duration: 60,
        account: '//Alice'  // Submitter
    });

    // 2. Submit GPU training job
    console.log('\n═══ Example 2: Submit GPU Job ═══');
    const jobId2 = await chain.submitJob({
        image: 'pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime',
        command: 'python3 -c "import torch; print(f\'GPU: {torch.cuda.is_available()}\')"',
        ram: 16,
        cpu: 4,
        gpus: 1,
        duration: 120,
        account: '//Alice'
    });

    // 3. Register as provider
    console.log('\n═══ Example 3: Register Provider ═══');
    await chain.registerProvider({
        name: 'my-gpu-provider',
        ram: 32,
        cpu: 16,
        disk: 1000,
        gpus: 2,
        account: '//Alice'  // Provider
    });

    // 4. Check job status
    console.log('\n═══ Example 4: Check Job Status ═══');
    await new Promise(r => setTimeout(r, 5000));  // Wait for processing

    const job = await chain.getJob(jobId1);
    console.log(`Job ${jobId1}:`);
    console.log(`  Status: ${job.status}`);
    console.log(`  Provider: ${job.provider || 'unassigned'}`);
    console.log(`  Escrowed: ${job.escrowed} tokens`);

    // 5. List all providers
    console.log('\n═══ Example 5: List Providers ═══');
    const providers = await chain.getProviders();
    console.log(`Found ${providers.length} providers:`);
    providers.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.peerId}`);
        console.log(`     GPUs: ${p.resources.usedGpus}/${p.resources.gpus} used`);
        console.log(`     Jobs: ${p.activeJobs} active, ${p.completedJobs} completed`);
        console.log(`     Reputation: ${p.reputation}/100`);
    });

    // 6. Advanced: Custom pricing
    console.log('\n═══ Example 6: Calculate Cost ═══');
    const hours = 2;
    const ram = 8, cpu = 4, gpus = 1;
    const cost = (ram * 10 + cpu * 5 + gpus * 50) * hours;
    console.log(`Cost for ${hours}hr job:`);
    console.log(`  ${ram}GB RAM: ${ram * 10 * hours} tokens`);
    console.log(`  ${cpu} CPU: ${cpu * 5 * hours} tokens`);
    console.log(`  ${gpus} GPU: ${gpus * 50 * hours} tokens`);
    console.log(`  Total: ${cost} tokens`);

    await chain.disconnect();
    console.log('\n✅ Example complete!');
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
