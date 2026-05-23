---
name: base-contract-verify
version: 0.1.0
description: Verify a contract address on Base — source on Basescan, ABI integrity, proxy implementation, ownership graph, honeypot heuristics, allowance risk.
license: MIT
authors: [BaseKit]
network: base
chain_id: 8453
risk_level: none
reversible: true
requires_signing: false
mutates_state: false
estimated_cost_usd_max: 0.00
trust:
  audit_status: community-reviewed
  external_calls: [Basescan API, Base RPC, GoPlus, DeFiLlama]
  pii: none
tags: [security, verification, audit, agent-safety]
---

# Base Contract Verify

The single most important skill for an agent buying/using anything onchain on someone's behalf: **is this contract safe to interact with?**

Outputs a structured trust report so downstream agents can decide whether to proceed.

## Output schema

```json
{
  "address": "0x...",
  "verdict": "safe" | "caution" | "danger" | "unknown",
  "confidence": 0.92,
  "checks": {
    "source_verified": true,
    "creation_block": 12345678,
    "creator": "0x...",
    "is_proxy": false,
    "implementation": null,
    "deployed_via": "EOA" | "factory" | "create2",
    "owner": "0x...",
    "owner_type": "EOA" | "multisig" | "renounced" | "contract",
    "has_mint": false,
    "has_pause": false,
    "has_blacklist": false,
    "has_fee_on_transfer": false,
    "fee_bps_current": 0,
    "fee_bps_max": 0,
    "is_upgradeable": false,
    "upgrade_admin": null
  },
  "external": {
    "goplus_score": 1,
    "defillama_protocol": "Aerodrome",
    "tokenlist_match": true,
    "age_days": 412,
    "tx_count": 8421052
  },
  "warnings": [
    "Owner is EOA, not multisig — can change fees unilaterally"
  ]
}
```

## Procedure

### Step 1 — Source verification

```bash
curl "https://api.basescan.org/api?module=contract&action=getsourcecode&address=$ADDR&apikey=$KEY"
```

- `SourceCode` empty → `source_verified: false`. STOP. Verdict at best `caution`, usually `danger`.
- `Proxy: "1"` → fetch `Implementation` and verify it too. Use the implementation's source for the rest of the analysis.

### Step 2 — Bytecode static analysis

Pull `eth_getCode(address)` and look for these selectors. Each is a flag, not necessarily bad — context matters:

| Selector | Function | Risk |
|---|---|---|
| `0x40c10f19` | `mint(address,uint256)` | High if no cap |
| `0x8456cb59` | `pause()` | High if can be called post-renounce |
| `0xf9f92be4` | `setBlacklist(address)` | Critical — almost always rugpull |
| `0xf2fde38b` | `transferOwnership` | OK if already used to send to multisig/zero |
| `0x715018a6` | `renounceOwnership` | Good if already called |
| `0x3659cfe6` | `upgradeTo(address)` | High — upgradeable proxy |

### Step 3 — Ownership graph

- Owner is `0x0` → renounced (best case for tokens)
- Owner is a contract → check that contract recursively (max depth 3)
- Owner is an EOA with < 30 days age → red flag
- Owner is a Safe multisig with 1/1 threshold → effectively an EOA

### Step 4 — External cross-checks

- GoPlus token security API (free tier): `https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=$ADDR`
- DeFiLlama protocol list: match by address
- Base tokenlist: match by address

### Step 5 — Compose verdict

```
safe:    source verified + (renounced OR multisig owner) + no dangerous selectors + age > 30d + tokenlist match
caution: source verified + minor flags (e.g., EOA owner, transferable, age < 30d)
danger:  blacklist OR uncapped mint by EOA OR fee_bps_max > 1000 OR unverified
unknown: cannot fetch source or RPC fails
```

## Allowance check (for any token you plan to approve)

Before approving spending to a contract, also check:
- Has the contract requested abnormally large allowances from other users? (Etherscan tx history)
- Does the contract's source include `transferFrom` that can be triggered by addresses other than the spender? (Backdoor pattern)
- Is the contract a known router (Uniswap Universal, 0x, etc.)? Cross-check against curated allowlist.

Always prefer `approve(exactAmount)` over `approve(max)` — and revoke after.

## A2A note for autonomous agents

This skill is **mandatory** before any agent calls a contract on a user's behalf, unless the contract is on the agent's pre-approved allowlist (curated, in-skill).

Recommended agent policy:
```yaml
contract_interaction_policy:
  pre_check: base-contract-verify
  block_on: ["danger", "unknown"]
  human_confirm_on: ["caution"]
  proceed_silent_on: ["safe"]
```

Cache verdicts for 24h per contract. Re-check if the implementation address of a proxy changes.

## Sources

- [Basescan API](https://docs.basescan.org)
- [GoPlus Security API](https://docs.gopluslabs.io/reference/api-overview)
- [DeFiLlama Protocols](https://defillama.com/docs/api)
- [Base tokenlist](https://github.com/base/tokenlist)
