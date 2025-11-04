/**
 * Confidential Compute Chain (TEE)
 *
 * Features:
 * - TEE verification (Intel SGX / AMD SEV)
 * - Postpaid payment (trust via hardware attestation)
 * - Premium pricing (specialized hardware)
 * - Privacy-preserving ML, encrypted data processing
 *
 * Requirements: Providers must have TEE-capable hardware
 * Use case: Medical data analysis, financial compliance, private AI training
 */

module.exports = {
    name: 'Confidential Compute Chain',
    description: 'TEE-verified compute for privacy-sensitive workloads',

    // Economic parameters - premium pricing
    pricing: {
        ram_gb: 20,        // Premium for secure enclaves
        cpu_core: 15,      // TEE overhead
        gpu: 100           // Rare TEE+GPU combinations
    },

    // Resource limits - constrained by enclave limits
    limits: {
        max_memory_gb: 64,    // EPC (Enclave Page Cache) limits
        max_cpu_cores: 16,
        max_gpu_count: 2,     // Few TEE+GPU options
        max_duration_minutes: 2880,  // 48 hours
        max_disk_gb: 100
    },

    // Verification strategy: TEE
    // Requires hardware attestation (SGX quote / SEV report)
    verification: {
        strategy: 'TEE',
        challenge_period_blocks: 50,   // Fast verification via hardware
        slash_percentage: 80           // High penalty (hard to fake TEE)
    },

    // Payment model: Postpaid
    // Trust via hardware attestation, charge after completion
    payment: {
        model: 'Postpaid'
    },

    // Staking requirements - high for specialized hardware
    staking: {
        min_provider_stake: 15000,
        tee_certification_required: true  // Metadata flag
    },

    // Custom resources
    custom_resources: [
        // EPC (Enclave Page Cache) size for SGX
        {
            id: 1,
            name: 'epc_memory',
            unit: 'MB',
            cost_per_hour: 5000,
            max_per_job: 128
        },
        // Secure memory bandwidth
        {
            id: 2,
            name: 'secure_bandwidth',
            unit: 'GB/s',
            cost_per_hour: 3000,
            max_per_job: 10
        }
    ],

    // Additional metadata
    metadata: {
        required_cpu_features: ['SGX', 'SEV'],  // Hardware requirements
        attestation_service: 'Intel IAS',       // Verification service
        privacy_guarantees: [
            'Memory encryption',
            'Code integrity',
            'Attestation',
            'Side-channel resistance'
        ]
    }
};
