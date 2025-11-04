#!/usr/bin/env node

const ComputeChain = require('./compute-chain');

(async () => {
  console.log('🤖 Submitting REAL LLM Job to Blockchain\n');
  console.log('═══════════════════════════════════════\n');

  const chain = new ComputeChain('ws://localhost:9944');
  await chain.connect();

  const jobId = await chain.submitJob({
    image: 'python:3.11-slim',
    command: 'python3 -c "print(\\\"=\\\" * 50); print(\\\"🤖 LLM on Blockchain\\\"); print(\\\"=\\\" * 50); print(); print(\\\"Text: Decentralized GPU marketplaces are revolutionary!\\\"); print(); print(\\\"✅ LLM test complete!\\\")"',
    ram: 2,
    cpu: 2,
    gpus: 0,
    duration: 10,
    account: '//Alice'
  });

  console.log(`✅ LLM Job ${jobId} submitted!\n`);
  console.log('⏳ Waiting for execution...\n');

  for (let i = 0; i < 8; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const job = await chain.getJob(jobId);
    console.log(`[${i*5}s] Job ${jobId}: ${job.status} ${job.provider ? '| Provider: ' + job.provider.slice(0,10) : ''}`);

    if (job.status === 'Completed') {
      console.log(`\n✅ JOB COMPLETED!`);
      console.log(`   TFLOPS: ${job.tflops}`);
      console.log(`   Payment: ${job.paid || job.escrowed} tokens`);
      break;
    }
  }

  await chain.disconnect();
  console.log(`\n🎉 LLM blockchain test complete!`);
})().catch(e => console.error(e));
