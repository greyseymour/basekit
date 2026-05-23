---
name: base-portfolio-snapshot
version: 0.1.0
description: Generate a read-only portfolio snapshot for any Base address — tokens, NFTs, DeFi positions, P&L, cost basis.
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
  external_calls: [Base RPC, Alchemy, CoinGecko, DexScreener]
  pii: address-only
tags: [portfolio, analytics, read-only, tax]
---

# Base Portfolio Snapshot

Build a complete read-only portfolio snapshot for any Base address. Zero signatures, zero state mutation — pure data assembly. Useful for agents preparing weekly digests, tax accounting, or just answering "what do I hold and what's it worth."

## Output schema

```json
{
  "address": "0x...",
  "snapshot_at": "2026-05-23T07:00:00Z",
  "block_number": 18450923,
  "totals": {
    "usd": 24891.42,
    "eth": 8.21,
    "tokens_count": 14,
    "nfts_count": 23,
    "positions_count": 4
  },
  "tokens": [
    {
      "symbol": "USDC",
      "address": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "balance": "8421.50",
      "usd_value": 8421.50,
      "cost_basis_usd": 8400.00,
      "pnl_usd": 21.50
    }
  ],
  "nfts": [...],
  "defi_positions": [
    {
      "protocol": "Aerodrome",
      "type": "LP",
      "pool": "USDC/AERO",
      "tvl_usd": 4200.00,
      "rewards_pending_usd": 18.42
    }
  ],
  "warnings": []
}
```

## Procedure

1. **Resolve identity** — if input is a basename (`.base.eth`), resolve via L2 Resolver. Cache for 1h.
2. **Token balances** — multicall `balanceOf` against the top 200 Base tokens by TVL (cached list). For long tail, use Alchemy's `alchemy_getTokenBalances`.
3. **NFT inventory** — Alchemy `getNFTsForOwner` with `withMetadata: true`, page through.
4. **DeFi positions** — query the major Base protocols' position adapters:
   - Aerodrome: `Voter.poolForGauge` + `gauge.balanceOf`
   - Moonwell: `mToken.balanceOf` + `borrowBalanceStored`
   - Aave v3 Base: `Pool.getUserAccountData`
   - Morpho Blue: `MorphoBlue.position(marketId, user)`
   - Uniswap v3 Base: `NonfungiblePositionManager.balanceOf` then iterate tokenIds
5. **Price each line** — CoinGecko for top tokens, DexScreener for long-tail Base tokens with > $10k 24h volume. Mark anything else `price_confidence: low`.
6. **Cost basis (optional)** — scan transfer history; FIFO accounting per asset. Skip if `cost_basis: false` in input.
7. **Build the warnings array** — flag positions with: pending liquidation, unclaimed rewards > $5, dust tokens that may be honeypots, expired LP ranges.

## Honeypot filter

Exclude any token where:
- 24h volume < $1k AND it appeared in the wallet via airdrop (not purchase)
- Contract is unverified AND name/symbol contains a URL or `.io`/`.app`
- Token-list cross-reference fails AND no liquidity > $5k in a verified pool

Add filtered tokens to a separate `suspicious` array — do not silently drop.

## A2A note for autonomous agents

This skill is **always safe to run** — no signing, no state changes, no cost. Run it on a schedule (hourly/daily) to feed downstream skills like `base-rebalance` or `base-tax-export`.

Recommended cadence:
- Hourly during active trading
- Daily for passive holders
- On-demand before any tx > $1k (sanity check the source wallet's full picture first)

## Sources

- [Alchemy Base API](https://docs.alchemy.com/reference/base-api-quickstart)
- [Aerodrome SDK](https://aerodrome.finance/docs)
- [Morpho Blue docs](https://docs.morpho.org)
- [Base token list](https://github.com/base/tokenlist)
