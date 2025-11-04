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
    constructor(wsEndpoint = 'ws://localhost:9944', options = {}) {
        this.wsEndpoint = wsEndpoint;
        this.api = null;
        this.keyring = new Keyring({ type: 'sr25519' });

        // Vault service configuration for secrets
        this.vaultUrl = options.vaultUrl || 'http://localhost:8300';
        this.vaultToken = options.vaultToken || 'dev-token';
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
     * Upload input file to storage service
     *
     * @param {string|Buffer} file - File path or Buffer
     * @param {string} storageUrl - Storage service URL (default: http://localhost:7683)
     * @returns {Promise<{cid: string, size: number, checksum: string}>}
     */
    async uploadInput(file, storageUrl = 'http://localhost:7683') {
        const FormData = require('form-data');
        const axios = require('axios');
        const fs = require('fs');

        const form = new FormData();

        if (typeof file === 'string') {
            form.append('file', fs.createReadStream(file));
        } else if (Buffer.isBuffer(file)) {
            // Buffer needs filename for multipart form-data
            form.append('file', file, { filename: 'upload.dat' });
        } else {
            throw new Error('File must be path string or Buffer');
        }

        const response = await axios.post(`${storageUrl}/upload`, form, {
            headers: form.getHeaders()
        });

        console.log(`📤 Uploaded: CID=${response.data.cid}, size=${response.data.size}`);
        return response.data;
    }

    /**
     * Submit job with input files
     *
     * @param {Object} options
     * @param {string} options.image - Docker image
     * @param {string} options.command - Command to run
     * @param {Array} options.inputs - Input files [{cid, path, size, checksum}]
     * @param {number} options.ram - RAM in GB (default: 2)
     * @param {number} options.cpu - CPU cores (default: 1)
     * @param {number} options.disk - Disk in GB (default: 10)
     * @param {number} options.duration - Minutes (default: 60)
     * @param {number} options.gpus - GPU count (default: 0)
     * @param {string} options.account - Seed phrase (default: //Alice)
     * @param {string} options.parameters - JSON parameters (optional)
     * @returns {Promise<number>} Job ID
     */
    async submitJobWithInputs(options) {
        await this.connect();

        const {
            image,
            command = 'echo "Hello from compute chain"',
            inputs = [],
            secrets = [],
            ram = 2,
            cpu = 1,
            disk = 10,
            duration = 60,
            gpus = 0,
            account = '//Alice',
            parameters = '{}'
        } = options;

        if (!image) throw new Error('Image required');
        if (!inputs || inputs.length === 0) throw new Error('Inputs required (use submitJob for jobs without inputs)');
        if (inputs.length > 10) throw new Error('Maximum 10 input files');
        if (secrets.length > 10) throw new Error('Maximum 10 secrets');

        const signer = this.keyring.addFromUri(account);

        // Calculate cost
        const hours = Math.ceil(duration / 60);
        const cost = (ram * 10 + cpu * 5 + gpus * 50) * hours;
        console.log(`💰 Estimated cost: ${cost} tokens`);

        console.log(`📤 Submitting job with ${inputs.length} input(s)...`);
        console.log(`   Image: ${image}`);
        console.log(`   Resources: ${ram}GB RAM, ${cpu} CPU, ${gpus} GPU`);

        // Format inputs for blockchain
        const inputsForChain = inputs.map(inp => {
            const checksumBytes = typeof inp.checksum === 'string'
                ? Buffer.from(inp.checksum, 'hex')
                : Buffer.from(inp.checksum);
            return [inp.cid, inp.path, inp.size, Array.from(checksumBytes)];
        });

        // Format secrets for blockchain
        const secretsForChain = secrets.map(sec => {
            // Accept object format {key: 'API_KEY', path: 'openai/key'}
            const key = sec.key || sec.name;
            let vaultPath = sec.path || sec.vaultPath;

            // Auto-add vault:// prefix if not present
            if (vaultPath && !vaultPath.startsWith('vault://')) {
                vaultPath = `vault://${vaultPath}`;
            }

            if (!key || !vaultPath) {
                throw new Error('Secret must have both key and path');
            }

            return [key, vaultPath];
        });

        if (secrets.length > 0) {
            console.log(`🔐 Job will use ${secrets.length} secret(s)`);
        }

        return new Promise((resolve, reject) => {
            this.api.tx.ipfsHost.submitJobWithInputs(
                image,
                command,
                ram,
                cpu,
                disk,
                duration,
                gpus,
                inputsForChain,
                parameters,
                secretsForChain
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
     * Get job outputs (CIDs of result files)
     *
     * @param {number} jobId - Job ID
     * @returns {Promise<Array>} Output files [{cid, path, size, checksum, type}]
     */
    async getJobOutputs(jobId) {
        await this.connect();
        const job = await this.api.query.ipfsHost.jobs(jobId);

        if (job.isNone) return null;

        const data = job.unwrap();

        if (!data.outputs || data.outputs.length === 0) {
            return [];
        }

        return data.outputs.map(output => ({
            cid: Buffer.from(output.cid).toString(),
            path: Buffer.from(output.path).toString(),
            size: output.size.toNumber(),
            checksum: Buffer.from(output.checksum).toString('hex'),
            type: output.outputType.toString()
        }));
    }

    /**
     * Download output file from storage service
     *
     * @param {string} cid - Content ID
     * @param {string} storageUrl - Storage service URL (default: http://localhost:7683)
     * @returns {Promise<Buffer>} File data
     */
    async downloadOutput(cid, storageUrl = 'http://localhost:7683') {
        const axios = require('axios');

        console.log(`📥 Downloading output: ${cid}`);
        const response = await axios.get(`${storageUrl}/download/${cid}`, {
            responseType: 'arraybuffer'
        });

        return Buffer.from(response.data);
    }

    /**
     * Store a secret in vault
     * @param {string} path - Secret path (e.g., "openai/api-key")
     * @param {string} value - Secret value
     * @param {Object} metadata - Access control metadata
     * @returns {Promise<Object>} Response from vault
     */
    async storeSecret(path, value, metadata = {}) {
        const axios = require('axios');

        console.log(`🔐 Storing secret: ${path}`);

        try {
            const response = await axios.post(
                `${this.vaultUrl}/v1/secrets/${path}`,
                {
                    value,
                    metadata: {
                        allowed_providers: metadata.allowed_providers || ['*'],
                        allowed_jobs: metadata.allowed_jobs || ['*'],
                        ...metadata
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.vaultToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`✅ Secret stored: ${response.data.path}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Failed to store secret: ${error.message}`);
            if (error.response) {
                console.error(`   Response: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    /**
     * Retrieve a secret from vault
     * @param {string} path - Secret path
     * @returns {Promise<string>} Secret value
     */
    async getSecret(path) {
        const axios = require('axios');

        try {
            const response = await axios.get(
                `${this.vaultUrl}/v1/secrets/${path}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.vaultToken}`
                    }
                }
            );

            return response.data.value;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                throw new Error(`Secret not found: ${path}`);
            }
            throw error;
        }
    }

    /**
     * Delete a secret from vault
     * @param {string} path - Secret path
     */
    async deleteSecret(path) {
        const axios = require('axios');

        console.log(`🗑️  Deleting secret: ${path}`);

        try {
            const response = await axios.delete(
                `${this.vaultUrl}/v1/secrets/${path}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.vaultToken}`
                    }
                }
            );

            console.log(`✅ Secret deleted: ${path}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Failed to delete secret: ${error.message}`);
            throw error;
        }
    }

    /**
     * List all secrets in vault
     * @returns {Promise<Array>} Array of secret paths
     */
    async listSecrets() {
        const axios = require('axios');

        try {
            const response = await axios.get(
                `${this.vaultUrl}/v1/secrets`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.vaultToken}`
                    }
                }
            );

            return response.data.secrets;
        } catch (error) {
            console.error(`❌ Failed to list secrets: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get provider reputation and trust metrics
     * @param {string} providerAddress - Provider account address
     * @returns {Promise<Object>} Reputation data
     */
    async getProviderReputation(providerAddress) {
        await this.connect();

        const provider = await this.api.query.ipfsHost.providers(providerAddress);

        if (provider.isNone) {
            throw new Error(`Provider not found: ${providerAddress}`);
        }

        const p = provider.unwrap();

        return {
            address: providerAddress,
            reputationScore: p.reputationScore.toNumber(),
            slashedAmount: p.slashedAmount.toString(),
            challengeCount: p.challengeCount.toNumber(),
            fraudCount: p.fraudCount.toNumber(),
            completedJobs: p.completedJobs.toNumber(),
            activeJobs: p.activeJobs.toNumber(),
            stake: p.stake.toString()
        };
    }

    /**
     * Challenge a job's execution
     * @param {number} jobId - Job ID to challenge
     * @param {number} checkpointIndex - Checkpoint index to challenge
     * @param {string} account - Challenger account (default: //Alice)
     * @returns {Promise<number>} Challenge ID
     */
    async challengeJob(jobId, checkpointIndex, account = '//Alice') {
        await this.connect();

        const signer = this.keyring.addFromUri(account);

        console.log(`⚠️  Challenging job ${jobId} checkpoint ${checkpointIndex}...`);

        return new Promise((resolve, reject) => {
            this.api.tx.ipfsHost.challengeExecution(jobId, checkpointIndex)
                .signAndSend(signer, ({ status, events, dispatchError }) => {
                    if (dispatchError) {
                        if (dispatchError.isModule) {
                            const decoded = this.api.registry.findMetaError(dispatchError.asModule);
                            reject(new Error(`${decoded.name}: ${decoded.docs.join(' ')}`));
                        } else {
                            reject(new Error(dispatchError.toString()));
                        }
                        return;
                    }

                    if (status.isInBlock) {
                        events.forEach(({ event }) => {
                            if (event.section === 'ipfsHost' && event.method === 'ChallengeCreated') {
                                const challengeId = event.data[0].toNumber();
                                console.log(`✅ Challenge created: ${challengeId}`);
                                resolve(challengeId);
                            }
                        });
                    }
                });
        });
    }

    /**
     * Get challenge details
     * @param {number} challengeId - Challenge ID
     * @returns {Promise<Object>} Challenge data
     */
    async getChallenge(challengeId) {
        await this.connect();

        const challenge = await this.api.query.ipfsHost.challenges(challengeId);

        if (challenge.isNone) {
            return null;
        }

        const c = challenge.unwrap();

        return {
            challengeId,
            jobId: c.jobId.toNumber(),
            challenger: c.challenger.toString(),
            provider: c.provider.toString(),
            checkpointIndex: c.checkpointIndex.toNumber(),
            status: c.status.toString(),
            createdAt: c.createdAt.toNumber(),
            resolvedAt: c.resolvedAt.isSome ? c.resolvedAt.unwrap().toNumber() : null,
            outcome: c.outcome.isSome ? c.outcome.unwrap().toString() : null
        };
    }

    /**
     * Check if job is in challenge period
     * @param {number} jobId - Job ID
     * @returns {Promise<Object>} Challenge period status
     */
    async getChallengePeriodStatus(jobId) {
        await this.connect();

        const job = await this.getJob(jobId);
        if (!job) {
            throw new Error(`Job not found: ${jobId}`);
        }

        const deadline = await this.api.query.ipfsHost.challengePeriodDeadlines(jobId);

        if (deadline.isNone) {
            return {
                inChallengePeriod: false,
                canChallenge: false,
                status: job.status
            };
        }

        const currentBlock = await this.api.query.system.number();
        const deadlineBlock = deadline.unwrap().toNumber();
        const current = currentBlock.toNumber();

        return {
            inChallengePeriod: current < deadlineBlock,
            canChallenge: current < deadlineBlock,
            currentBlock: current,
            deadlineBlock,
            blocksRemaining: Math.max(0, deadlineBlock - current),
            status: job.status
        };
    }

    /**
     * List all providers with reputation scores
     * @returns {Promise<Array>} Array of providers with reputation
     */
    async listProviders() {
        await this.connect();

        const entries = await this.api.query.ipfsHost.providers.entries();

        return entries.map(([key, value]) => {
            const address = key.args[0].toString();
            const p = value.unwrap();

            return {
                address,
                reputationScore: p.reputationScore.toNumber(),
                completedJobs: p.completedJobs.toNumber(),
                fraudCount: p.fraudCount.toNumber(),
                slashedAmount: p.slashedAmount.toString(),
                stake: p.stake.toString()
            };
        }).sort((a, b) => b.reputationScore - a.reputationScore); // Sort by reputation
    }

    /**
     * Get all challenges for a job
     * @param {number} jobId - Job ID
     * @returns {Promise<Array>} Array of challenges
     */
    async getJobChallenges(jobId) {
        await this.connect();

        const entries = await this.api.query.ipfsHost.challenges.entries();

        const challenges = [];
        for (const [key, value] of entries) {
            const c = value.unwrap();
            if (c.jobId.toNumber() === jobId) {
                challenges.push({
                    challengeId: key.args[0].toNumber(),
                    challenger: c.challenger.toString(),
                    provider: c.provider.toString(),
                    checkpointIndex: c.checkpointIndex.toNumber(),
                    status: c.status.toString(),
                    outcome: c.outcome.isSome ? c.outcome.unwrap().toString() : null
                });
            }
        }

        return challenges;
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
