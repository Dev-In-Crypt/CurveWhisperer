'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export function Header() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <header className="border-b border-card-border px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight">CurveWhisperer</h1>
        <span className="text-xs text-muted">Four.Meme AI Advisor</span>
      </div>
      <div className="flex items-center gap-3">
        {isConnected ? (
          <button
            onClick={() => disconnect()}
            className="bg-card border border-card-border rounded-lg px-3 py-1.5 text-sm hover:border-accent-blue/50 transition-colors flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-accent-green" />
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </button>
        ) : (
          <button
            onClick={() => connect({ connector: injected() })}
            className="bg-accent-blue/10 border border-accent-blue/30 text-accent-blue rounded-lg px-3 py-1.5 text-sm hover:bg-accent-blue/20 transition-colors"
          >
            Connect Wallet
          </button>
        )}
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
          <span>Live</span>
        </div>
      </div>
    </header>
  );
}
