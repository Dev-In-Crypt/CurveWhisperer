import { ethers } from 'ethers';
import { getOracleContract, getWalletBalance } from '../utils/bsc-rpc.js';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger('onchain');

export class OnchainPublisher {
  private lastWriteTime = new Map<string, number>();
  private minInterval = 10 * 60 * 1000; // 10 min between writes for same token
  private enabled = true;

  constructor() {
    this.logBalance();
  }

  private async logBalance(): Promise<void> {
    try {
      const balance = await getWalletBalance();
      log.info({ balance: `${balance} BNB` }, 'Deployer wallet balance');
      if (parseFloat(balance) < 0.005) {
        log.warn('Low gas funds! On-chain writes may fail.');
      }
    } catch (err) {
      log.warn({ err }, 'Could not check wallet balance');
    }
  }

  async publishScore(
    tokenAddress: string,
    score: number,
    reason: string,
    confidence: string,
  ): Promise<string | null> {
    if (!this.enabled) return null;

    const contract = getOracleContract();
    if (!contract) {
      log.debug('Oracle contract not configured, skipping on-chain write');
      return null;
    }

    const key = tokenAddress.toLowerCase();
    const now = Date.now();
    const lastWrite = this.lastWriteTime.get(key) || 0;
    if (now - lastWrite < this.minInterval) {
      log.debug({ tokenAddress, minAgo: Math.round((now - lastWrite) / 60000) }, 'Skipping write (too recent)');
      return null;
    }

    try {
      // Truncate reason to save gas
      const shortReason = reason.length > 200 ? reason.slice(0, 200) + '...' : reason;

      const tx = await contract.updateScore(tokenAddress, score, shortReason, confidence, {
        gasLimit: 200000,
        gasPrice: ethers.parseUnits('3', 'gwei'),
      });

      log.info({ tokenAddress, score, txHash: tx.hash }, 'Score tx sent');

      const receipt = await tx.wait(1);
      log.info({ tokenAddress, score, txHash: receipt.hash }, 'Score published on-chain');

      this.lastWriteTime.set(key, now);

      // Check remaining balance
      const balance = await getWalletBalance();
      log.info({ balance: `${balance} BNB` }, 'Remaining balance');
      if (parseFloat(balance) < 0.005) {
        log.warn('Low gas funds!');
      }

      return receipt.hash as string;
    } catch (err: any) {
      if (err?.code === 'INSUFFICIENT_FUNDS') {
        log.error('Insufficient funds for gas, disabling on-chain writes');
        this.enabled = false;
      } else {
        log.error({ err: err.message, tokenAddress }, 'Failed to publish score on-chain');
      }
      return null;
    }
  }
}
