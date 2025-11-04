/**
 * Development & Testing Chain
 *
 * Features:
 * - No verification (instant payment)
 * - Escrow payment (still protects providers)
 * - Very cheap pricing
 * - High resource limits
 * - Low slashing
 *
 * ⚠️ WARNING: NO FRAUD PROTECTION
 * Use ONLY for development, testing, or trusted networks
 */

module.exports = {
    name: 'Development & Testing Chain',
    description: 'No verification, instant payment - for development only',

    // Economic parameters - very cheap
    pricing: {
        ram_gb: 1,
        cpu_core: 1,
        gpu: 5
    },

    // Resource limits - generous for testing
    limits: {
        max_memory_gb: 256,
        max_cpu_cores: 64,
        max_gpu_count: 8,
        max_duration_minutes: 10080,  // 7 days
        max_disk_gb: 1000
    },

    // Verification strategy: NoVerification
    // ⚠️ Trust providers completely, instant payment
    verification: {
        strategy: 'NoVerification',
        challenge_period_blocks: 0,    // No waiting
        slash_percentage: 10           // Low penalty (mostly for testing)
    },

    // Payment model: Escrow
    // Still locks funds to protect providers
    payment: {
        model: 'Escrow'
    },

    // Staking requirements - minimal
    staking: {
        min_provider_stake: 100        // Low barrier to entry for testing
    },

    // Custom resources (optional)
    custom_resources: []
};
