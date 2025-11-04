#!/usr/bin/env node

/**
 * Apply chain.config.js to blockchain code
 *
 * Modifies Rust source to match configuration
 */

const fs = require('fs');
const path = require('path');

function loadConfig() {
    const configPath = path.join(process.cwd(), 'chain.config.js');
    if (!fs.existsSync(configPath)) {
        console.error('❌ chain.config.js not found');
        process.exit(1);
    }
    return require(configPath);
}

function applyPricing(config) {
    const palletPath = path.join(process.cwd(), 'pallets/ipfs-host/src/lib.rs');
    let code = fs.readFileSync(palletPath, 'utf8');

    console.log('💰 Applying pricing...');
    console.log(`   RAM: ${config.pricing.ram_gb} tokens/GB/hour`);
    console.log(`   CPU: ${config.pricing.cpu_core} tokens/core/hour`);
    console.log(`   GPU: ${config.pricing.gpu} tokens/GPU/hour`);

    // Replace pricing constants
    code = code.replace(
        /let ram_cost = \(memory_gb as u128\) \* \d+ \* hours;/,
        `let ram_cost = (memory_gb as u128) * ${config.pricing.ram_gb} * hours;`
    );

    code = code.replace(
        /let cpu_cost = \(cpu_cores as u128\) \* \d+ \* hours;/,
        `let cpu_cost = (cpu_cores as u128) * ${config.pricing.cpu_core} * hours;`
    );

    code = code.replace(
        /let gpu_cost = \(gpu_count as u128\) \* \d+ \* hours;/,
        `let gpu_cost = (gpu_count as u128) * ${config.pricing.gpu} * hours;`
    );

    fs.writeFileSync(palletPath, code);
    console.log('   ✓ Pricing updated');
}

function applyLimits(config) {
    const palletPath = path.join(process.cwd(), 'pallets/ipfs-host/src/lib.rs');
    let code = fs.readFileSync(palletPath, 'utf8');

    console.log('\n🔒 Applying resource limits...');
    console.log(`   Max RAM: ${config.limits.maxRamGb} GB`);
    console.log(`   Max CPU: ${config.limits.maxCpuCores} cores`);
    console.log(`   Max GPU: ${config.limits.maxGpus} GPUs`);

    // Replace validation limits
    code = code.replace(
        /ensure!\(memory_gb > 0 && memory_gb <= \d+, Error::<T>::InvalidCapacity\);/,
        `ensure!(memory_gb > 0 && memory_gb <= ${config.limits.maxRamGb}, Error::<T>::InvalidCapacity);`
    );

    code = code.replace(
        /ensure!\(cpu_cores > 0 && cpu_cores <= \d+, Error::<T>::InvalidCapacity\);/,
        `ensure!(cpu_cores > 0 && cpu_cores <= ${config.limits.maxCpuCores}, Error::<T>::InvalidCapacity);`
    );

    code = code.replace(
        /ensure!\(gpu_count <= \d+, Error::<T>::InvalidCapacity\);/,
        `ensure!(gpu_count <= ${config.limits.maxGpus}, Error::<T>::InvalidCapacity);`
    );

    code = code.replace(
        /ensure!\(duration_minutes > 0 && duration_minutes <= \d+, Error::<T>::InvalidCapacity\);/,
        `ensure!(duration_minutes > 0 && duration_minutes <= ${config.limits.maxDurationMinutes}, Error::<T>::InvalidCapacity);`
    );

    fs.writeFileSync(palletPath, code);
    console.log('   ✓ Limits updated');
}

function applyVerification(config) {
    const palletPath = path.join(process.cwd(), 'pallets/ipfs-host/src/lib.rs');
    let code = fs.readFileSync(palletPath, 'utf8');

    console.log('\n🔍 Applying verification settings...');
    console.log(`   Challenge period: ${config.verification.challengePeriodBlocks} blocks`);

    // Replace verification deadline
    code = code.replace(
        /job\.verification_deadline = Some\(current_block \+ \d+u32\.into\(\)\);/,
        `job.verification_deadline = Some(current_block + ${config.verification.challengePeriodBlocks}u32.into());`
    );

    fs.writeFileSync(palletPath, code);
    console.log('   ✓ Verification updated');
}

function applyChainSpec(config) {
    const runtimePath = path.join(process.cwd(), 'runtime/src/lib.rs');

    if (!fs.existsSync(runtimePath)) {
        console.log('\n⚠️  runtime/src/lib.rs not found, skipping chain spec');
        return;
    }

    let code = fs.readFileSync(runtimePath, 'utf8');

    console.log('\n⚛️  Applying chain spec...');
    console.log(`   Block time: ${config.network.blockTimeMs}ms`);

    code = code.replace(
        /pub const MILLI_SECS_PER_BLOCK: u64 = \d+;/,
        `pub const MILLI_SECS_PER_BLOCK: u64 = ${config.network.blockTimeMs};`
    );

    fs.writeFileSync(runtimePath, code);
    console.log('   ✓ Chain spec updated');
}

function main() {
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║  Apply Chain Configuration                        ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    const config = loadConfig();

    applyPricing(config);
    applyLimits(config);
    applyVerification(config);
    applyChainSpec(config);

    console.log('\n✅ Configuration applied!');
    console.log('\nNext: cargo build --release');
}

main();
