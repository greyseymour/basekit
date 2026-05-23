---
name: base-analyze-wallet
description: Use this skill when the user asks to analyze, audit, score, or investigate a wallet address on Base. Returns activity profile (tx count, age, contract interactions), token holdings, NFT holdings, risk signals (mixer interaction, sanctioned addresses, scam token exposure), and notable counterparties. Works for forensics, due diligence, airdrop eligibility checks, and pre-trade screening.
license: MIT
version: 0.1.0
authors:
  - "BaseKit <basekit.dev>"
homepage: https://basekit.dev
keywords:
  - base
  - wallet
  - analytics
  - forensics
  - risk
  - basescan
  - alchemy
---

# Analyze a Wallet on Base

Build a wallet activity profile for an address on Base. Adapt depth based on user intent.

## When to use this skill

Activate when the user says any of:
- "analyze this wallet on Base" / "look up this address on Base"
- "is this wallet legit?" / "should I trade with this address?"
- "give me a profile of [0x...]" with Base context
- "check if [0x...] is eligible for [airdrop]"
- "find counterparties of [0x...]"

Do NOT activate for: non-Base chains (use chain-specific skills), contract analysis (different skill), or transaction-by-transaction analysis (use `base-basescan-debug`).

## Required inputs

1. **Address** — must be a valid 0x address (42 chars). If ENS or Basename, resolve first.
2. **Depth** — quick (free APIs only) or deep (uses paid risk APIs if available). Default: quick.
3. **Use case** — forensics, airdrop eligibility, due-diligence, or general curiosity. Adjusts what's surfaced.

## Playbook

### Step 1: Resolve identity

If input is a Basename (`.base.eth`) or ENS, resolve via:
- Basename resolver: `https://www.base.org/name/{name}` or via the ENS contract on Base
- ENS: standard ENS resolver

Also reverse-lookup the address to find any associated Basename. Surface to user upfront — "This address resolves to `vitalik.base.eth`" is useful context.

### Step 2: Pull activity summary

Use Basescan API (free tier, 5 req/s):

```
GET https://api.basescan.org/api
  ?module=account
  &action=txlist
  &address={addr}
  &startblock=0
  &endblock=99999999
  &page=1
  &offset=1000
  &sort=desc
  &apikey={BASESCAN_API_KEY}
```

Compute:
- **Total tx count**
- **First tx timestamp** → wallet age
- **Last tx timestamp** → activity recency
- **Failed tx ratio** → bot / contract-poking signal if high
- **Top 5 contracts interacted with** (by tx count)
- **Top 5 counterparties** (by tx count)

### Step 3: Pull token holdings

```
GET https://api.basescan.org/api
  ?module=account
  &action=tokenbalance  (or tokenlist via Alchemy enhanced API if available)
```

For Alchemy users (richer data):

```
POST https://base-mainnet.g.alchemy.com/v2/{KEY}
{
  "jsonrpc": "2.0",
  "method": "alchemy_getTokenBalances",
  "params": ["{addr}"]
}
```

Then for each token, fetch metadata (`alchemy_getTokenMetadata`) and a price feed (CoinGecko or DexScreener).

Output: table of top holdings by USD value.

### Step 4: Risk signals (use case-dependent)

**For forensics or due-diligence depth:**

- Cross-reference top counterparties against known mixer addresses (Tornado Cash relays — though most are sanctioned on US-routed RPCs)
- Check OFAC SDN list (free CSV from treasury.gov) for any address in the counterparty set
- Flag interactions with known scam token contracts (curated list — `references/scam-tokens.txt`)
- Look for "approval drainer" patterns: many small `approve()` calls to non-standard contracts

**For airdrop eligibility:**

- Compute holding duration of relevant tokens
- Count distinct DEX swaps
- Check for sybil patterns: address funded from another address that funded many others in a tight time window

### Step 5: Output format

Always include:

```markdown
## Wallet Profile: [shortened address] ([basename if any])

**Activity**
- Age: X days (first tx: YYYY-MM-DD)
- Total transactions: N (M% failed)
- Active days last 30: X

**Top Holdings (USD)**
| Token | Balance | USD Value |
|---|---|---|
| ... | ... | ... |

**Top Counterparties**
- 0xabc... (N interactions) — [label if known]
- ...

**Risk Signals**
- [list, or "No significant signals detected"]

**Notable Activity**
- [interesting observations — first to mint X, large LP position in Y, etc.]
```

Always include the Basescan link: `https://basescan.org/address/{addr}`

## Safety rails

- **Never accuse.** Risk signals are heuristics. Phrase as "interaction observed" not "this wallet is a scammer".
- **Source every claim.** Every risk label should have a citation (OFAC SDN list, specific contract address, etc.).
- **Privacy notice:** If the user asks to analyze a specific person's wallet, remind them that onchain data is public but doxxing is still doxxing.

## API key handling

Read keys from env. Required (free): `BASESCAN_API_KEY`. Optional (better data): `ALCHEMY_API_KEY`, `COVALENT_KEY`.

If no keys present, fall back to public Basescan rate-limited endpoint (1 req/5s). Surface this limitation to the user.

## Common pitfalls

- Basescan API returns max 1000 tx per page — paginate for high-activity addresses
- Tokens with 0 decimals (some bad ERC-20s) break balance math — handle the edge case
- Contracts on Base often forward calls — the "top counterparty" might be a router, not a meaningful counterparty. Filter known router addresses (Uniswap V3, Aerodrome, 1inch).

## Related skills

- `base-airdrop` — once you've found eligible wallets, send them tokens
- `base-basescan-debug` — drill into a specific failed transaction
- `base-deploy-token` — sanity check the deployer wallet before launch
