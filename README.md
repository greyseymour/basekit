# BaseKit

> Ship onchain on Base from a single prompt.
> 15 opinionated SKILL.md playbooks + a 13-tool MCP server, portable across
> Claude Desktop, Claude Code, Cursor, Codex, Windsurf, and any
> SKILL.md-compatible runtime.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Built on Base](https://img.shields.io/badge/built%20on-Base-0000FF.svg)](https://base.org)
[![MCP](https://img.shields.io/badge/MCP-compatible-2752FF.svg)](https://modelcontextprotocol.io)

## What this is

Two things in one repo:

1. **15 SKILL.md playbooks** — the agent loads them on demand.
   - `base-deploy-token`, `base-token-launch-checklist`, `base-airdrop`
   - `base-analyze-wallet`, `base-portfolio-snapshot`, `base-onramp-flow`
   - `base-gas-optimize`, `base-mev-resistant`, `base-safe-multisig`
   - `base-basescan-debug`, `base-contract-verify`, `base-event-listener`
   - `base-frame-build`, `base-revenue-share`, `agent-onchain-handshake`

2. **An MCP server with 13 tools** — the agent calls them directly.
   - **Read** — `get_wallet_profile`, `get_transaction_trace`,
     `portfolio_snapshot`, `check_token_approvals`, `gas_now`,
     `resolve_basename`, `check_basename_available`, `decode_calldata`
   - **Simulate** — `estimate_token_deploy`, `estimate_safe_deploy`,
     `simulate_swap`, `verify_contract`
   - **Policy** — `agent_policy_describe` (returns the trust manifest)

MIT, free, and built so an agent can install it without a human in the loop.

## Install — Claude Desktop (right now, from source)

Until `@basekit/mcp` is on npm, install from source. Takes ~3 minutes.

```bash
# 1. Clone + build
git clone https://github.com/greyseymour/basekit.git
cd basekit/mcp
npm install
npm run build
```

Then add to your Claude Desktop config:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "basekit": {
      "command": "node",
      "args": ["/absolute/path/to/basekit/mcp/dist/index.js"],
      "env": {
        "BASESCAN_API_KEY": "your_basescan_key",
        "ALCHEMY_API_KEY": "your_alchemy_key"
      }
    }
  }
}
```

API keys are free:
- Basescan → [basescan.org/myapikey](https://basescan.org/myapikey)
- Alchemy → [dashboard.alchemy.com](https://dashboard.alchemy.com) (create a Base mainnet app)

Restart Claude Desktop. The 13 tools show up in the hammer menu. Try:

> *"What's the gas price on Base right now, and profile vitalik.base.eth"*

## Install — other runtimes (coming with v0.3)

```bash
# Claude Code (plugin install — pulls skills + MCP at once)
claude plugin install basekit

# Cursor
cursor mcp add basekit

# Codex CLI
codex mcp add basekit npx -- -y @basekit/mcp

# Windsurf
windsurf mcp add basekit
```

These land once `@basekit/mcp` is published to npm.

## Local test path (Inspector)

Want to poke the tools directly without a host?

```bash
cd basekit/mcp
export BASESCAN_API_KEY="..." ALCHEMY_API_KEY="..."
npx @modelcontextprotocol/inspector node dist/index.js
```

Opens `localhost:5173` — every tool callable from a web UI.

## Repo layout

```
basekit/
├── plugin.json                # Claude plugin manifest
├── README.md
├── LICENSE                    # MIT
│
├── skills/                    # 15 SKILL.md playbooks
├── mcp/                       # @basekit/mcp — 13-tool MCP server
│   ├── package.json
│   ├── src/index.ts
│   ├── dist/index.js          # prebuilt
│   └── tsconfig.json
│
├── brand/                     # palette, type, logo
├── docs/                      # strategy, decisions, permissions
├── launch/                    # tweet thread, cast, listings
├── qa/                        # test fixtures
└── site/public/               # basekit.dev landing
```

## For agentic crawlers

Predictable paths, no human required:

- `/.well-known/agent.json` — A2A trust manifest (security disclosure, signing status, delegator contract)
- `/llms.txt` — plain-text index of skills + tools
- `/agents.txt` — robots-style policy + manifest pointers
- `/skill.md` — aggregated playbook (drop into any SKILL.md runtime)
- `/plugin.json` — Claude plugin manifest

## Philosophy

- **One prompt → one outcome.** No "what would you like to do next?" follow-ups.
- **Cost-first.** Print gas + ETH cost at current base fee before any tx.
- **Sepolia by default.** Mainnet only when the user names the chain explicitly.
- **Never broadcast without confirmation.** Side effects require a yes.
- **The agent does the work.** Skills are the playbook, MCP is the arm.

## Security

This is pre-v1.0 software. Skills are unsigned (`signed: false` in every
frontmatter) until the v0.3 signing infrastructure ships. Read the full
threat model at [basekit.dev/security](https://basekit.dev/security) before
giving an agent broadcast rights. Disclose vulns to `security@basekit.dev`.

## License

MIT. Fork freely. PRs welcome.

Built on Base. Built for agents. Built in the open. 🩵
