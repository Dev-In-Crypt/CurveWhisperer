export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
export const WS_URL = (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000').replace(/\/+$/, '');
export const BSC_EXPLORER = process.env.NEXT_PUBLIC_BSC_EXPLORER || 'https://bscscan.com';
export const ORACLE_ADDRESS = process.env.NEXT_PUBLIC_ORACLE_ADDRESS || '';
