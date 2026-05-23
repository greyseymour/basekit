---
name: base-safe-multisig
version: 0.1.0
description: Deploy, configure, and operate a Safe multisig on Base — propose transactions, gather signatures, execute, and rotate signers safely.
license: MIT
authors: [BaseKit]
network: base
chain_id: 8453
risk_level: medium
reversible: false
requires_signing: true
mutates_state: true
estimated_cost_usd_max: 6.00
trust:
  audit_status: audited-by-safe
  external_calls: [Base RPC, Safe Transaction Service]
  pii: none
tags: [safe, multisig, treasury, ops]
---

# Base Safe Multisig

Operating a Safe on Base for treasury, ownership of upgradeable contracts, or just multi-person dApp signing. Covers deploy, day-2 ops, and signer rotation.

## When to use

- Treasury > $25k (use a Safe; an EOA at this size is malpractice)
- Owning a token contract or upgradeable proxy
- Multi-person team that needs shared signing authority
- DAO sub-treasury

## When NOT to use

- Personal wallet for daily use (Smart Wallet is better UX)
- Single-signer "multisig theater" (1-of-1 is the same as an EOA but with extra steps)

## Deploy

Use Safe's official UI (`https://app.safe.global`) for first deploy — it's free, audited, and creates the same contracts the SDK would. For programmatic deploy:

```ts
import Safe, { SafeFactory } from '@safe-global/protocol-kit';
import { base } from 'viem/chains';

const safeFactory = await SafeFactory.init({
  provider: process.env.BASE_RPC,
  signer: process.env.PK,
});

const safe = await safeFactory.deploySafe({
  safeAccountConfig: {
    owners: ['0xAlice', '0xBob', '0xCarol'],
    threshold: 2,
    // 2-of-3 is the sweet spot for small teams
  },
});

const safeAddress = await safe.getAddress();
```

## Threshold guidance

| Team size | Recommended threshold | Notes |
|---|---|---|
| 2 people | 2-of-2 | Or 2-of-3 with a recovery signer held offline |
| 3-5 people | 2-of-N for ops, M-of-N where M = ⌈N/2⌉+1 for treasury |
| 6+ | Tiered: small Safe for ops, large Safe (5-of-9 etc.) for treasury, time-locked transfers between |

Never use 1-of-N. Never use N-of-N for > 3 people (one lost key bricks the wallet).

## Propose / sign / execute flow

```ts
// 1. Propose
const txData = {
  to: TOKEN_ADDRESS,
  value: '0',
  data: encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [recipient, amount] }),
};
const safeTx = await safe.createTransaction({ transactions: [txData] });
const safeTxHash = await safe.getTransactionHash(safeTx);

// 2. First signer signs and proposes
const senderSignature = await safe.signHash(safeTxHash);
await apiKit.proposeTransaction({
  safeAddress,
  safeTransactionData: safeTx.data,
  safeTxHash,
  senderAddress: signer1Address,
  senderSignature: senderSignature.data,
});

// 3. Co-signers add signatures via Safe UI or SDK
// 4. Anyone executes once threshold met
const executeResp = await safe.executeTransaction(safeTx);
```

## Signer rotation

When a team member leaves, rotate within 24h:

1. Propose `swapOwner(prevOwner, oldOwner, newOwner)` from current signers
2. If no replacement, propose `removeOwner(prevOwner, oldOwner, newThreshold)`
3. Verify on Basescan that the change executed
4. Update internal docs + offboarding checklist

Never just "forget" a signer — they retain signing power until removed.

## Recovery patterns

- **Social recovery signer** — add a trusted external party (lawyer, co-founder of allied project) as a non-quorum signer. They can propose recovery if active signers are unavailable.
- **Hardware wallet floor** — at least one signer on a Ledger/Trezor, kept physically separated from the laptop running daily ops.
- **Geographic distribution** — for treasuries > $1M, signers in different cities. A single fire / break-in cannot brick the Safe.

## Module governance

Avoid installing Safe modules unless you fully understand them. Modules can execute without quorum. Audit module code, deploy from official Safe registry only, and revoke modules that aren't actively in use.

## A2A note for autonomous agents

Agents should generally **not be Safe signers**. Safes are for human-key-holder governance. An agent CAN:
- Propose transactions for human signers to review
- Read Safe state (balances, pending txs, signers, threshold)
- Trigger execution after threshold is met (anyone-callable)

An agent should **never** be assigned as a Safe owner unless its operational key is in an HSM and the agent's behavior is bounded by signed user policy. Treat Safe signer keys as more sensitive than the Safe itself.

## Sources

- [Safe Protocol Kit](https://docs.safe.global/sdk/protocol-kit)
- [Safe Transaction Service](https://docs.safe.global/core-api/transaction-service-overview)
- [Safe on Base](https://app.safe.global/welcome?chain=base)
