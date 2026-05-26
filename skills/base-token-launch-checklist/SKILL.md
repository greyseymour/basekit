---
name: base-token-launch-checklist
version: 0.1.0
description: End-to-end token launch on Base — from contract template selection through LP add, Basescan verify, holder distribution, and post-launch monitoring.
license: MIT
authors: [BaseKit]
network: base
chain_id: 8453
risk_level: high
reversible: false
requires_signing: true
mutates_state: true
estimated_cost_usd_max: 50.00
trust:
  audit_status: community-reviewed
  external_calls: [Base RPC, Basescan API, Aerodrome, Uniswap v3]
  pii: none
tags: [launch, token, erc20, defi]
signed: false  # v0.2 official, sig at v0.3
---

# Base Token Launch Checklist

A repeatable, opinionated playbook for launching an ERC-20 on Base. Built for memecoin launches, community tokens, and utility tokens up to $5M FDV. Above that, you want a custom audit — this is not it.

## Pre-launch (do these once, day-of-launch is fast)

### 1. Pick your template

| Template | Use when | Supply | Tax | Renounceable |
|---|---|---|---|---|
| `ERC20Plain` | Standard utility token | Fixed | None | Yes |
| `ERC20Capped` | Inflation-controlled | Capped, mintable | None | After cap |
| `ERC20WithAntiBot` | Memecoin, fair launch | Fixed | Optional 0-2% | Yes |
| `ERC20Vested` | Team allocation needed | Fixed | None | Partial |

Avoid: tokens with > 5% tax, blacklist functions, pause functions that survive renounce, hidden mint authority. These are red flags agents flag automatically.

### 2. Settle distribution

- **Liquidity:** ≥ 60% of total supply for fair launch, ≥ 30% for community launch with vesting
- **Team:** ≤ 15%, vested 6-24 months via Sablier or onchain vault
- **Treasury:** ≤ 10%, behind Safe multisig
- **Airdrop / community:** the remainder, with claim contract not direct transfer

### 3. Audit basics (free, do these)

- Slither: `slither contracts/Token.sol --filter-paths "node_modules"`
- 4naly3er: web tool, paste contract
- Run the contract through `base-contract-verify` skill's safety checks

## Launch day

### Step A — Deploy token

```bash
# With foundry
forge create src/Token.sol:Token \
  --rpc-url $BASE_RPC \
  --private-key $PK \
  --constructor-args "TokenName" "SYM" 1000000000000000000000000000 \
  --verify --etherscan-api-key $BASESCAN_API_KEY
```

Confirm verification: Basescan should show green checkmark within 60s.

### Step B — Lock metadata

Submit to:
- [Base token list](https://github.com/base/tokenlist) PR
- [CoinGecko](https://coingecko.com/en/coins/new-listing) submission
- [DexScreener](https://dexscreener.com) auto-indexes once LP exists

### Step C — Add liquidity (atomic with trading enable)

```solidity
// Combine in one tx (use multicall or a launcher contract)
1. token.approve(router, liquidityAmount)
2. router.addLiquidityETH{value: ethAmount}(token, liquidityAmount, ...)
3. token.enableTrading()  // if your template gates transfers
4. token.renounceOwnership()  // for fair launch
```

**Use `base-mev-resistant` for this transaction.** Snipers watch the mempool for `addLiquidity` calls.

### Step D — Holder distribution sanity check

After 10 minutes:
- Top 10 holders < 50% supply (excluding LP, treasury, vesting contracts)
- No single non-LP wallet > 5%
- At least 50 unique holders

If concentrated: pause public marketing, investigate, consider a follow-up airdrop.

## Post-launch monitoring (first 7 days)

Run hourly via cron or agent:
1. Pull holder count + top 10 distribution
2. Check LP hasn't been pulled (LP token balance of locker contract)
3. Volume / liquidity ratio — > 5× is healthy, > 50× is wash-trade red flag
4. Price chart sanity — > 90% drawdown in any 1h window triggers alert

## A2A note for autonomous agents

This skill is **high-risk and irreversible** in core steps (deploy, LP add, renounce). Agents executing this MUST:
- Require explicit user authorization signed within last 15 minutes
- Display the full parameter set + estimated cost to the user before each step
- Stop and ask after each step, not run end-to-end unattended
- Never auto-renounce — that's a human decision

## Sources

- [Base official deploy guide](https://docs.base.org/building-on-base/contracts/deployment)
- [Aerodrome LP guide](https://aerodrome.finance/docs/liquidity)
- [OpenZeppelin ERC-20 templates](https://docs.openzeppelin.com/contracts/5.x/erc20)
