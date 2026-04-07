'use client';

import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export function WalletHoldings({ tokenAddress }: { tokenAddress: string }) {
  const { address, isConnected } = useAccount();

  const { data: balance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  if (!isConnected) {
    return (
      <div className="bg-card border border-card-border rounded-xl p-4 text-center">
        <p className="text-sm text-muted">Connect wallet to see your holdings</p>
      </div>
    );
  }

  const formatted = balance !== undefined
    ? parseFloat(formatUnits(balance, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : '—';

  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-2">Your Holdings</h3>
      <p className="text-2xl font-bold">{formatted}</p>
      <p className="text-xs text-muted mt-1 truncate">
        Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
      </p>
    </div>
  );
}
