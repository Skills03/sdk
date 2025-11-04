#!/usr/bin/env node

/**
 * Compute Chain SDK
 *
 * Dead-simple API for building decentralized GPU marketplaces
 *
 * Usage:
 *   const chain = new ComputeChain('ws://localhost:9944');
 *   await chain.submitJob({ image: 'pytorch', gpus: 1 });
 */

const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');

class ComputeChain {
    constructor(wsEndpoint = 'ws://localhost:9944') {
        this.wsEndpoint = wsEndpoint;
        this.api = null;
        this.keyring = new Keyring({ type: 'sr25519' });
    }

    /**
     * Connect to blockchain
     */
    async connect() {
        if (this.api) return;

        console.log(`🔗 Connecting to ${this.wsEndpoint}...`);
        const provider = new WsProvider(this.wsEndpoint);
        this.api = await ApiPromise.create({ provider });
        console.log(`✅ Connected to chain: ${await this.api.rpc.system.chain()}`);
    }

    /**
     * Submit a compute job
     *
     * @param {Object} options
     * @param {string} options.image - Docker image
     * @param {string} options.command - Command to run
     * @param {number} options.ram - RAM in GB (default: 2)
     * @param {number} options.cpu - CPU cores (default: 1)
     * @param {number} options.disk - Disk in GB (default: 10)
     * @param {number} options.duration - Minutes (default: 60)
     * @param {number} options.gpus - GPU count (default: 0)
     * @param {string} options.account - Seed phrase (default: //Alice)
     * @returns {Promise<number>} Job ID
     */
    async submitJob(options) {
        await this.connect();

        const {
            image,
            command = 'echo "Hello from compute chain"',
            ram = 2,
            cpu = 1,
            disk = 10,
            duration = 60,
            gpus = 0,
            account = '//Alice'
        } = options;

        if (!image) throw new Error('Image required');

        const signer = this.keyring.addFromUri(account);

        // Calculate cost
        const hours = Math.ceil(duration / 60);
        const cost = (ram * 10 + cpu * 5 + gpus * 50) * hours;
        console.log(`💰 Estimated cost: ${cost} tokens`);

        console.log(`📤 Submitting job...`);
        console.log(`   Image: ${image}`);
        console.log(`   Resources: ${ram}GB RAM, ${cpu} CPU, ${gpus} GPU`);

        return new Promise((resolve, reject) => {
            this.api.tx.ipfsHost.submitJob(
                image,
                command,
                ram,
                cpu,
                disk,
                duration,
                gpus
            ).signAndSend(signer, ({ status, events }) => {
                if (status.isInBlock) {
                    events.forEach(({ event }) => {
                        if (event.section === 'ipfsHost' && event.method === 'JobSubmitted') {
                            const jobId = event.data[0].toNumber();
                            console.log(`✅ Job submitted: ${jobId}`);
                            resolve(jobId);
                        }
                    });
                }
            }).catch(reject);
        });
    }

    /**
     * Register as compute provider
     */
    async registerProvider(options) {
        await this.connect();

        const {
            name = 'provider-' + Date.now(),
            ram = 16,
            cpu = 8,
            disk = 500,
            gpus = 1,
            endpointUrl = 'http://localhost:7682',
            account = '//Alice'
        } = options;

        const signer = this.keyring.addFromUri(account);

        console.log(`📝 Registering provider: ${name}`);
        console.log(`   Capacity: ${ram}GB RAM, ${cpu} CPU, ${gpus} GPU`);
        console.log(`   Endpoint: ${endpointUrl}`);

        return new Promise((resolve, reject) => {
            this.api.tx.ipfsHost.registerProvider(
                name,
                10, // capacity (legacy)
                ram,
                cpu,
                disk,
                gpus,
                endpointUrl
            ).signAndSend(signer, ({ status }) => {
                if (status.isInBlock) {
                    console.log(`✅ Provider registered`);
                    resolve();
                }
            }).catch(reject);
        });
    }

    /**
     * Get job status
     */
    async getJob(jobId) {
        await this.connect();
        const job = await this.api.query.ipfsHost.jobs(jobId);

        if (job.isNone) return null;

        const data = job.unwrap();
        return {
            id: jobId,
            status: data.status.toString(),
            submitter: data.submitter.toString(),
            provider: data.provider.isSome ? data.provider.unwrap().toString() : null,
            image: Buffer.from(data.imageCid).toString(),
            command: Buffer.from(data.command).toString(),
            escrowed: data.escrowedPayment.toString(),
            paid: data.actualPayment.isSome ? data.actualPayment.unwrap().toString() : null,
            tflops: data.measuredTflops / 100,
        };
    }

    /**
     * Get all providers
     */
    async getProviders() {
        await this.connect();
        const entries = await this.api.query.ipfsHost.providers.entries();

        return entries.map(([key, value]) => {
            const data = value.unwrap();
            return {
                address: key.args[0].toString(),
                peerId: Buffer.from(data.peerId).toString(),
                activeJobs: data.activeJobs,
                completedJobs: data.completedJobs,
                reputation: data.reputationScore,
                resources: {
                    ram: data.resources.totalMemoryGb,
                    cpu: data.resources.totalCpuCores,
                    disk: data.resources.totalDiskGb,
                    gpus: data.resources.totalGpuCount,
                    usedRam: data.resources.usedMemoryGb,
                    usedCpu: data.resources.usedCpuCores,
                    usedGpus: data.resources.usedGpuCount,
                }
            };
        });
    }

    /**
     * Disconnect
     */
    async disconnect() {
        if (this.api) await this.api.disconnect();
    }
}

module.exports = ComputeChain;

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];

    (async () => {
        const chain = new ComputeChain();

        switch (command) {
            case 'submit':
                await chain.submitJob({
                    image: args[1] || 'ubuntu:22.04',
                    command: args[2] || 'echo "Hello World"',
                    gpus: parseInt(args[3]) || 0
                });
                break;

            case 'register':
                await chain.registerProvider({
                    name: args[1],
                    gpus: parseInt(args[2]) || 1
                });
                break;

            case 'status':
                const job = await chain.getJob(parseInt(args[1]));
                console.log(JSON.stringify(job, null, 2));
                break;

            case 'providers':
                const providers = await chain.getProviders();
                console.log(`Found ${providers.length} providers:`);
                providers.forEach(p => {
                    console.log(`  ${p.address}: ${p.resources.gpus} GPU, ${p.activeJobs} active jobs`);
                });
                break;

            default:
                console.log('Usage:');
                console.log('  node compute-chain.js submit <image> <command> <gpus>');
                console.log('  node compute-chain.js register <name> <gpus>');
                console.log('  node compute-chain.js status <jobId>');
                console.log('  node compute-chain.js providers');
        }

        await chain.disconnect();
    })().catch(console.error);
}
