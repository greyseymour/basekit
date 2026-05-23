---
name: base-onramp-flow
version: 0.1.0
description: Get a non-crypto user funded on Base in under 3 minutes — Coinbase Onramp, Smart Wallet creation, basename claim, first-tx gas sponsorship.
license: MIT
authors: [BaseKit]
network: base
chain_id: 8453
risk_level: low
reversible: false
requires_signing: true
mutates_state: true
estimated_cost_usd_max: 1.00
trust:
  audit_status: community-reviewed
  external_calls: [Coinbase Onramp API, Smart Wallet, Paymaster]
  pii: kyc-handled-by-coinbase
tags: [onboarding, onramp, smart-wallet, basename, sponsored]
---

# Base Onramp Flow

The "I just want to try this" path. Designed for builders who need to get a new user (a friend, a customer, a podcast listener) from "what is crypto" to "I just used this dApp" without losing them at the wallet install step.

## When to use

- A dApp targeting non-crypto-natives
- An agent representing a user who has never held crypto
- Embedded checkout flows (pay with USD card → onchain action) 
- Memecoin landing pages where the audience is fully retail

## When NOT to use

- Existing crypto users with EOAs (let them connect MetaMask)
- Treasury or team flows requiring multisig
- Anywhere you need full custody control (Smart Wallet has Coinbase-tied recovery by default)

## Three-stage flow

### Stage 1 — Smart Wallet creation (no seed phrase)

Use Coinbase Smart Wallet — passkey-based, no extension required.

```ts
import { coinbaseWallet } from 'wagmi/connectors';

const connector = coinbaseWallet({
  appName: 'YourApp',
  preference: 'smartWalletOnly',
});
```

User flow:
1. Click "Create Wallet"
2. Save passkey to device (Face ID / Touch ID / Windows Hello)
3. Wallet ready in ~5 seconds

No seed phrase ever shown. Recovery via Coinbase + passkey.

### Stage 2 — Onramp with Coinbase Pay

Generate a one-time Onramp URL:

```ts
import { generateOnRampURL } from '@coinbase/cbpay-js';

const url = generateOnRampURL({
  appId: process.env.NEXT_PUBLIC_CB_APP_ID,
  destinationWallets: [{
    address: userAddress,
    blockchains: ['base'],
    assets: ['USDC', 'ETH'],
  }],
  presetCryptoAmount: 25,
  defaultExperience: 'send',
});
```

Apple Pay / Google Pay / debit card supported. Funds land on Base in 60-90s.

### Stage 3 — First transaction (sponsored)

Sponsor the user's first tx via a Paymaster so they don't need ETH for gas:

```ts
import { createPaymasterClient } from 'viem/account-abstraction';

const paymaster = createPaymasterClient({
  transport: http(process.env.PAYMASTER_RPC), // Coinbase Developer Platform
});

// Send user op with paymaster context
await walletClient.sendUserOperation({
  account: smartWallet,
  calls: [/* your call */],
  paymaster,
});
```

Set a per-user budget cap on the Paymaster dashboard (e.g., $0.50 per user lifetime).

### Optional Stage 4 — Basename

Claim a `.base.eth` name in the same flow. First name is sponsored if the user holds a Base-native NFT or has done > $100 onchain volume:

```ts
import { registrarController } from '@/lib/basenames';
await registrarController.register({
  name: 'alice',
  owner: userAddress,
  duration: 31536000n, // 1 year
  resolver: '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD',
  data: [],
  reverseRecord: true,
});
```

## Failure modes to handle

- **KYC blocked** (geography): fall back to `transak` or show "Send USDC to this address" with QR
- **Paymaster budget exhausted**: prompt user to keep $1 of ETH; explain why
- **Passkey unavailable** (old device): fall back to Smart Wallet via Coinbase account

## A2A note for autonomous agents

This skill is **safe for agents to initiate** but requires user interaction at:
- The passkey enrollment (must be human-present)
- The card entry (PCI/KYC)
- The first transaction confirmation (typically auto-approved in Smart Wallet but agent should display)

Agents should pre-stage the URLs and pass them to the user via the agent's UI; never attempt to scrape card details or impersonate.

## Sources

- [Coinbase Smart Wallet docs](https://docs.base.org/identity/smart-wallet/quickstart)
- [Coinbase Onramp](https://docs.cdp.coinbase.com/onramp/docs/welcome)
- [Base Paymaster](https://docs.base.org/identity/smart-wallet/guides/paymasters)
- [Basenames contracts](https://github.com/base-org/basenames)
