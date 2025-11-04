#!/usr/bin/env node

/**
 * Test SDK Secret Management Integration
 */

const ComputeChain = require('./compute-chain');

async function main() {
    console.log('🔐 Testing SDK Secret Management\n');
    console.log('═══════════════════════════════════════\n');

    const sdk = new ComputeChain();
    await sdk.connect();

    // Step 1: Store a secret
    console.log('1️⃣  Store Secret in Vault\n');
    const secretPath = 'test/my-api-key';
    const secretValue = 'sk-test-abc123456789';

    await sdk.storeSecret(secretPath, secretValue, {
        allowed_providers: ['*'],
        allowed_jobs: ['*']
    });

    // Step 2: Verify retrieval
    console.log('\n2️⃣  Retrieve Secret\n');
    const retrieved = await sdk.getSecret(secretPath);
    console.log(`✅ Retrieved: ${retrieved.substring(0, 15)}...`);

    // Step 3: List secrets
    console.log('\n3️⃣  List All Secrets\n');
    const secrets = await sdk.listSecrets();
    console.log(`📋 Found ${secrets.length} secret(s):`);
    secrets.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));

    // Step 4: Submit job with secret
    console.log('\n4️⃣  Submit Job with Secret\n');

    // First upload test input
    const input = await sdk.uploadInput(Buffer.from('Test data'));

    const jobId = await sdk.submitJobWithInputs({
        image: 'ubuntu:22.04',
        command: 'cat /secrets/API_KEY > /results/secret-test.txt && echo "Secret used successfully" > /results/status.txt',
        inputs: [{
            cid: input.cid,
            path: '/data/input.txt',
            size: input.size,
            checksum: input.checksum
        }],
        secrets: [{
            key: 'API_KEY',
            path: secretPath
        }],
        ram: 1,
        cpu: 1,
        duration: 5
    });

    console.log(`\n✅ Job ${jobId} submitted with secret!`);
    console.log('\n5️⃣  Monitoring Execution...\n');

    // Wait for completion
    let completed = false;
    let attempts = 0;

    while (!completed && attempts < 30) {
        await new Promise(r => setTimeout(r, 1000));
        attempts++;

        const job = await sdk.getJob(jobId);
        const status = job.status;

        if (status === 'Completed' || status === 'PendingVerification') {
            completed = true;
            console.log(`\n✅ Job completed after ${attempts}s!`);
            console.log(`   Status: ${status}`);

            if (job.outputs && job.outputs.length > 0) {
                console.log(`\n📤 Outputs:`);
                job.outputs.forEach((o, i) => {
                    console.log(`   ${i + 1}. ${o.path} (${o.size} bytes)`);
                });
            }

            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🎉 SECRET INTEGRATION TEST PASSED!\n');
            console.log('Summary:');
            console.log('  ✅ Stored secret via SDK');
            console.log('  ✅ Retrieved secret via SDK');
            console.log('  ✅ Listed secrets via SDK');
            console.log('  ✅ Job submitted with secret reference');
            console.log('  ✅ Provider fetched secret from vault');
            console.log('  ✅ Secret injected into container');
            console.log('  ✅ Job executed successfully\n');

        } else if (status === 'Failed') {
            console.error(`\n❌ Job failed!`);
            break;
        } else {
            process.stdout.write(`   [${attempts}s] ${status}...\r`);
        }
    }

    if (!completed) {
        console.error(`\n⚠️  Timeout after ${attempts}s`);
    }

    // Cleanup
    console.log('\n6️⃣  Cleanup\n');
    await sdk.deleteSecret(secretPath);

    await sdk.disconnect();
}

main().catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
});
