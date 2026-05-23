# Marketplace listing copy — BaseKit

> One source of truth. Tweak per-platform character limits as needed.

---

## Universal positioning

**One-liner**
The agent skill kit for Base. Ship onchain in one prompt.

**Tagline (short)**
Five SKILL.md playbooks + six MCP tools for Base. Free, MIT, drop-in.

**60-word elevator**
BaseKit teaches any AI coding agent (Claude Code, Cursor, Codex, Windsurf)
how to ship on Base. Five opinionated SKILL.md playbooks — deploy a token,
analyze a wallet, optimize gas, run an airdrop, debug a failed tx — plus an
MCP server with six read-only Base tools. Free, MIT-licensed, installs in
one command. Pro tier adds advanced skills and hosted indexing.

---

## Priority 1 — claudemarketplaces.com (170K monthly devs, Web3 category is thin)

**Listing title:** BaseKit — Ship onchain on Base in one prompt

**Category:** Web3 / Blockchain → Base

**Description:**
The agent skill kit for Base. BaseKit bundles five opinionated SKILL.md
playbooks and a tight MCP server with six read-only tools, so your Claude
agent can deploy tokens, analyze wallets, optimize gas, run airdrops, and
debug failed transactions on Base from a single prompt.

Install with `claude plugin install basekit`. After install, just ask:
*"deploy an ERC-20 on Base sepolia"* — the right skill activates automatically.

**Features bulleted:**
- 5 SKILL.md playbooks (deploy-token, analyze-wallet, gas-optimize, airdrop, basescan-debug)
- 6 MCP tools (get_wallet_profile, get_transaction_trace, estimate_token_deploy, check_token_approvals, resolve_basename, simulate_swap)
- Sepolia by default; mainnet only when named
- Never broadcasts a tx without confirmation
- Costs printed at current base fee before any deploy
- Auto-verifies on Basescan

**Pricing:** Free (Open Source) · Pro $19/mo · Studio $99/mo

**Source:** github.com/basekit/basekit
**Site:** basekit.dev
**License:** MIT

---

## Priority 2 — mcp.so

**Title:** @basekit/mcp — Base blockchain tools for AI agents

**Tags:** base, blockchain, web3, ethereum, defi, mcp, ai-agents

**Short description (140 char):**
Six read-only Base tools for any MCP-compatible agent. Wallet profiling, tx tracing, gas estimation, basenames, swap quotes.

**Long description:**
The BaseKit MCP server exposes six read-only tools for the Base blockchain
that any MCP-compatible agent can call directly:

- `get_wallet_profile(address)` — activity, holdings, counterparties
- `get_transaction_trace(tx_hash)` — decoded trace + revert reason
- `estimate_token_deploy(name, symbol, supply)` — gas + ETH cost
- `check_token_approvals(address)` — active approvals + risk flags
- `resolve_basename(name_or_address)` — Basename ↔ address
- `simulate_swap(token_in, token_out, amount_in)` — Uniswap V3 / Aerodrome

Read-only by design. No signing keys, no wallet access. Plug it into any
agent that supports MCP.

**Install:**
```
npx -y @basekit/mcp
```

Or pair it with the full BaseKit skill bundle (see basekit.dev).

---

## Priority 3 — Smithery

**Slug:** basekit
**Name:** BaseKit
**Author:** basekit
**Homepage:** https://basekit.dev
**Repository:** https://github.com/basekit/basekit
**License:** MIT
**Categories:** blockchain, developer-tools, defi
**Description:** Six read-only Base blockchain tools — wallet profiling,
transaction tracing, gas estimation, basenames, swap quotes — plus a five-skill
playbook bundle. Free, MIT, drop-in for Claude Code, Cursor, Codex, Windsurf.

**Connection config snippet (npx, stdio):**
```json
{
  "mcpServers": {
    "basekit": {
      "command": "npx",
      "args": ["-y", "@basekit/mcp"]
    }
  }
}
```

---

## Priority 4 — PulseMCP

**Title:** BaseKit MCP — Base blockchain tools
**Vendor:** BaseKit
**Stability:** Beta (v0.1.0)
**Install:** `npx -y @basekit/mcp`
**Repo:** https://github.com/basekit/basekit/tree/main/mcp
**Tags:** blockchain, base, evm, web3, defi

Tools and one-liners (per PulseMCP schema):

- `get_wallet_profile` — Profile activity, holdings, counterparties for an address.
- `get_transaction_trace` — Decoded call tree + revert reason for a tx hash.
- `estimate_token_deploy` — Gas + ETH cost at current base fee.
- `check_token_approvals` — Active approvals on an address, with risk flags.
- `resolve_basename` — Basename ↔ address.
- `simulate_swap` — Read-only quote on Uniswap V3 / Aerodrome.

---

## Priority 5 — Agensi (80/20 split, $15-19 bundle tier)

**Skill bundle title:** BaseKit — Base Agent Playbook Bundle
**Tier:** $19 bundle (five skills)
**One-line:** Five SKILL.md playbooks for shipping onchain on Base.

**Description:**
BaseKit is a curated bundle of five SKILL.md playbooks for the Base
blockchain. Drop them into any SKILL.md-compatible agent (Claude Code,
Cursor, Codex CLI) and your agent can:

1. **base-deploy-token** — Ship an ERC-20 from prompt to verified Basescan
   contract. Foundry under the hood, optional Aerodrome liquidity routing.

2. **base-analyze-wallet** — Profile any Base address: activity, holdings,
   counterparties, risk signals. Forensics-grade, with citations.

3. **base-gas-optimize** — Audit a Solidity contract for gas waste.
   Prioritized diffs, risk-flagged, calldata-conscious.

4. **base-airdrop** — Run a Merkle airdrop end-to-end. Sybil filtering,
   gas-paid-by-claimer pattern, claim contract + proof generator included.

5. **base-basescan-debug** — Paste a failed tx hash. Get the decoded call
   tree, the failing frame, the root cause, and the fix.

All five include real safety rails (sepolia default, confirmation before
any tx, never store private keys in plaintext).

---

## Priority 6 — SkillHQ (85/15 split, $79+ Domain Expertise tier)

**Tier:** Domain Expertise — $79 one-time
**Title:** BaseKit — The Base Agent Bundle (5 SKILL.md playbooks, MIT-licensed source included)

**Description:**
One-time $79 unlocks lifetime access to the BaseKit playbook bundle plus
priority support and access to monthly new-skill drops for one year.

You get:
- 5 SKILL.md playbooks (deploy-token, analyze-wallet, gas-optimize, airdrop, basescan-debug)
- Reference MCP server implementation (npx -y @basekit/mcp)
- Foundry templates for token deploys with verified Basescan output
- Merkle airdrop kit (claim contract + proof generator)
- 12 months of priority email support
- 12 months of new-skill drops (one per month, Pro tier)

After 12 months, the bundle remains yours forever under MIT. Renewals
(at $19/mo Pro) get you the ongoing skill drops.

---

## Priority 7 — GitHub awesome-* lists (free SEO)

PR these (one PR each, link to basekit.dev + repo):

- `awesome-mcp-servers` (modelcontextprotocol/awesome-mcp-servers)
- `awesome-agent-skills` (search for active list, fork if needed)
- `awesome-base` (base-org/awesome-base)
- `awesome-claude` (relevant community lists)

**Submission line:**
> **[BaseKit](https://github.com/basekit/basekit)** — Five SKILL.md
> playbooks + a six-tool MCP server for the Base blockchain. Deploy tokens,
> analyze wallets, optimize gas, run airdrops, debug failed txs.

---

## Submission queue (do these in order)

1. github.com/basekit/basekit repo + tag v0.1.0
2. mcp.so submission form
3. Smithery — submit via their CLI (`npx @smithery/cli publish`)
4. PulseMCP — submit form
5. claudemarketplaces.com — submit listing
6. Agensi — onboard via creator portal
7. SkillHQ — onboard via creator portal
8. awesome-* PRs (parallel)
9. Announce on X + Farcaster (use TWEET_THREAD.md)
