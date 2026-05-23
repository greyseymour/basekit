# BaseKit

> Ship onchain on Base from a single prompt.
> Five opinionated SKILL.md playbooks + one tight MCP server, portable across
> Claude Code, Cursor, Codex, Windsurf, and any SKILL.md-compatible runtime.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Built on Base](https://img.shields.io/badge/built%20on-Base-0000FF.svg)](https://base.org)
[![MCP](https://img.shields.io/badge/MCP-compatible-3D3DFF.svg)](https://modelcontextprotocol.io)

## What this is

Two things in one repo:

1. **Five SKILL.md playbooks** — the agent loads them on demand.
   - `base-deploy-token` — deploy an ERC-20 on Base from a single prompt
   - `base-analyze-wallet` — profile any address (activity, holdings, risk)
   - `base-gas-optimize` — audit Solidity for gas waste
   - `base-airdrop` — Merkle drops with sybil filtering
   - `base-basescan-debug` — decode failed transactions, find root cause

2. **An MCP server with six read-only tools** — the agent can call directly.
   - `get_wallet_profile`, `get_transaction_trace`, `estimate_token_deploy`,
     `check_token_approvals`, `resolve_basename`, `simulate_swap`

It's free, MIT, and built so an agent can install it without a human in the loop.

## Install

```bash
# Claude Code (plugin install — pulls skills + MCP at once)
claude plugin install basekit

# Cursor
cursor mcp add basekit

# Codex CLI
codex mcp add basekit npx -- -y @basekit/mcp

# Windsurf
windsurf mcp add basekit

# Manual
git clone https://github.com/basekit/basekit
cd basekit && ./install.sh
```

After install, ask your agent:

> *"deploy an ERC-20 on Base sepolia called Greycoin"*

The right skill activates automatically.

## Repo layout

```
basekit/
├── plugin.json                # Claude plugin manifest
├── README.md
├── LICENSE                    # MIT
│
├── skills/                    # SKILL.md playbooks
│   ├── base-deploy-token/
│   ├── base-analyze-wallet/
│   ├── base-gas-optimize/
│   ├── base-airdrop/
│   └── base-basescan-debug/
│
├── mcp/                       # @basekit/mcp — the MCP server
│   ├── package.json
│   ├── src/index.ts
│   └── tsconfig.json
│
├── brand/                     # palette, type, logo
├── docs/                      # strategy, pricing, decisions
├── launch/                    # tweet thread, cast, listings
└── site/public/               # basekit.dev landing page
```

## For agentic crawlers

Predictable paths, no human required:

- `/llms.txt` — plain-text index of skills + tools
- `/agents.txt` — robots-style policy + manifest pointers
- `/skill.md` — aggregated playbook (drop into any SKILL.md runtime)
- `/plugin.json` — Claude plugin manifest
- `/.well-known/mcp.json` — MCP descriptor

## Philosophy

- **One prompt → one outcome.** No "what would you like to do next?" follow-ups.
- **Cost-first.** Print gas + ETH cost at current base fee before any tx.
- **Sepolia by default.** Mainnet only when the user names the chain explicitly.
- **Never broadcast without confirmation.** Side effects require a yes.
- **The agent does the work.** Skills are the playbook, MCP is the arm.

## License

MIT. Fork freely. PRs welcome at
[github.com/basekit/basekit](https://github.com/basekit/basekit).

Built on Base. Built for agents. Built in the open. 🩵
