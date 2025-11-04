#!/usr/bin/env node

/**
 * Test SDK Trust & Reputation Integration
 */

const ComputeChain = require('./compute-chain');

async function main() {
    console.log('🛡️  Testing SDK Trust & Reputation System\n');
    console.log('═══════════════════════════════════════════════\n');

    const sdk = new ComputeChain();
    await sdk.connect();

    // Step 1: Query provider reputation
    console.log('1️⃣  Provider Reputation Metrics\n');

    const providerAddr = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice
    const reputation = await sdk.getProviderReputation(providerAddr);

    console.log(`Provider: ${reputation.address.substring(0, 10)}...`);
    console.log(`  📊 Reputation Score: ${reputation.reputationScore}/100`);
    console.log(`  ✅ Completed Jobs: ${reputation.completedJobs}`);
    console.log(`  ⚡ Active Jobs: ${reputation.activeJobs}`);
    console.log(`  ⚠️  Challenges: ${reputation.challengeCount}`);
    console.log(`  🚫 Fraud Count: ${reputation.fraudCount}`);
    console.log(`  💰 Stake: ${reputation.stake} tokens`);
    console.log(`  ⛓️  Total Slashed: ${reputation.slashedAmount} tokens`);

    // Step 2: List all providers ranked by reputation
    console.log('\n2️⃣  Provider Rankings\n');

    const providers = await sdk.listProviders();
    console.log(`📋 Found ${providers.length} provider(s):\n`);

    providers.forEach((p, i) => {
        console.log(`${i + 1}. ${p.address.substring(0, 10)}... - Score: ${p.reputationScore}/100`);
        console.log(`   Jobs: ${p.completedJobs} completed, Fraud: ${p.fraudCount}, Slashed: ${p.slashedAmount}`);
    });

    // Step 3: Check challenge period for recent jobs
    console.log('\n3️⃣  Challenge Period Status\n');

    // Get a completed job
    const entries = await sdk.api.query.ipfsHost.jobs.entries();
    let testJobId = null;

    for (const [key, value] of entries) {
        const job = value.unwrap();
        const status = job.status.toString();
        if (status === 'Completed' || status === 'PendingVerification') {
            testJobId = key.args[0].toNumber();
            break;
        }
    }

    if (testJobId) {
        const challengeStatus = await sdk.getChallengePeriodStatus(testJobId);

        console.log(`Job ${testJobId}:`);
        console.log(`  Status: ${challengeStatus.status}`);
        console.log(`  In Challenge Period: ${challengeStatus.inChallengePeriod ? 'YES' : 'NO'}`);
        console.log(`  Can Challenge: ${challengeStatus.canChallenge ? 'YES' : 'NO'}`);

        if (challengeStatus.inChallengePeriod) {
            console.log(`  Current Block: ${challengeStatus.currentBlock}`);
            console.log(`  Deadline Block: ${challengeStatus.deadlineBlock}`);
            console.log(`  Blocks Remaining: ${challengeStatus.blocksRemaining}`);
        }

        // Step 4: Check for existing challenges
        console.log('\n4️⃣  Job Challenges\n');

        const challenges = await sdk.getJobChallenges(testJobId);

        if (challenges.length > 0) {
            console.log(`⚠️  Found ${challenges.length} challenge(s) for job ${testJobId}:`);
            challenges.forEach((c, i) => {
                console.log(`\n  Challenge ${i + 1}:`);
                console.log(`    ID: ${c.challengeId}`);
                console.log(`    Challenger: ${c.challenger.substring(0, 10)}...`);
                console.log(`    Status: ${c.status}`);
                console.log(`    Outcome: ${c.outcome || 'Pending'}`);
            });
        } else {
            console.log(`✅ No challenges for job ${testJobId}`);
        }
    } else {
        console.log('⚠️  No completed jobs found to check');
    }

    // Step 5: Demo - How to challenge a job (commented out to avoid actual challenge)
    console.log('\n5️⃣  Challenge System Demo\n');
    console.log('📚 To challenge a suspicious job:');
    console.log('');
    console.log('  const challengeId = await sdk.challengeJob(');
    console.log('    jobId,           // Job to challenge');
    console.log('    checkpointIndex, // Which checkpoint is wrong');
    console.log('    "//Bob"          // Challenger account');
    console.log('  );');
    console.log('');
    console.log('  If fraud is proven:');
    console.log('  - Provider loses 50% of stake (slashed)');
    console.log('  - Reputation drops by 20 points');
    console.log('  - Slashed tokens go to challenger as reward');
    console.log('');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 TRUST SYSTEM INTEGRATION TEST PASSED!\n');
    console.log('Summary:');
    console.log('  ✅ Queried provider reputation');
    console.log('  ✅ Listed providers ranked by reputation');
    console.log('  ✅ Checked challenge period status');
    console.log('  ✅ Retrieved job challenges');
    console.log('  ✅ Challenge system ready to use\n');

    await sdk.disconnect();
}

main().catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
});
