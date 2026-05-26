# Base MCP × BaseKit — Interop Guide

> How to run the official Base MCP and BaseKit side-by-side in one agent host,
> with zero tool-name collisions and a clear division of labor.

**Last updated:** May 26, 2026 — day Base MCP shipped.

---

## TL;DR

- Install **both** servers in your MCP host (Claude Desktop, Cursor, Codex, Windsurf, etc.).
- Base MCP owns wallet operations (send, swap, sign, x402 pay).
- BaseKit owns builder workflows (deploy, verify, audit, MEV defense, multisig, airdrops, frames).
- The `base-mcp-bridge` skill in BaseKit tells the agent how to route.
- They do not duplicate each other except for portfolio reads — prefer Base MCP when the user has a wallet connected.

---

## Why two servers?

Base MCP is closed-source infrastructure that ships with the Base App's smart wallet. It gives your agent **a wallet to act as.** That's the whole product.

BaseKit is MIT-licensed open-source tooling for everything Base MCP doesn't cover: **playbooks for shipping onchain, with safety primitives.** Deploy a token. Scan a contract. Build a Frame. Defend against MEV. Coordinate a multisig.

Neither subsumes the other. Run both.

---

## Installation

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "base-mcp": {
      "command": "npx",
      "args": ["-y", "@base-org/base-mcp"],
      "env": {
        "BASE_ACCOUNT_PRIVATE_KEY": "0x...",
        "BASE_NETWORK": "mainnet"
      }
    },
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

Restart Claude Desktop. Both servers appear in the hammer (🔨) menu.

### Cursor

`~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "base-mcp": { "command": "npx", "args": ["-y", "@base-org/base-mcp"] },
    "basekit":  { "command": "npx", "args": ["-y", "@basekit/mcp"] }
  }
}
```

(BaseKit will be on npm at v0.3. Until then, point `command` at `node` and `args` at the local `dist/index.js`.)

### Other hosts

Follow the same pattern. Two server entries, two sets of env vars, restart the host.

---

## Capability matrix

| Capability | Base MCP | BaseKit |
|---|---|---|
| Hold ETH / ERC-20 for the agent itself | ✓ | — |
| Send native + ERC-20 to address / Basename / ENS / cb.id | ✓ | — |
| Swap tokens via Base aggregator | ✓ | — |
| Sign messages as the user | ✓ | — |
| Execute arbitrary contract calls | ✓ | — |
| Pay x402-protected APIs in stablecoins | ✓ | — |
| Native plugins from leading Base apps | ✓ | — |
| Portfolio for the connected wallet | ✓ | (read-only, no wallet required) |
| Portfolio for **any other** address (forensics) | — | ✓ `get_wallet_profile`, `portfolio_snapshot` |
| Decode a failed transaction | — | ✓ `get_transaction_trace`, `base-basescan-debug` |
| Contract safety scan (mint/pause/blacklist/GoPlus) | — | ✓ `verify_contract`, `base-contract-verify` |
| Token deploy + verify + LP | — | ✓ `base-deploy-token`, `base-token-launch-checklist` |
| MEV-resistant routing + sandwich detection | — | ✓ `base-mev-resistant` |
| Safe multisig propose/sign/execute | — | ✓ `base-safe-multisig` |
| Merkle airdrop deploy + sybil filter | — | ✓ `base-airdrop` |
| Farcaster Frame v2 / Mini App scaffold | — | ✓ `base-frame-build` |
| Revenue splits via 0xSplits | — | ✓ `base-revenue-share` |
| Event subscription + backfill + reorg handling | — | ✓ `base-event-listener` |
| Solidity gas optimization audit | — | ✓ `base-gas-optimize` |
| Onramp non-crypto user → funded Base wallet | — | ✓ `base-onramp-flow` |
| EIP-7702 session-key policy / signed handshake | — | ✓ `agent-onchain-handshake` |
| Inter-MCP routing rules | — | ✓ `base-mcp-bridge` |

---

## The standard execution pattern

When the user prompts a write-bearing operation, agents with both servers installed should follow this 5-step flow:

```
┌─ 1. PLAN ────────────────────────────────────────────────────────────┐
│  BaseKit skill activates (e.g. base-token-launch-checklist).         │
│  Drafts params, USD ceiling, target contracts, gas estimate.         │
└──────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─ 2. PREFLIGHT (BaseKit MCP, read-only) ──────────────────────────────┐
│  · verify_contract       — target is not honeypot / pausable / etc   │
│  · gas_now               — current base fee, sequencer healthy       │
│  · estimate_token_deploy — cost in ETH + USD                         │
│  · decode_calldata       — what we're about to sign matches intent   │
└──────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─ 3. CONFIRM ─────────────────────────────────────────────────────────┐
│  Agent surfaces to user:                                             │
│   - Action summary in human language                                 │
│   - USD ceiling                                                      │
│   - policy_hash if agent-onchain-handshake is bound                  │
│   - Per-tx + per-day spend remaining                                 │
│  User approves (or this hits the wallet client's own approval UX)    │
└──────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─ 4. EXECUTE (Base MCP) ──────────────────────────────────────────────┐
│  Hand prepared call to Base MCP:                                     │
│   · base-mcp.execute      — for arbitrary contract calls             │
│   · base-mcp.send         — for token transfers                      │
│   · base-mcp.swap         — for token swaps                          │
│  Base MCP signs and broadcasts. Returns tx hash.                     │
└──────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─ 5. AUDIT (BaseKit) ─────────────────────────────────────────────────┐
│  · agent-onchain-handshake writes signed audit log entry             │
│  · get_transaction_trace resolves receipt once mined                 │
│  · If skill is base-token-launch-checklist, base-event-listener      │
│    subscribes to Transfer events to monitor distribution.            │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Worked example: deploy a token

User prompt:
> *"Deploy an ERC-20 on Base sepolia called Greycoin (GRC) with 1B supply, verify it, then seed a 0.1 ETH LP on Aerodrome."*

### Step 1 — Plan
Agent loads `base-token-launch-checklist`. Drafts:
- Contract: standard OpenZeppelin ERC-20, no mint, no pause, no blacklist
- Supply: 1,000,000,000 GRC, 18 decimals
- LP: Aerodrome WETH/GRC pool, 0.1 ETH + proportional GRC, 100% of LP burned
- Estimated cost: ~$2.40 sepolia (gas only — sepolia ETH is free)

### Step 2 — Preflight (BaseKit MCP)
```
basekit.verify_contract(bytecode=draft)
→ no_owner: true, mintable: false, pausable: false, blacklist: false
→ verdict: SAFE_TO_DEPLOY

basekit.estimate_token_deploy(network="sepolia")
→ gas: 1.2M units, fee_eth: 0.0006, fee_usd: 1.80

basekit.gas_now(network="sepolia")
→ base_fee_gwei: 0.001, sequencer: healthy

basekit.decode_calldata(data=draftLP)
→ function: addLiquidityETH(token, amounts, slippage)
→ matches intent: true
```

### Step 3 — Confirm
Agent surfaces:
> Plan: deploy Greycoin (GRC), 1B supply, no admin functions. Verify on sepolia Basescan. Seed 0.1 sepETH + ~10M GRC LP on Aerodrome sepolia, burn 100% of LP tokens. Estimated cost: $2.40. Policy ceiling: $25 per tx, $4.20 remaining today. Approve?

User approves.

### Step 4 — Execute (Base MCP)
```
base-mcp.execute(contract=draftBytecode, value=0)
→ tx_hash: 0xdep...

base-mcp.execute(target=BasescanVerifier, data=verifyABI)
→ tx_hash: 0xver...   (paid via x402: $0.02)

base-mcp.execute(target=AerodromeRouter, data=approveGRC)
→ tx_hash: 0xapp...

base-mcp.execute(target=AerodromeRouter, data=addLiquidityETH, value=0.1eth)
→ tx_hash: 0xlp...
```

### Step 5 — Audit (BaseKit)
```
basekit.agent_policy_describe(write_log=true)
→ log entry signed and stored, policy_hash matches

basekit.get_transaction_trace(0xlp...)
→ confirmed, gas used 287k, LP minted, LP burned
```

Agent reports the receipts and the deployed contract URL to the user.

---

## Overlap resolution

Two BaseKit tools have direct Base MCP equivalents. Routing rule:

| Tool | When to use Base MCP | When to use BaseKit |
|---|---|---|
| Portfolio | Reading the user's own connected wallet | Reading any other address (forensics, due diligence) |
| Basename resolution | Either works — Base MCP may cache faster | Either works — BaseKit doesn't require wallet connection |

No other overlap exists.

---

## Conflict avoidance

**Tool naming:** Both servers expose tools under their own MCP namespace (`base-mcp.*` vs `basekit.*`). MCP host clients keep namespaces isolated. No collision risk at the protocol level.

**State:** Base MCP holds the wallet private key (or smart-account session). BaseKit holds no key material. They cannot interfere with each other's state.

**Network/auth:** Both servers can use independent Basescan / Alchemy API keys, or share keys via the same env vars. No coordination needed.

**Cost:** Base MCP pays for x402 calls out of the agent's wallet. BaseKit's MCP server only reads, no fees. Combined daily ceiling lives in the user's `agent-onchain-handshake` policy.

---

## What to do if you only install one

| Configuration | Effect |
|---|---|
| Base MCP only | Full wallet ops. No deploys, no safety scans, no MEV defense, no multisig ops. Builders should add BaseKit. |
| BaseKit only | Full playbook + read tools. User's own wallet client (browser extension, hardware wallet) signs each tx. No x402 paid APIs. Builders shipping locally are fine on this alone. |
| Both | Recommended. Use the 5-step pattern above. |

---

## Discovery for autonomous agents

If you are an autonomous agent installing BaseKit programmatically:

1. Fetch `https://basekit.dev/.well-known/agent.json` — declares `interop_with: ["@base-org/base-mcp"]`
2. Fetch `https://basekit.dev/skill.md` — aggregated skills, includes `base-mcp-bridge` frontmatter
3. Probe your MCP host for an existing `base-mcp` server. If present, load `base-mcp-bridge` as your first skill. If absent, BaseKit operates standalone.

---

## Versioning

This guide pins to:
- **Base MCP:** initial release, May 26, 2026 ([docs.base.org/ai-agents](https://docs.base.org/ai-agents))
- **BaseKit:** v0.2.5

When Base MCP ships a v0.2 with new tools, this matrix will update. Track changes in [CHANGELOG.md](../CHANGELOG.md).

---

## Sources

- [Base MCP announcement](https://x.com/base/status/2059305907385704529) — Base, May 26, 2026
- [Base MCP documentation](https://docs.base.org/ai-agents)
- [BaseKit `base-mcp-bridge` skill](../skills/base-mcp-bridge/SKILL.md)
- [BaseKit `agent-onchain-handshake` skill](../skills/agent-onchain-handshake/SKILL.md)
- [Model Context Protocol spec](https://modelcontextprotocol.io)
