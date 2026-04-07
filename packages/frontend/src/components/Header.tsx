'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export function Header() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <header className="border-b border-card-border/50 px-6 py-3 flex items-center justify-between relative z-10 backdrop-blur-md bg-background/60">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight glitch cursor-default">
          <span className="text-accent-cyan neon-text-subtle">Curve</span>
          <span className="text-accent-magenta neon-text-subtle">Whisperer</span>
        </h1>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted border-l border-card-border pl-3">
          <span className="font-mono uppercase tracking-widest">Four.Meme AI</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isConnected ? (
          <button
            onClick={() => disconnect()}
            className="glow-card rounded-lg px-3 py-1.5 text-sm hover:border-accent-cyan/50 transition-all flex items-center gap-2 font-mono"
          >
            <div className="w-2 h-2 rounded-full bg-accent-green neon-text-subtle" />
            <span className="text-accent-cyan">{address?.slice(0, 6)}</span>
            <span className="text-muted">...</span>
            <span className="text-accent-cyan">{address?.slice(-4)}</span>
          </button>
        ) : (
          <button
            onClick={() => connect({ connector: injected() })}
            className="border border-accent-cyan/30 bg-accent-cyan/5 text-accent-cyan rounded-lg px-4 py-1.5 text-sm hover:bg-accent-cyan/10 hover:border-accent-cyan/60 hover:shadow-[0_0_15px_rgba(0,204,255,0.2)] transition-all font-mono uppercase tracking-wider"
          >
            Connect
          </button>
        )}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse shadow-[0_0_6px_rgba(0,255,136,0.6)]" />
          <span className="text-accent-green/70 uppercase tracking-widest">Live</span>
        </div>
      </div>
    </header>
  );
}
