/**
 * AI Training Chain Configuration
 *
 * Optimized for machine learning workloads:
 * - Affordable GPU pricing
 * - Long job durations
 * - High RAM allowances
 */

module.exports = {
  chain: {
    name: "AI Training Network",
    symbol: "AITN",
    decimals: 12,
    ss58Format: 42
  },

  // Competitive ML pricing
  pricing: {
    ram_gb: 3,       // Cheap RAM for large models
    cpu_core: 2,     // Low CPU cost
    gpu: 30,         // Affordable GPUs
    disk_gb: 0.5
  },

  verification: {
    challengePeriodBlocks: 200,  // Longer for training jobs
    minValidators: 1,
    slashPercentage: 15,         // Higher penalty for fake training
    rewardPercentage: 10
  },

  limits: {
    maxRamGb: 256,              // Support large models
    maxCpuCores: 64,
    maxGpus: 8,                 // Multi-GPU training
    maxDurationMinutes: 10080,  // 7 days
    maxDiskGb: 5000             // Large datasets
  },

  network: {
    blockTimeMs: 12000,         // Slower blocks = less overhead
    wsPort: 9944,
    httpPort: 9933
  },

  provider: {
    minStake: 5000,             // Trust for expensive GPUs
    autoAssign: true,
    allowCpuOnly: false         // GPU required
  }
};
