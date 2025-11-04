# Consensus Module Integration Guide

## Status: ⚠️ Partially Implemented

The consensus system exists in code but is **NOT deployed** to the running blockchain. This document describes what's available and what needs to be done for full integration.

---

## What Exists (Code Only)

### 1. Compute-Weighted Consensus (Phase 10)
**File**: `/pallets/compute-consensus/src/lib.rs`

Tracks verified TFLOPS for each provider to weight validator selection:
```
ValidatorWeight = 0.7 × VerifiedTFLOPS + 0.3 × StakedTokens
```

**Storage**:
- `ComputePower<AccountId>` → u64 (milliFLOPS)

**Extrinsic**:
- `update_compute_power(provider, tflops)` - Accumulate TFLOPS

**Status**: Coded but not in runtime

---

### 2. LLM Consensus Verification (Phase 15)
**File**: `/pallets/ipfs-host/src/llm.rs`

Deterministic LLM inference with 3-provider verification:

```javascript
// Job with consensus enabled
const jobId = await sdk.submitLLMJob({
    modelCid: 'Qm...',
    inputText: 'Hello, world!',
    maxTokens: 100,
    randomSeed: 12345,          // For determinism
    enableConsensus: true        // 3-provider verification
});
```

**How It Works**:
1. Blockchain assigns 3 providers
2. All run same model + seed → identical output expected
3. Outputs hashed and compared
4. If 2/3 match → Consensus reached
5. If mismatch → Minority provider(s) slashed

**Status**: Partially coded, not exposed

---

### 3. Multi-Validator Verification (Phase 14)
**File**: `/pallets/ipfs-host/src/consensus.rs`

Redundant execution for high-value jobs:

```javascript
// Job requiring 5 validators with 3/5 consensus
const config = {
    execution_count: 5,
    required_consensus: 3,
    consensus_deadline: 100,   // blocks
};
```

**Confidence Calculation**:
- 5/5 agree → 99.9% confidence
- 3/5 agree → 60% confidence
- 4/5 agree → 80% confidence

**Status**: Coded but not in runtime

---

## SDK Methods (Ready for Future)

### Already Available

```javascript
// Get provider's verified compute power
const power = await sdk.getComputePower(providerAddress);
// Returns: { milliFLOPS, TFLOPS, message }

// Submit LLM job with consensus (when deployed)
const jobId = await sdk.submitLLMJob({
    modelCid: 'Qm...',
    inputText: 'Translate to French: Hello',
    maxTokens: 50,
    enableConsensus: true
});
```

**Current Behavior**: Methods exist but return "not deployed" messages until blockchain is updated.

---

## Integration Checklist

To fully enable consensus:

### Step 1: Runtime Integration
```rust
// In runtime/src/lib.rs

// Add pallet
impl pallet_compute_consensus::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type WeightInfo = pallet_compute_consensus::weights::SubstrateWeight<Runtime>;
}

// Add to construct_runtime!
construct_runtime!(
    pub enum Runtime {
        // ... existing pallets
        ComputeConsensus: pallet_compute_consensus,
    }
);
```

### Step 2: Recompile Blockchain
```bash
cd /path/to/blockchain
cargo build --release
```

### Step 3: Restart Validators
```bash
# Stop all validators
# Deploy new binary
# Restart with purge-chain if breaking change
```

### Step 4: Update Provider Service
Providers need to handle:
- Multiple assignments for same job
- Deterministic execution (fixed seeds)
- Output hash verification

### Step 5: Test SDK Methods
```bash
node test-consensus.js
```

---

## Why Not Deployed Yet?

1. **Complexity**: Requires multiple providers online simultaneously
2. **Cost**: 3-7x more expensive per job (multiple executions)
3. **Use Case**: Only needed for critical/high-value computations
4. **Development**: Still in testing phase

---

## Current Active System

**What Works Now** (Optimistic Verification):
- ✅ Single provider executes job
- ✅ 100-block challenge period
- ✅ Anyone can challenge via `sdk.challengeJob()`
- ✅ Fraud detection → Provider slashed
- ✅ Reputation tracking

**Good for**: 99% of jobs

**Consensus Needed for**:
- Financial computations
- LLM inference verification
- Scientific simulations
- When single provider can't be trusted

---

## Example: When to Use Consensus

### Don't Need Consensus
```javascript
// Image processing - low stakes
await sdk.submitJob({
    image: 'imagemagick',
    command: 'convert input.jpg -resize 50% output.jpg'
});
```

### Need Consensus
```javascript
// Financial model - high stakes
await sdk.submitLLMJob({
    modelCid: 'Qm...financial-model',
    inputText: 'Portfolio risk for $1M investment',
    maxTokens: 500,
    enableConsensus: true  // 3 providers must agree
});
```

---

## Future Enhancements

When consensus is deployed, you'll be able to:

1. **Query consensus status**:
   ```javascript
   const status = await sdk.getConsensusStatus(jobId);
   // { providers: 3, agreements: 2, status: 'pending' }
   ```

2. **View provider votes**:
   ```javascript
   const votes = await sdk.getConsensusVotes(jobId);
   // [ { provider: '0x...', hash: '0xabc...' }, ... ]
   ```

3. **Track compute contributions**:
   ```javascript
   const rankings = await sdk.getProvidersByComputePower();
   // Providers ranked by verified TFLOPS
   ```

---

## Development Roadmap

- [ ] Phase 10: Deploy compute-consensus pallet
- [ ] Phase 14: Multi-validator verification
- [ ] Phase 15: LLM consensus testing
- [ ] Phase 16: Governance-based consensus configuration

---

## Questions?

The consensus system is fully coded and ready for deployment when needed. The current optimistic system with challenge periods works well for most use cases.

**Want consensus enabled?** Requires blockchain recompilation and validator restart.
