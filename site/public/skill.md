# BaseKit Skills — Master Index

BaseKit is an open library of SKILL.md playbooks for building on Base. Each skill is self-contained: an agent or human reads it and executes the workflow safely.

Every skill declares — in machine-readable frontmatter — `risk_level`, `reversible`, `requires_signing`, `mutates_state`, `estimated_cost_usd_max`, and `external_calls`. Agents parse this before deciding to run unattended.

**16 skills shipped in v0.2.5 · MIT licensed · agent-safe by default · interoperates with Base MCP**

## Onchain skills (Base)

| Skill | Risk | Reversible | Signs | Max cost | Summary |
|---|---|---|---|---|---|
| **base-airdrop** | medium | false | true | $40.00 | Use this skill when the user wants to distribute tokens to multiple addresses on Base. Handles eligibility list generation, Merkle root computation, gas-efficient claim contract de |
| **base-analyze-wallet** | none | true | false | $0.00 | Use this skill when the user asks to analyze, audit, score, or investigate a wallet address on Base. Returns activity profile (tx count, age, contract interactions), token holdings |
| **base-basescan-debug** | none | true | false | $0.00 | Use this skill when the user has a failed, stuck, or confusing transaction on Base and wants to understand what happened. Fetches the transaction trace, decodes revert reasons, ide |
| **base-contract-verify** | none | true | false | $0.00 | Verify a contract address on Base — source on Basescan, ABI integrity, proxy implementation, ownership graph, honeypot heuristics, allowance risk. |
| **base-deploy-token** | high | false | true | $30.00 | Use this skill when the user wants to deploy, launch, or create an ERC-20 token on Base. Handles standard tokens, mint/burn permissions, ownership, supply caps, and liquidity routi |
| **base-event-listener** | none | true | false | $0.00 | Subscribe to onchain events on Base with reliable backfill, reorg handling, and exactly-once delivery to a webhook or queue. |
| **base-frame-build** | low | true | optional | $2.00 | Build a Farcaster Frame (v2 Mini App) that lives on Base — interactive embeds with onchain actions, wallet auth, and shareable cast distribution. |
| **base-gas-optimize** | none | true | false | $0.00 | Use this skill when the user wants to reduce gas costs in a Solidity contract destined for Base. Identifies common gas-inefficient patterns (storage packing, unbounded loops, redun |
| **base-mev-resistant** | medium | false | true | $5.00 | Execute swaps and token launches on Base with MEV protection — private mempools, commit-reveal, slippage guards, sandwich detection. |
| **base-onramp-flow** | low | false | true | $1.00 | Get a non-crypto user funded on Base in under 3 minutes — Coinbase Onramp, Smart Wallet creation, basename claim, first-tx gas sponsorship. |
| **base-portfolio-snapshot** | none | true | false | $0.00 | Generate a read-only portfolio snapshot for any Base address — tokens, NFTs, DeFi positions, P&L, cost basis. |
| **base-revenue-share** | medium | false | true | $8.00 | Deploy and operate onchain revenue splits on Base — for creator royalties, team payouts, referral programs. Built on 0xSplits + custom claim contracts. |
| **base-safe-multisig** | medium | false | true | $6.00 | Deploy, configure, and operate a Safe multisig on Base — propose transactions, gather signatures, execute, and rotate signers safely. |
| **base-token-launch-checklist** | high | false | true | $50.00 | End-to-end token launch on Base — from contract template selection through LP add, Basescan verify, holder distribution, and post-launch monitoring. |

## Agent-to-agent (A2A) primitives

| Skill | Risk | Reversible | Signs | Max cost | Summary |
|---|---|---|---|---|---|
| **agent-onchain-handshake** | medium | false | true | $0.50 | A2A (agent-to-agent) handshake protocol for autonomous agents transacting on Base — capability discovery, signed authorization grants, spending limits, audit logging. |

## Interop

| Skill | Risk | Reversible | Signs | Max cost | Summary |
|---|---|---|---|---|---|
| **base-mcp-bridge** | none | true | false | $0.00 | Coordination layer between BaseKit's planning skills and Base MCP's signing tools. Routes wallet ops (send/swap/sign/execute/x402) to Base MCP, keeps deploy/verify/audit/MEV-defense/multisig/airdrops/frames/A2A inside BaseKit. Run both servers side-by-side. See [BASE-MCP-INTEROP.md](/docs/BASE-MCP-INTEROP.md).

## How to read a skill

Every SKILL.md is YAML frontmatter (the agent-readable contract) followed by a human-readable playbook. Agents should parse the frontmatter first; humans can skim the headings. Frontmatter is canonical — if the prose and the frontmatter disagree, the frontmatter wins.

## Discovery endpoints

- `/llms.txt` — one-screen summary for LLMs
- `/agents.txt` — capability + trust pointer for crawlers
- `/skill.md` — this index
- `/plugin.json` — Claude plugin manifest
- `/.well-known/agent.json` — A2A capability + trust descriptor
- `/.well-known/mcp.json` — MCP server descriptor
- `/sitemap.xml`, `/robots.txt`, `/.well-known/security.txt`

## Trust

- MIT licensed, open source
- No PII collection; telemetry is opt-in
- Issues: https://github.com/basekit/basekit/issues
- Security: security@basekit.dev

## Install

**Humans**
```bash
git clone https://github.com/basekit/basekit
```

**Claude Desktop / MCP-aware agents**
```json
{ "mcpServers": { "basekit": { "command": "npx", "args": ["-y", "@basekit/mcp"] } } }
```

**Autonomous agents**
Fetch `https://basekit.dev/.well-known/agent.json` for the full capability + trust descriptor. Treat that document as the source of truth.
