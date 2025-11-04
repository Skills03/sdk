/**
 * High-Security Compute Chain
 *
 * Features:
 * - Pessimistic verification (requires 3 validators)
 * - Escrow payment (funds locked upfront)
 * - Higher pricing (covers validator rewards)
 * - Strict limits
 * - High slashing (70%)
 *
 * Use case: Critical computations, financial modeling, medical research
 */

module.exports = {
    name: 'High-Security Compute Chain',
    description: 'Pessimistic verification with high confidence',

    // Economic parameters
    pricing: {
        ram_gb: 15,        // Higher cost (covers validator rewards)
        cpu_core: 10,
        gpu: 60
    },

    // Resource limits
    limits: {
        max_memory_gb: 128,
        max_cpu_cores: 32,
        max_gpu_count: 4,
        max_duration_minutes: 1440,  // 24 hours
        max_disk_gb: 200
    },

    // Verification strategy: Pessimistic
    // Requires 3 validators to verify before payment release
    verification: {
        strategy: 'Pessimistic',
        required_validators: 3,
        challenge_period_blocks: 200,  // Extra time for validators
        slash_percentage: 70           // High penalty for fraud
    },

    // Payment model: Escrow
    // Funds locked upfront, released after verification
    payment: {
        model: 'Escrow'
    },

    // Staking requirements
    staking: {
        min_provider_stake: 10000,     // High stake required
        validator_stake: 5000          // Validators must stake too
    },

    // Custom resources (optional)
    custom_resources: [
        // Example: Network bandwidth for secure data transfer
        {
            id: 1,
            name: 'secure_bandwidth',
            unit: 'Mbps',
            cost_per_hour: 2000,
            max_per_job: 1000
        }
    ]
};
