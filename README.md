# CurveWhisperer

Real-time AI advisor that analyzes Four.Meme bonding curves, predicts graduation probability, detects whale patterns, and explains risk in plain language — via Telegram bot and web dashboard on BNB Chain.

## Features

- **Graduation Score (0–100)** — AI-generated probability with natural-language explanation
- **Whale Alerts** — large buys, wallet clusters, suspicious concentration patterns
- **Graduation Alerts** — instant notification when a token migrates to PancakeSwap
- **On-Chain Oracle** — BSC smart contract storing AI scores for other dApps to consume
- **Telegram Bot** — `/top`, `/score`, `/watch`, real-time alerts
- **Web Dashboard** — live curves grid, token detail with charts, live feed

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│ Bitquery WS  │────▶│   Backend    │────▶│  Frontend  │
│ (BSC data)   │     │  Pipeline    │     │  (Next.js) │
└─────────────┘     │              │     └────────────┘
                    │  ┌─────────┐ │
                    │  │ AI Score│ │     ┌────────────┐
                    │  │ Engine  │ │────▶│  Telegram   │
                    │  └─────────┘ │     │    Bot     │
                    │              │     └────────────┘
                    │  ┌─────────┐ │
                    │  │ On-chain│ │     ┌────────────┐
                    │  │Publisher│ │────▶│ BSC Oracle  │
                    │  └─────────┘ │     │ (Solidity)  │
                    └──────────────┘     └────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, TypeScript, Express, WebSocket |
| AI | OpenRouter (gpt-4o-mini) + rule-based fallback |
| Data | Bitquery Streaming API (GraphQL/WS) |
| Blockchain | ethers.js, BSC Mainnet |
| Smart Contract | Solidity 0.8.24, Foundry |
| Telegram | grammY |
| Frontend | Next.js 16, Tailwind CSS v4, Recharts |
| Monorepo | npm workspaces, Turborepo |

## Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Fill in your API keys

# Run all services in development
npm run dev

# Or run individually
cd packages/backend && npm run dev
cd packages/frontend && npm run dev
```

## Smart Contract

```bash
cd packages/contracts

# Run tests
forge test -vvv

# Deploy to BSC testnet
forge script script/Deploy.s.sol --rpc-url bsc_testnet --broadcast
```

## Project Structure

```
packages/
├── backend/      # Data pipeline, AI scoring, API, WebSocket
├── bot/          # Telegram bot (grammY)
├── contracts/    # Solidity oracle (Foundry)
└── frontend/     # Next.js dashboard
```

## Hackathon

Built for the **Four.Meme AI Sprint** hackathon on BNB Chain (April 2026).

## License

MIT
