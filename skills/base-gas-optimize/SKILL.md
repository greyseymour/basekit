---
name: base-gas-optimize
description: Use this skill when the user wants to reduce gas costs in a Solidity contract destined for Base. Identifies common gas-inefficient patterns (storage packing, unbounded loops, redundant SSTOREs, costly external calls), suggests Base-specific optimizations (Base's compressed calldata pricing, sequencer fee structure), and produces a prioritized list of fixes with estimated savings.
license: MIT
version: 0.1.0
authors:
  - "BaseKit <basekit.dev>"
homepage: https://basekit.dev
keywords:
  - base
  - gas
  - optimization
  - solidity
  - foundry
  - efficiency
network: base
chain_id: 8453
risk_level: none
reversible: true
requires_signing: false
mutates_state: false
estimated_cost_usd_max: 0.00
trust:
  audit_status: community-reviewed
  external_calls: [Base RPC]
  pii: none
---

# Gas Optimization for Base Contracts

Review a Solidity contract and produce a prioritized gas-optimization report. Base inherits Ethereum gas semantics but has unique L2 economics (calldata costs dominate, sequencer fee).

## When to use this skill

Activate when the user says any of:
- "optimize gas for this contract on Base"
- "reduce gas costs" / "make this cheaper"
- "audit gas usage"
- pastes a Solidity contract with "for Base"

Do NOT activate for: gas estimation for a single tx (use cast/web3), general Solidity review (use a coding skill), or non-EVM chains.

## Required inputs

1. **Contract source** — paste, file path, or deployed address (will fetch from Basescan if verified)
2. **Hot paths** — which functions are called most? (Optimize those first.)
3. **Budget for breaking changes** — strict ABI preservation, or willing to break compatibility for savings?

## Playbook

### Step 1: Static review checklist

Walk through the contract and flag each:

**Storage layout**
- [ ] Are storage slots packed? (e.g. two `uint128`s share a slot; `uint8` next to a `uint256` wastes 31 bytes.) Reorder declarations to pack.
- [ ] Are constants `constant` or `immutable`? Both avoid SSTORE.
- [ ] Any unused storage variables? Delete.

**Function patterns**
- [ ] `external` instead of `public` for functions never called internally (saves on calldata copying)
- [ ] `calldata` instead of `memory` for read-only array/string params
- [ ] Cache storage reads in memory inside loops (`uint256 _len = arr.length;`)
- [ ] Use `unchecked { ++i; }` in for-loops where overflow is impossible (Solidity ≥0.8.0)
- [ ] Replace `require(x, "...")` strings with custom errors (`error InsufficientBalance();`)

**Math**
- [ ] Bitshift for power-of-2 multiplication/division (`x << 1` vs `x * 2`)
- [ ] Avoid `SafeMath` on Solidity ≥0.8 (built-in checks)

**External calls**
- [ ] Cache contract references (`IERC20 _token = token;`)
- [ ] Batch reads via Multicall3 (deployed on Base at `0xcA11bde05977b3631167028862bE2a173976CA11`)
- [ ] Use staticcall for view functions where appropriate

**Base-specific**
- [ ] Calldata is the dominant cost on Base — minimize calldata size. Pack args, use shorter function selectors when possible.
- [ ] Avoid emitting redundant events; events go in calldata and contribute to L1 data costs.

### Step 2: Run gas snapshot

If foundry is available:

```bash
forge snapshot --diff .gas-snapshot.before
```

Capture before/after when applying optimizations.

For per-function gas:

```bash
forge test --gas-report
```

### Step 3: Prioritize

Rank suggestions by:
1. **Frequency × savings.** Optimizing the most-called function trumps a one-shot optimization in `init()`.
2. **Risk.** Storage layout changes break upgradeable contracts — flag carefully.
3. **Readability cost.** Some optimizations (assembly, bit-packing) reduce readability significantly. Trade off explicitly.

Output as:

```markdown
## Gas Optimizations — Prioritized

| # | Optimization | Hot path | Est. savings/call | Risk | Recommended |
|---|---|---|---|---|---|
| 1 | Pack `lastUpdated` (uint64) with `owner` (address) | transfer() | ~5,000 gas | Low | ✅ Yes |
| 2 | Custom errors instead of revert strings | All | ~50-200 gas | Low | ✅ Yes |
| 3 | unchecked++ in distribute() loop | distribute() | ~50 gas/iter | Low | ✅ Yes |
| ... | | | | | |
```

### Step 4: Generate the diff

For each accepted optimization, write the exact code change as a diff. Avoid bundling unrelated changes — one optimization per diff makes review easier.

## Safety rails

- **Do not suggest assembly unless asked.** Assembly removes Solidity's safety guarantees. If user asks, prefix with: "Assembly optimization recommended. Test coverage MUST include fuzz tests before deploying."
- **Flag breaking changes loudly.** Storage layout reorders, function visibility changes, or signature changes break ABI compatibility.
- **Never optimize unaudited code for production without recommending an audit pass after.** Gas optimizations can introduce subtle bugs.

## Common patterns

**Anti-pattern: unbounded loops**
```solidity
// BAD — gas DoS attack vector
for (uint i = 0; i < users.length; i++) {
    payable(users[i]).transfer(amount);
}

// GOOD — pull pattern
mapping(address => uint256) public claimable;
function claim() external {
    uint256 amt = claimable[msg.sender];
    claimable[msg.sender] = 0;
    payable(msg.sender).transfer(amt);
}
```

**Anti-pattern: redundant SLOAD in loop**
```solidity
// BAD
for (uint i = 0; i < users.length; i++) { ... }

// GOOD
uint256 len = users.length;
for (uint i = 0; i < len; ) {
    ...
    unchecked { ++i; }
}
```

**Base-specific: prefer calldata-light interfaces**
```solidity
// BAD — long function selectors and large structs in calldata cost L1 gas
function processVeryDescriptiveLongFunction(LargeStruct calldata data) external

// GOOD — short selectors, packed args
function process(bytes32 packedData) external
```

## Related skills

- `base-basescan-debug` — diagnose where gas is being spent in a deployed contract
- `base-deploy-token` — apply these patterns to a fresh token deploy
