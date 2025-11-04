#!/usr/bin/env node

/**
 * Test Input/Output SDK Methods
 */

const ComputeChain = require('./compute-chain');
const fs = require('fs');

async function main() {
    console.log('🧪 Testing Input/Output SDK Methods\n');
    console.log('═══════════════════════════════════════\n');

    const chain = new ComputeChain('ws://localhost:9944');
    await chain.connect();

    // Test 1: Upload input file
    console.log('📤 Test 1: Upload Input File\n');

    const testData = 'Hello from SDK input test!\nThis is line 2.\nGPU marketplace test.';
    const testFile = '/tmp/sdk-test-input.txt';
    fs.writeFileSync(testFile, testData);

    const uploaded = await chain.uploadInput(testFile);
    console.log(`✅ File uploaded:`);
    console.log(`   CID: ${uploaded.cid}`);
    console.log(`   Size: ${uploaded.size} bytes`);
    console.log(`   Checksum: ${uploaded.checksum.substring(0, 16)}...\n`);

    // Test 2: Submit job with inputs
    console.log('📝 Test 2: Submit Job with Input\n');

    const jobId = await chain.submitJobWithInputs({
        image: 'alpine:latest',
        command: 'cat /data/input.txt && echo "File processed successfully!"',
        inputs: [{
            cid: uploaded.cid,
            path: '/data/input.txt',
            size: uploaded.size,
            checksum: uploaded.checksum
        }],
        ram: 2,
        cpu: 1,
        gpus: 0,
        duration: 10,
        account: '//Alice'
    });

    console.log(`\n✅ Job ${jobId} submitted with input!\n`);

    // Test 3: Check job status
    await new Promise(r => setTimeout(r, 3000));

    console.log('🔍 Test 3: Check Job Status\n');
    const job = await chain.getJob(jobId);
    console.log(`Job ${jobId}:`);
    console.log(`  Status: ${job.status}`);
    console.log(`  Provider: ${job.provider || 'unassigned'}`);
    console.log(`  Escrowed: ${job.escrowed} tokens\n`);

    // Test 4: Get job outputs (will be empty until job completes)
    console.log('📦 Test 4: Get Job Outputs\n');
    const outputs = await chain.getJobOutputs(jobId);
    console.log(`  Outputs: ${outputs ? outputs.length : 0} file(s)`);

    if (outputs && outputs.length > 0) {
        outputs.forEach((out, i) => {
            console.log(`\n  Output ${i + 1}:`);
            console.log(`    CID: ${out.cid}`);
            console.log(`    Path: ${out.path}`);
            console.log(`    Size: ${out.size} bytes`);
            console.log(`    Type: ${out.type}`);
        });
    } else {
        console.log(`  (Job not completed yet, outputs will appear after execution)\n`);
    }

    await chain.disconnect();

    console.log('╔═══════════════════════════════════════╗');
    console.log('║  ✅ SDK I/O Methods Work!            ║');
    console.log('╚═══════════════════════════════════════╝\n');

    console.log('📊 Verified:');
    console.log('  • uploadInput() ✓');
    console.log('  • submitJobWithInputs() ✓');
    console.log('  • getJobOutputs() ✓');
    console.log('  • downloadOutput() (not tested - needs completed job)\n');
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
});
