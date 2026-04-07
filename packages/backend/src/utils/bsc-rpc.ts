import { ethers } from 'ethers';
import { createChildLogger } from './logger.js';
import { config } from '../config.js';

const log = createChildLogger('bsc-rpc');

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
];

const ORACLE_ABI = [
  'function updateScore(address token, uint8 score, string reason, string confidence)',
  'function getScore(address token) view returns (tuple(uint8 score, uint40 timestamp, string reason, string confidence))',
  'function getScoreHistory(address token, uint256 limit) view returns (tuple(uint8 score, uint40 timestamp, string reason, string confidence)[])',
  'function markGraduated(address token)',
  'event ScoreUpdated(address indexed token, uint8 score, string confidence, uint40 timestamp)',
];

const tokenInfoCache = new Map<string, { name: string; symbol: string; decimals: number }>();

let provider: ethers.JsonRpcProvider;
let wallet: ethers.Wallet | null = null;
let oracleContract: ethers.Contract | null = null;

export function initProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(config.bsc.rpcUrl);
    log.info({ rpc: config.bsc.rpcUrl }, 'BSC provider initialized');
  }
  return provider;
}

export function getProvider(): ethers.JsonRpcProvider {
  return provider || initProvider();
}

export function initWallet(): ethers.Wallet | null {
  if (wallet) return wallet;
  if (!config.bsc.deployerKey) {
    log.warn('No deployer key configured, on-chain writes disabled');
    return null;
  }
  wallet = new ethers.Wallet(config.bsc.deployerKey, getProvider());
  log.info({ address: wallet.address }, 'Wallet initialized');
  return wallet;
}

export function getOracleContract(): ethers.Contract | null {
  if (oracleContract) return oracleContract;
  if (!config.bsc.oracleAddress) {
    log.warn('No oracle contract address configured');
    return null;
  }
  const w = initWallet();
  if (!w) return null;
  oracleContract = new ethers.Contract(config.bsc.oracleAddress, ORACLE_ABI, w);
  log.info({ address: config.bsc.oracleAddress }, 'Oracle contract initialized');
  return oracleContract;
}

export async function getTokenInfo(address: string): Promise<{ name: string; symbol: string; decimals: number }> {
  const cached = tokenInfoCache.get(address.toLowerCase());
  if (cached) return cached;

  const contract = new ethers.Contract(address, ERC20_ABI, getProvider());
  try {
    const [name, symbol, decimals] = await Promise.all([
      contract.name() as Promise<string>,
      contract.symbol() as Promise<string>,
      contract.decimals() as Promise<bigint>,
    ]);
    const info = { name, symbol, decimals: Number(decimals) };
    tokenInfoCache.set(address.toLowerCase(), info);
    return info;
  } catch (err) {
    log.error({ err, address }, 'Failed to get token info');
    return { name: 'Unknown', symbol: '???', decimals: 18 };
  }
}

export async function getWalletBalance(): Promise<string> {
  const w = initWallet();
  if (!w) return '0';
  const balance = await getProvider().getBalance(w.address);
  return ethers.formatEther(balance);
}

export async function checkHealth(): Promise<boolean> {
  try {
    await getProvider().getBlockNumber();
    return true;
  } catch {
    log.error('BSC RPC health check failed');
    return false;
  }
}
