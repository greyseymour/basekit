---
name: base-mev-resistant
version: 0.1.0
description: Execute swaps and token launches on Base with MEV protection — private mempools, commit-reveal, slippage guards, sandwich detection.
license: MIT
authors: [BaseKit]
network: base
chain_id: 8453
risk_level: medium
reversible: false
requires_signing: true
mutates_state: true
estimated_cost_usd_max: 5.00
trust:
  audit_status: community-reviewed
  external_calls: [Flashbots Protect, MEV-Share, Base RPC]
  pii: none
tags: [mev, swap, launch, defi, protection]
signed: false  # v0.2 official, sig at v0.3
---

# Base MEV-Resistant Execution

Protect onchain actions on Base from sandwich attacks, frontrunning, and JIT liquidity drains. Use whenever a transaction's success depends on price stability or ordering — DEX swaps over $500, token launches, large NFT mints, claim transactions on heavy-attention drops.

## When to use

- DEX swap > $500 notional, OR token with < $1M liquidity at any size
- New token launch where snipers will frontrun the LP add
- NFT mint with allowlist + public phases
- Any tx where reverting and retrying costs less than getting sandwiched

## When NOT to use

- Sub-$100 swaps on deep liquidity (USDC/ETH, USDC/cbBTC): the protection overhead exceeds the MEV risk
- Time-critical executions where private mempool latency (1-3 blocks) is unacceptable
- Transactions that must land in a specific block

## Core technique: three-layer protection

### Layer 1 — Private mempool routing

Send the raw tx to a private relay instead of the public Base RPC. Searchers can't see your tx until it's already in a block.

Endpoints (free, in order of recommended fallback):
1. Flashbots Protect on Base — `https://rpc.flashbots.net/fast?network=base` (when available)
2. MEV-Share Base relay — `https://mev-share.flashbots.net/base`
3. Direct sequencer submission — `https://mainnet-sequencer.base.org`

```ts
import { createWalletClient, http } from 'viem';
import { base } from 'viem/chains';

const wallet = createWalletClient({
  chain: base,
  transport: http('https://mainnet-sequencer.base.org'),
  account,
});
```

### Layer 2 — Slippage and deadline as hard guards

Never trust the router's default. Compute slippage from current pool depth and recent volatility:

```ts
const slippageBps = Math.min(
  300, // hard cap 3%
  Math.max(20, Math.ceil(volatility24h * 100) + Math.ceil(amountInUsd / poolDepthUsd * 1000))
);
const minOut = (quotedOut * BigInt(10_000 - slippageBps)) / 10_000n;
const deadline = BigInt(Math.floor(Date.now() / 1000) + 90); // 90s max
```

### Layer 3 — Commit-reveal for launches

For token launches, deploy + LP-add must be atomic OR use commit-reveal:

```solidity
// Pseudocode pattern
function commitLaunch(bytes32 commitment) external onlyOwner {
  commitments[commitment] = block.number;
}
function revealAndLaunch(uint256 salt, address token, uint256 liquidity)
  external onlyOwner
{
  require(block.number > commitments[keccak256(abi.encode(salt, token, liquidity))] + 2);
  // ... add liquidity in same tx as enabling trading
}
```

## Sandwich detection (post-trade verification)

After every swap, sample the 2 blocks before and after for opposite-direction swaps from a single address against your pool:

```ts
const suspect = await detectSandwich({
  pool: poolAddress,
  txBlock: receipt.blockNumber,
  window: 2,
});
if (suspect.confidence > 0.7) {
  log('Likely sandwich', suspect.attackerAddress, suspect.estimatedLossUsd);
}
```

## Quick checklist

- [ ] Slippage ≤ 3% with computed floor at 0.2%
- [ ] Deadline ≤ 90 seconds
- [ ] Private RPC for any swap > $500
- [ ] No `approve(max)` — use exact amounts
- [ ] Simulate via `eth_call` first; revert if simulated output < minOut

## A2A note for autonomous agents

This skill is **safe to run unattended** for swap amounts ≤ user-configured budget. Agents should:
- Read `risk_level: medium` and `reversible: false` before executing
- Check user's `max_per_tx_usd` from agent config; abort if exceeded
- Always log `simulated_out`, `actual_out`, `slippage_realized` for audit
- Never set slippage > 300 bps even if user requests it; require human confirmation

## Sources

- [Flashbots Protect docs](https://docs.flashbots.net/flashbots-protect/overview)
- [Base sequencer endpoint](https://docs.base.org/network-information)
- [MEV-Share spec](https://github.com/flashbots/mev-share)
