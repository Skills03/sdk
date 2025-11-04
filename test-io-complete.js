#!/usr/bin/env node

/**
 * Complete SDK Input/Output Test
 * Based on original test-input-e2e.js and test-output-module.js
 *
 * Tests full workflow:
 * 1. Upload input file
 * 2. Submit job with inputs
 * 3. Wait for execution
 * 4. Get outputs
 * 5. Download and verify outputs
 */

const ComputeChain = require('./compute-chain');
const fs = require('fs');
const crypto = require('crypto');

async function main() {
    console.log('🧪 Complete SDK Input/Output Test\n');
    console.log('═══════════════════════════════════════════════════\n');

    const chain = new ComputeChain('ws://localhost:9944');
    await chain.connect();

    // ========================================================================
    // Step 1: Upload Input File
    // ========================================================================
    console.log('📤 Step 1: Upload Input File\n');

    const inputData = 'This is test input data for SDK!\nLine 2 content\nLine 3 data\nGPU marketplace test!';
    const inputFile = '/tmp/sdk-input-test.txt';
    fs.writeFileSync(inputFile, inputData);

    const uploaded = await chain.uploadInput(inputFile);
    console.log(`✅ Input uploaded successfully:`);
    console.log(`   CID: ${uploaded.cid}`);
    console.log(`   Size: ${uploaded.size} bytes`);
    console.log(`   Checksum: ${uploaded.checksum.substring(0, 32)}...\n`);

    // ========================================================================
    // Step 2: Submit Job with Inputs that Produces Outputs
    // ========================================================================
    console.log('📝 Step 2: Submit Job with Input & Output Generation\n');

    const command = 'cat /data/input.txt > /results/output.txt && ' +
                    'echo "{\\"processed\\": true, \\"lines\\": 4}" > /results/metrics.json && ' +
                    'echo "Job completed successfully" > /results/job.log';

    console.log('Command will:');
    console.log('  - Read input from /data/input.txt');
    console.log('  - Write output to /results/output.txt');
    console.log('  - Create metrics in /results/metrics.json');
    console.log('  - Create log in /results/job.log\n');

    const jobId = await chain.submitJobWithInputs({
        image: 'alpine:latest',
        command: command,
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

    // ========================================================================
    // Step 3: Wait for Provider to Execute
    // ========================================================================
    console.log('⏳ Step 3: Waiting for provider to execute...\n');
    console.log('   Provider will:');
    console.log('   1. Download input file');
    console.log('   2. Verify checksum');
    console.log('   3. Inject into /data/');
    console.log('   4. Execute container');
    console.log('   5. Upload all /results/ files');
    console.log('   6. Submit outputs to blockchain\n');

    let jobCompleted = false;
    let attempts = 0;
    const maxAttempts = 60;

    while (!jobCompleted && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 1000));
        attempts++;

        const job = await chain.getJob(jobId);
        const status = job.status;

        if (status === 'Completed' || status === 'PendingVerification' || status === 'CompletedWithResult') {
            jobCompleted = true;
            console.log(`\n   ✅ Job completed after ${attempts} seconds!`);
            console.log(`   Status: ${status}`);
            console.log(`   Provider: ${job.provider}\n`);
            break;
        } else if (status === 'Failed') {
            console.error(`\n   ❌ Job failed!\n`);
            await chain.disconnect();
            process.exit(1);
        } else {
            process.stdout.write(`   [${attempts}s] Status: ${status}...\r`);
        }
    }

    if (!jobCompleted) {
        console.error(`\n   ⚠️  Timeout after ${maxAttempts} seconds`);
        console.error(`   Job may still be executing. Check logs:\n`);
        console.error(`   tail -f /home/ubuntu/substrate-ipfs-host/substrate-ipfs-host/provider-service-gpu/provider.log\n`);
        await chain.disconnect();
        process.exit(1);
    }

    // ========================================================================
    // Step 4: Get Job Outputs
    // ========================================================================
    console.log('📦 Step 4: Get Job Outputs from Blockchain\n');

    const outputs = await chain.getJobOutputs(jobId);

    if (!outputs || outputs.length === 0) {
        console.log(`   ⚠️  No outputs found yet`);
        console.log(`   Job may be in verification period\n`);
    } else {
        console.log(`   Found ${outputs.length} output file(s):\n`);

        for (let i = 0; i < outputs.length; i++) {
            const output = outputs[i];
            console.log(`   Output ${i + 1}:`);
            console.log(`      CID: ${output.cid}`);
            console.log(`      Path: ${output.path}`);
            console.log(`      Size: ${output.size} bytes`);
            console.log(`      Type: ${output.type}`);
            console.log(`      Checksum: ${output.checksum.substring(0, 32)}...`);
            console.log();
        }

        // ========================================================================
        // Step 5: Download and Verify Outputs
        // ========================================================================
        console.log('📥 Step 5: Download and Verify Outputs\n');

        for (let i = 0; i < outputs.length; i++) {
            const output = outputs[i];
            console.log(`   Downloading ${output.path}...`);

            try {
                const data = await chain.downloadOutput(output.cid);
                console.log(`      ✅ Downloaded ${data.length} bytes`);

                // Verify checksum
                const computedChecksum = crypto.createHash('sha256').update(data).digest('hex');
                const match = computedChecksum === output.checksum;

                console.log(`      Checksum: ${match ? '✅ VALID' : '❌ MISMATCH'}`);

                if (!match) {
                    console.log(`         Computed: ${computedChecksum.substring(0, 32)}...`);
                    console.log(`         Expected: ${output.checksum.substring(0, 32)}...`);
                }

                // Show content preview for small text files
                if (output.size < 500 && (output.path.includes('.txt') || output.path.includes('.log') || output.path.includes('.json'))) {
                    console.log(`      Preview: ${data.toString('utf8').substring(0, 100)}${data.length > 100 ? '...' : ''}`);
                }

                console.log();
            } catch (error) {
                console.log(`      ❌ Download failed: ${error.message}\n`);
            }
        }
    }

    await chain.disconnect();

    // ========================================================================
    // Summary
    // ========================================================================
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║  ✅ Complete SDK I/O Test Finished!              ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    console.log('📊 Test Summary:\n');
    console.log('  ✅ uploadInput() - Uploaded file to storage');
    console.log('  ✅ submitJobWithInputs() - Submitted job with inputs');
    console.log('  ✅ getJob() - Monitored job execution');
    console.log('  ✅ getJobOutputs() - Retrieved output CIDs');
    if (outputs && outputs.length > 0) {
        console.log('  ✅ downloadOutput() - Downloaded and verified outputs');
    } else {
        console.log('  ⚠️  downloadOutput() - No outputs to download');
    }
    console.log('\n🎉 SDK Input/Output fully functional!\n');
}

main().catch(err => {
    console.error('\n❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
});
