import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const config = {
  bitquery: {
    apiKey: required('BITQUERY_API_KEY'),
    httpUrl: 'https://streaming.bitquery.io/graphql',
    wsUrl: 'wss://streaming.bitquery.io/graphql',
  },
  llm: {
    apiKey: required('LLM_API_KEY'),
    baseUrl: optional('LLM_BASE_URL', 'https://openrouter.ai/'),
    model: optional('LLM_MODEL', 'gpt-4o-mini'),
  },
  telegram: {
    botToken: required('TELEGRAM_BOT_TOKEN'),
  },
  bsc: {
    rpcUrl: optional('BSC_RPC_URL', 'https://bsc-dataseed.binance.org'),
    wssUrl: optional('BSC_WSS_URL', 'wss://bsc-ws-node.nariox.org'),
    deployerKey: optional('DEPLOYER_PRIVATE_KEY', ''),
    oracleAddress: optional('ORACLE_CONTRACT_ADDRESS', ''),
  },
  server: {
    port: parseInt(optional('PORT', '3000'), 10),
    corsOrigin: optional('CORS_ORIGIN', 'http://localhost:3001'),
  },
  // Constants
  fourMeme: {
    factoryAddress: '0x5c952063c7fc8610ffdb798152d69f0b9550762b',
    pancakeV2Factory: '0xca143ce32fe78f1f7019d7d551a6402fc5350c73',
    wbnb: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  },
  thresholds: {
    whaleBnb: 0.5,
    graduationBnbTarget: 18,
    scoreTtlSec: 60,
    concentrationWarning: 0.2,
    dominanceWarning: 0.3,
    clusterMinWallets: 3,
  },
} as const;
