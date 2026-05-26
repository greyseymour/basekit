---
name: base-revenue-share
version: 0.1.0
description: Deploy and operate onchain revenue splits on Base — for creator royalties, team payouts, referral programs. Built on 0xSplits + custom claim contracts.
license: MIT
authors: [BaseKit]
network: base
chain_id: 8453
risk_level: medium
reversible: false
requires_signing: true
mutates_state: true
estimated_cost_usd_max: 8.00
trust:
  audit_status: community-reviewed
  external_calls: [Base RPC, 0xSplits SDK]
  pii: addresses-only
tags: [splits, payouts, royalties, treasury]
signed: false  # v0.2 official, sig at v0.3
---

# Base Revenue Share

Deploy onchain revenue splits that auto-route ETH or ERC-20 deposits to N recipients in fixed proportions. Push or pull model. Useful for creator collaborations, contractor pools, referral rewards, and DAO sub-team budgeting.

## When to use

- 2+ recipients, fixed or quasi-fixed proportions
- Recipients should not trust the depositor or each other to settle
- Volume is recurring (weekly+) so manual sends become tedious
- Auditability matters (every payout is onchain forever)

## When NOT to use

- One-time payment (just send it)
- Highly dynamic shares per payment (use a custom hook contract instead)
- > 100 recipients (gas amortization gets bad — use a Merkle drop pattern)

## Architecture choice

| Pattern | Best for | Pros | Cons |
|---|---|---|---|
| **0xSplits PushSplit** | < 10 recipients, low volume | Simple, gas paid by depositor | Each deposit triggers N transfers |
| **0xSplits PullSplit** | Any size, high volume | Cheapest deposit | Recipients claim themselves |
| **WaterfallSplit** | Vesting with thresholds | Complex distribution logic | More expensive to deploy |
| **Custom Merkle distributor** | > 100 recipients, periodic | O(1) claim cost | Off-chain merkle root mgmt |

Default recommendation: **PullSplit** for production. Cheapest at deposit time, recipients claim when convenient.

## Deploy a PullSplit

```ts
import { SplitsClient } from '@0xsplits/splits-sdk';
import { createPublicClient, createWalletClient, http } from 'viem';
import { base } from 'viem/chains';

const splits = new SplitsClient({
  chainId: 8453,
  publicClient,
  walletClient,
  apiConfig: { apiKey: process.env.SPLITS_API_KEY },
}).splitV2;

const { splitAddress } = await splits.createSplit({
  recipients: [
    { address: '0xAlice...', percentAllocation: 50 },
    { address: '0xBob...',   percentAllocation: 30 },
    { address: '0xTreasury', percentAllocation: 20 },
  ],
  distributorFeePercent: 0,
  ownerAddress: '0xMultisig...',   // or zero for immutable
  splitType: 'pull',
  totalAllocationPercent: 100,
});
```

Hand `splitAddress` to your dApp/contract as the payout destination.

## Distribute and claim

For ETH:
```ts
await splits.distribute({ splitAddress, token: 'eth' });
// Each recipient then calls:
await splits.withdraw({ address: recipient, tokens: ['eth'] });
```

For ERC-20:
```ts
await splits.distribute({ splitAddress, token: tokenAddress });
```

Both can be triggered by anyone — usually a recipient or a cron job. Distributor fee (set at deploy) compensates whoever triggers.

## Patterns

**Creator royalty:** Set the ERC-721 royalty receiver to the split address. All marketplace royalties flow in; collaborators claim.

**Referral program:** Each user gets a personal PullSplit with [refUser: 10%, app: 90%]. When the user transacts, the dApp routes the user's portion through their split.

**Contractor pool:** Monthly invoicing → one deposit to the split → contractors withdraw at their leisure.

## Safety checklist

- [ ] Recipients sum to exactly 100% (or 1,000,000 in micro units)
- [ ] No recipient is the zero address
- [ ] If `ownerAddress` is set, it's a multisig — never an EOA for production
- [ ] If split is meant to be immutable, set owner to `address(0)` explicitly
- [ ] Test withdraw with a $1 deposit before announcing

## A2A note for autonomous agents

This skill is **safe for agents** within these bounds:
- Deploying a split with explicit recipient list + percentages: yes
- Triggering distribution: yes (anyone-callable, no permissions)
- Modifying recipients on a mutable split: requires human confirmation
- Withdrawing on behalf of a recipient: only if agent owns that recipient address

## Sources

- [0xSplits docs](https://docs.splits.org)
- [0xSplits SDK](https://docs.splits.org/sdk/splits-v2)
- [PullSplit contract on Base](https://basescan.org/address/0xC8Eb8aE7F03A3DD2D45A0BA1B25E5BC2c4d5Fdc6)
