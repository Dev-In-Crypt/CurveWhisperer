# CurveWhisperer

Real-time AI advisor that analyzes Four.Meme bonding curves, predicts graduation probability, detects whale patterns, and explains risk in plain language — via Telegram bot and web dashboard on BNB Chain.

## Features

- **Graduation Score (0–100)** — AI-generated probability with natural-language explanation
- **Whale Alerts** — large buys, wallet clusters, suspicious concentration patterns
- **Graduation Alerts** — instant notification when a token migrates to PancakeSwap
- **On-Chain Oracle** — BSC smart contract storing AI scores for other dApps to consume
- **Telegram Bot** — `/top`, `/score`, `/watch`, real-time alerts
- **Web Dashboard** — live curves grid, token detail with charts, wallet connect

## Live Demo

- **Dashboard:** [cwfrontend-production.up.railway.app](https://cwfrontend-production.up.railway.app)
- **Backend API:** [cwbackend-production.up.railway.app/api/stats](https://cwbackend-production.up.railway.app/api/stats)
- **Telegram Bot:** [@CurveWhisperer_bot](https://t.me/CurveWhisperer_bot)
- **Oracle Contract:** [0x02d42A47cD33F3FEEfC7Cf31b8E29657ed825aB8](https://testnet.bscscan.com/address/0x02d42A47cD33F3FEEfC7Cf31b8E29657ed825aB8) (BSC Testnet)

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

## On-Chain Oracle (BSC Testnet)

The CurveWhispererOracle contract stores AI-generated graduation scores on-chain, readable by any dApp.

**Contract:** [`0x02d42A47cD33F3FEEfC7Cf31b8E29657ed825aB8`](https://testnet.bscscan.com/address/0x02d42A47cD33F3FEEfC7Cf31b8E29657ed825aB8)

### Verified Transactions

| Tx Hash | Action | Token | Score | Confidence | Reasoning |
|---------|--------|-------|-------|------------|-----------|
| [`0xaa8c4515...`](https://testnet.bscscan.com/tx/0xaa8c4515dd579f684892fc45cc4a06fe6da191eb107484cf5a8fda1016931e92) | Deploy | — | — | — | Contract deployment |
| [`0x9880c055...`](https://testnet.bscscan.com/tx/0x9880c055176656a2ca7a5daef19c0c7b05069ce6df5372899ab1aa2b5ae69b25) | updateScore | 0x0001 | 75 | high | Strong velocity test |
| updateScore | | 0x1111 | 82 | high | 142 buyers, accelerating at 4.2 BNB/hr, 87% fill |
| updateScore | | 0x2222 | 73 | high | Healthy distribution, 89 buyers, HHI < 1500 |
| updateScore | | 0x3333 | 45 | medium | Decelerating velocity, top holder at 18% |
| updateScore | | 0x4444 | 22 | low | Stalled 45 min, 19 buyers, top wallet 28% |
| updateScore | | 0x5555 | 78 | high | Accelerating 3.1 BNB/hr, 53 buyers, HHI 890 |
| updateScore | | 0x6666 | 58 | medium | 48% fill, stable velocity, needs acceleration |
| updateScore | | 0x7777 | 31 | low | 9% fill, 8 buyers, early stage |
| updateScore | | 0x1111 | 88 | high | Score upgraded: velocity surged, 91% fill, graduation imminent |
| markGraduated | | 0x1111 | — | — | TokenGraduated event emitted |

**10 transactions** total — 1 deploy, 9 updateScore calls (including 1 score update showing history), 1 markGraduated event.

Token `0x1111` demonstrates the full lifecycle: initial score (82) -> score update (88) -> graduation.

### Reading Scores

Any dApp can read scores on-chain:

```solidity
interface ICurveWhispererOracle {
    struct Score {
        uint8 score;        // 0-100
        uint40 timestamp;
        string reason;
        string confidence;  // "high", "medium", "low"
    }
    function getScore(address token) external view returns (Score memory);
    function getScoreHistory(address token, uint256 limit) external view returns (Score[] memory);
}
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, TypeScript, Express, WebSocket |
| AI | OpenRouter (gpt-4o-mini) + rule-based fallback |
| Data | Bitquery Streaming API (GraphQL/WS) |
| Blockchain | ethers.js, BSC |
| Smart Contract | Solidity 0.8.24, Foundry (12 tests) |
| Telegram | grammY |
| Frontend | Next.js 16, Tailwind CSS v4, Recharts, wagmi |
| Testing | Vitest (52 tests), Playwright (18 e2e tests), Foundry (12 tests) |
| Monorepo | npm workspaces, Turborepo |
| Deploy | Railway (backend + frontend) |

## Tests

```
Foundry (contracts)   12 tests — all pass
Vitest (backend)      52 tests — all pass
Playwright (e2e)      18 tests — all pass
Total                 82 tests
```

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
