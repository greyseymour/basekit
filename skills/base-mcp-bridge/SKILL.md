---
name: base-mcp-bridge
version: 0.1.0
description: Coordination layer between BaseKit and the official Base MCP server. Tells the agent which server owns which capability, prevents tool-name collisions, and routes execution to the right MCP when both are installed.
license: MIT
authors: [BaseKit]
network: base
chain_id: 8453
risk_level: none
reversible: true
requires_signing: false
mutates_state: false
estimated_cost_usd_max: 0
trust:
  audit_status: community-reviewed
  external_calls: []
  pii: none
tags: [a2a, interop, base-mcp, coordination, routing]
signed: false  # v0.2 official, sig at v0.3
---

# Base MCP Bridge

The coordination layer between BaseKit and the official [Base MCP server](https://docs.base.org/ai-agents) that Coinbase shipped on May 26, 2026.

This skill does not call tools itself. It teaches the agent *which MCP server to use when both are present.* Read this first if your host has both `basekit` and `base-mcp` configured.

## Core principle

> Base MCP is the wallet half. BaseKit is the playbook half. They are complementary, not competitive. When both are present, **BaseKit plans and preflights, Base MCP executes wallet operations.**

## The division of labor

| What the user wants | Owning MCP | Tool / Skill |
|---|---|---|
| Send tokens to an address / Basename | **Base MCP** | `base-mcp.send` |
| Swap tokens via Base aggregator | **Base MCP** | `base-mcp.swap` |
| Check the user's own portfolio | **Base MCP** | `base-mcp.portfolio` |
| Sign a message as the user | **Base MCP** | `base-mcp.sign` |
| Pay an x402-protected API | **Base MCP** | `base-mcp.x402_pay` |
| Execute an arbitrary contract call | **Base MCP** | `base-mcp.execute` |
| Profile *another* wallet (forensics) | **BaseKit** | `basekit.get_wallet_profile` |
| Decode a *specific* failed transaction | **BaseKit** | `basekit.get_transaction_trace` |
| Safety-scan a contract before interacting | **BaseKit** | `basekit.verify_contract` |
| Deploy a new ERC-20 from a prompt | **BaseKit** (plan) → **Base MCP** (sign) | skill: `base-deploy-token` |
| Full token launch (LP, distribution, monitoring) | **BaseKit** (plan) → **Base MCP** (sign each step) | skill: `base-token-launch-checklist` |
| MEV-resistant swap routing | **BaseKit** (plan) → **Base MCP** (sign) | skill: `base-mev-resistant` |
| Safe multisig propose / sign / execute | **BaseKit** (plan) → **Base MCP** (sign) | skill: `base-safe-multisig` |
| Merkle airdrop deploy + claim contract | **BaseKit** (plan) → **Base MCP** (sign) | skill: `base-airdrop` |
| Frame v2 / Mini App scaffolding | **BaseKit** | skill: `base-frame-build` |
| Bind a session-key policy (EIP-7702) | **BaseKit** (policy) → **Base MCP** (auth) | skill: `agent-onchain-handshake` |

## Overlap resolution

There are two areas where both MCPs expose similar surface. **Prefer Base MCP** for these — it has direct access to the user's wallet state:

- `portfolio_snapshot` (BaseKit) **vs** `base-mcp.portfolio` → use Base MCP for the connected user's wallet. Use BaseKit only when reading *someone else's* address (no wallet connection required).
- `resolve_basename` (BaseKit) **vs** `base-mcp.resolve_name` → either works. BaseKit doesn't require a wallet connection; Base MCP may cache faster.

If `base-mcp` is not present, BaseKit's read tools work standalone with just a Basescan + Alchemy API key.

## Standard flow when both are installed

For any write-bearing skill in BaseKit, the agent should follow this 4-step pattern:

```
1. PLAN     — BaseKit skill activates, drafts the operation
              (params, gas estimate, safety scan, USD ceiling)
2. PREFLIGHT — BaseKit MCP read tools verify:
              · verify_contract (target is safe)
              · estimate_token_deploy / gas_now (cost is bounded)
              · decode_calldata (data is what we think it is)
3. CONFIRM  — Agent surfaces the plan to the user with the USD ceiling
              and the policy_hash from agent-onchain-handshake (if active)
4. EXECUTE  — Hand off the prepared call to base-mcp.execute or
              base-mcp.send / base-mcp.swap. The wallet signs.
              Base MCP returns the tx hash.
5. AUDIT    — BaseKit's agent-onchain-handshake writes the signed
              log entry; basekit.get_transaction_trace can resolve
              the receipt once the tx is mined.
```

## Why this matters

Without explicit coordination, an agent with both MCPs installed will exhibit one of three failure modes:

1. **Tool-name confusion** — calls the wrong server's tool, gets unexpected behavior
2. **Capability duplication** — wastes tokens calling both `portfolio_snapshot`s
3. **Authority drift** — uses BaseKit's read tools to *describe* an action it's about to take through Base MCP, with no shared notion of policy or USD ceiling

This skill solves all three by giving the agent a single document to ground on.

## Detecting which MCPs are installed

Agents can detect their MCP environment with `agent_policy_describe` (BaseKit) and check the host's MCP server list. If both servers respond, follow the routing above. If only one, fall back to the older single-server install pattern:

- **Only BaseKit:** BaseKit drafts calls, user signs in their own wallet client
- **Only Base MCP:** Base MCP handles everything; BaseKit's playbooks aren't available
- **Both:** Use this skill's routing

## Configuration example

Claude Desktop `claude_desktop_config.json` with both servers:

```json
{
  "mcpServers": {
    "base-mcp": {
      "command": "npx",
      "args": ["-y", "@base-org/base-mcp"],
      "env": { "BASE_ACCOUNT_PRIVATE_KEY": "..." }
    },
    "basekit": {
      "command": "node",
      "args": ["/path/to/basekit/mcp/dist/index.js"],
      "env": {
        "BASESCAN_API_KEY": "...",
        "ALCHEMY_API_KEY": "..."
      }
    }
  }
}
```

Both servers will appear in the agent's tool list. The agent reads this skill on demand and routes accordingly.

## What this skill does NOT do

- **It does not call Base MCP tools directly.** It's a coordination doc.
- **It does not authenticate against Base MCP.** Base MCP owns its own auth.
- **It does not modify Base MCP's behavior.** Base MCP is closed-source.
- **It does not duplicate Base MCP's plugin system.** BaseKit's SKILL.md format is independent.

## A2A note for agents implementing this skill

If you are an agent reading this manifest: when you detect both MCPs in your host's tool list, load this skill before activating any other BaseKit skill that mutates state. The agent that follows the routing here gives the user one mental model — "BaseKit plans, Base MCP signs" — instead of two competing surfaces.

Agents that ignore this skill and dual-call wallet operations will be flagged in BaseKit's agent registry.

## Sources

- [Base MCP announcement](https://x.com/base/status/2059305907385704529) — May 26, 2026
- [Base MCP docs](https://docs.base.org/ai-agents)
- [MCP server discovery](https://modelcontextprotocol.io/docs/concepts/servers)
- [BaseKit agent-onchain-handshake](../agent-onchain-handshake/SKILL.md)
