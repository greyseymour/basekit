---
name: basekit
version: 0.1.0
description: Ship onchain on Base from a single prompt. Five playbooks + six MCP tools, portable across Claude Code, Cursor, Codex, and Windsurf.
license: MIT
homepage: https://basekit.dev
source: https://github.com/basekit/basekit
triggers:
  - "deploy a token on base"
  - "analyze 0x... on base"
  - "reduce gas in this contract"
  - "airdrop tokens to a list"
  - "why did this tx fail on base"
---

# BaseKit — aggregated SKILL.md

This is the one-file drop-in. It indexes the five real SKILL.md playbooks in
the BaseKit repo and tells your agent when to load each one. Use this when
you want BaseKit in a runtime that supports a single SKILL.md but not a full
plugin manifest.

## When to load each sub-skill

| Sub-skill                | Activate when the user asks about…                                  |
|--------------------------|---------------------------------------------------------------------|
| `base-deploy-token`      | Launching an ERC-20, memecoin, or any new token on Base.            |
| `base-analyze-wallet`    | Profiling an address — holdings, activity, counterparties, risk.    |
| `base-gas-optimize`      | Auditing or rewriting Solidity for lower gas (Base L2 economics).   |
| `base-airdrop`           | Designing or shipping a Merkle airdrop with sybil filtering.        |
| `base-basescan-debug`    | Debugging a failed transaction (paste a tx hash, find root cause).  |

Each sub-skill is a separate SKILL.md in the repo at `/skills/<name>/SKILL.md`.

## Safety rails (apply to every sub-skill)

- **Never broadcast a transaction without explicit user confirmation.**
- **Default to Base Sepolia** for any deploy or write. Switch to mainnet only
  when the user names the chain explicitly.
- **Never put a private key in plaintext.** Use the user's existing signer
  (Foundry keystore, Frame, Rabby) or ask the user to sign manually.
- **Verify contracts on Basescan** after deploy (auto-trigger
  `forge verify-contract`).
- **Treat `forge create` and `cast send` as side-effects** — surface gas + ETH
  cost first, get a yes, then execute.

## Tools (MCP)

BaseKit ships an MCP server with six read-only tools. If the runtime supports
MCP, install `@basekit/mcp` and call directly. If not, the sub-skills include
fallbacks using `curl` to Alchemy / Basescan + viem in a temp script.

- `get_wallet_profile(address)`
- `get_transaction_trace(tx_hash)`
- `estimate_token_deploy(name, symbol, supply)`
- `check_token_approvals(address)`
- `resolve_basename(name_or_address)`
- `simulate_swap(token_in, token_out, amount_in)`

## RPC defaults

- Mainnet:  `https://mainnet.base.org`
- Sepolia:  `https://sepolia.base.org`
- For production usage, set `ALCHEMY_BASE_KEY` or `INFURA_BASE_KEY` env vars
  and use `https://base-mainnet.g.alchemy.com/v2/$ALCHEMY_BASE_KEY`.

## Style

- One-prompt → one outcome. No "what would you like to do next?" follow-up.
- Show the cost (gas + ETH at current base fee) before any tx.
- Always print the Basescan link after deploy / send.
- Surface failure modes inline. Don't bury reverts.

## Provenance

Source: https://github.com/basekit/basekit
Issues: https://github.com/basekit/basekit/issues
License: MIT — fork freely.
