#!/usr/bin/env node

/**
 * AI Training Chain - Real-World AI Workload Examples
 *
 * Demonstrates:
 * 1. LLM Fine-tuning
 * 2. Stable Diffusion Image Generation
 * 3. Computer Vision Training
 * 4. Reinforcement Learning
 */

const ComputeChain = require('../compute-chain');

async function main() {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║  AI Training Chain - Workload Examples                ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    const chain = new ComputeChain('ws://localhost:9944');

    // ========================================================================
    // Example 1: LLM Fine-Tuning (GPT-style model)
    // ========================================================================
    console.log('═══ Example 1: LLM Fine-Tuning ═══\n');

    const llmJob = await chain.submitJob({
        image: 'huggingface/transformers-pytorch-gpu:latest',
        command: `python3 -c "
import torch
from transformers import GPT2LMHeadModel, GPT2Tokenizer, Trainer, TrainingArguments
print('GPU Available:', torch.cuda.is_available())
print('GPU Name:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None')
# Fine-tune GPT-2 on custom dataset
# tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
# model = GPT2LMHeadModel.from_pretrained('gpt2').cuda()
print('LLM Fine-tuning setup complete')
"`,
        ram: 64,        // Large models need RAM
        cpu: 8,         // Preprocessing
        gpus: 1,        // Training acceleration
        duration: 480,  // 8 hours
        account: '//Alice'
    });

    console.log(`✅ LLM Job submitted: ${llmJob}`);
    console.log(`   Estimated cost: ${calculateCost(64, 8, 1, 8)} tokens\n`);

    // ========================================================================
    // Example 2: Stable Diffusion Image Generation
    // ========================================================================
    console.log('═══ Example 2: Stable Diffusion Generation ═══\n');

    const diffusionJob = await chain.submitJob({
        image: 'pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime',
        command: `python3 -c "
import torch
print('PyTorch version:', torch.__version__)
print('CUDA available:', torch.cuda.is_available())
if torch.cuda.is_available():
    print('CUDA version:', torch.version.cuda)
    print('GPU:', torch.cuda.get_device_name(0))
# Stable Diffusion inference would go here
# from diffusers import StableDiffusionPipeline
# pipe = StableDiffusionPipeline.from_pretrained('stabilityai/stable-diffusion-2').to('cuda')
# image = pipe('A blockchain-powered AI marketplace').images[0]
print('Stable Diffusion ready')
"`,
        ram: 32,
        cpu: 4,
        gpus: 1,
        duration: 60,
        account: '//Bob'
    });

    console.log(`✅ Diffusion Job submitted: ${diffusionJob}`);
    console.log(`   Estimated cost: ${calculateCost(32, 4, 1, 1)} tokens\n`);

    // ========================================================================
    // Example 3: Computer Vision Training (YOLO)
    // ========================================================================
    console.log('═══ Example 3: Computer Vision (YOLO) ═══\n');

    const cvJob = await chain.submitJob({
        image: 'ultralytics/yolov5:latest-gpu',
        command: `python3 -c "
import torch
print('Training YOLOv5 object detection model')
print('GPU:', torch.cuda.is_available())
# Train on custom dataset
# python train.py --data custom.yaml --weights yolov5s.pt --epochs 100
print('CV training initialized')
"`,
        ram: 16,
        cpu: 8,
        gpus: 1,
        duration: 240,  // 4 hours
        account: '//Charlie'
    });

    console.log(`✅ CV Job submitted: ${cvJob}`);
    console.log(`   Estimated cost: ${calculateCost(16, 8, 1, 4)} tokens\n`);

    // ========================================================================
    // Example 4: Multi-GPU Distributed Training
    // ========================================================================
    console.log('═══ Example 4: Multi-GPU Distributed Training ═══\n');

    const distributedJob = await chain.submitJob({
        image: 'pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime',
        command: `python3 -c "
import torch
import torch.distributed as dist
print('Multi-GPU Training Setup')
print('GPUs available:', torch.cuda.device_count())
# Distributed training with DDP
# torch.distributed.init_process_group('nccl')
# model = torch.nn.parallel.DistributedDataParallel(model)
print('Distributed training ready')
"`,
        ram: 128,       // Large batch sizes
        cpu: 16,
        gpus: 4,        // 4x GPU training
        duration: 1440, // 24 hours
        account: '//Alice'
    });

    console.log(`✅ Distributed Job submitted: ${distributedJob}`);
    console.log(`   Estimated cost: ${calculateCost(128, 16, 4, 24)} tokens\n`);

    // ========================================================================
    // Example 5: Reinforcement Learning (Gym)
    // ========================================================================
    console.log('═══ Example 5: Reinforcement Learning ═══\n');

    const rlJob = await chain.submitJob({
        image: 'pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime',
        command: `python3 -c "
import torch
print('Reinforcement Learning Environment')
print('GPU:', torch.cuda.is_available())
# Train RL agent
# import gym
# env = gym.make('CartPole-v1')
# Train PPO/DQN agent
print('RL training initialized')
"`,
        ram: 8,
        cpu: 4,
        gpus: 1,
        duration: 120,
        account: '//Bob'
    });

    console.log(`✅ RL Job submitted: ${rlJob}`);
    console.log(`   Estimated cost: ${calculateCost(8, 4, 1, 2)} tokens\n`);

    // ========================================================================
    // Show job status
    // ========================================================================
    await new Promise(r => setTimeout(r, 5000));

    console.log('\n═══ Checking Job Status ═══\n');

    for (const jobId of [llmJob, diffusionJob, cvJob]) {
        const job = await chain.getJob(jobId);
        if (job) {
            console.log(`Job ${jobId}:`);
            console.log(`  Status: ${job.status}`);
            console.log(`  Provider: ${job.provider || 'unassigned'}`);
            console.log(`  Cost: ${job.escrowed} tokens`);
            console.log('');
        }
    }

    // ========================================================================
    // Show pricing comparison
    // ========================================================================
    console.log('═══ AI Training Chain Pricing ═══\n');
    console.log('Compared to traditional cloud providers:\n');

    const scenarios = [
        { name: 'Small Model (1 GPU)', ram: 16, cpu: 4, gpus: 1, hours: 4 },
        { name: 'Medium Model (1 GPU)', ram: 64, cpu: 8, gpus: 1, hours: 8 },
        { name: 'Large Model (4 GPU)', ram: 128, cpu: 16, gpus: 4, hours: 24 },
        { name: 'Week-long Training', ram: 64, cpu: 8, gpus: 2, hours: 168 },
    ];

    scenarios.forEach(s => {
        const cost = calculateCost(s.ram, s.cpu, s.gpus, s.hours);
        console.log(`${s.name}:`);
        console.log(`  Resources: ${s.ram}GB RAM, ${s.cpu} CPU, ${s.gpus} GPU`);
        console.log(`  Duration: ${s.hours} hours`);
        console.log(`  Cost: ${cost} tokens ($${(cost * 0.01).toFixed(2)} @ $0.01/token)`);
        console.log('');
    });

    await chain.disconnect();
    console.log('✅ Examples complete!\n');
}

/**
 * Calculate job cost based on AI Training Chain pricing
 */
function calculateCost(ramGB, cpuCores, gpuCount, hours) {
    const RAM_COST = 5;   // tokens/GB/hour
    const CPU_COST = 3;   // tokens/core/hour
    const GPU_COST = 30;  // tokens/GPU/hour

    const ramCost = ramGB * RAM_COST * hours;
    const cpuCost = cpuCores * CPU_COST * hours;
    const gpuCost = gpuCount * GPU_COST * hours;

    return ramCost + cpuCost + gpuCost;
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
