---
name: base-basescan-debug
description: Use this skill when the user has a failed, stuck, or confusing transaction on Base and wants to understand what happened. Fetches the transaction trace, decodes revert reasons, identifies the failing contract call in the call tree, surfaces likely root causes (insufficient gas, allowance, slippage, reentrancy guard, custom error), and proposes fixes.
license: MIT
version: 0.1.0
authors:
  - "BaseKit <basekit.dev>"
homepage: https://basekit.dev
keywords:
  - base
  - basescan
  - debug
  - transaction
  - revert
  - trace
---

# Debug a Transaction on Base

Diagnose failed or stuck transactions on Base. Walk from "this didn't work" to a clear root cause and proposed fix.

## When to use this skill

Activate when the user says any of:
- "this tx failed on Base, why?" (with a tx hash)
- "my transaction reverted" + Base context
- "decode this revert" + tx hash
- "transaction stuck pending"
- "what does this error mean" pasted with a tx hash

Do NOT activate for: pre-flight simulation of unsent txs (different skill: use Tenderly's simulation API directly), gas estimation, or chains other than Base.

## Required inputs

1. **Transaction hash** — 0x-prefixed, 66 chars
2. **What the user expected to happen** (helps disambiguate "supposed to fail" vs "broken")

## Playbook

### Step 1: Get the basics

```
GET https://api.basescan.org/api
  ?module=transaction
  &action=getstatus
  &txhash={hash}
  &apikey={KEY}
```

And:

```
GET https://api.basescan.org/api
  ?module=proxy
  &action=eth_getTransactionByHash
  &txhash={hash}
```

Surface:
- From / To addresses
- Function selector (first 4 bytes of input) — decode against the To contract's ABI if verified
- Value sent (ETH)
- Gas used / gas limit
- Status: success / failed
- Block / timestamp

### Step 2: Fetch the trace

Best option: Tenderly public traces (no key needed):
```
https://dashboard.tenderly.co/tx/base/{hash}
```

Programmatic option (requires a tracing-enabled RPC — Alchemy, QuickNode, or Tenderly):

```
POST {RPC_URL}
{
  "jsonrpc": "2.0",
  "method": "debug_traceTransaction",
  "params": ["{hash}", {"tracer": "callTracer"}]
}
```

Public Base RPC does NOT support `debug_traceTransaction`. Surface this to the user — recommend Tenderly's free dashboard view if no tracing RPC is available.

### Step 3: Decode the revert

If the tx reverted, look for:

**Standard revert with string:**
```
0x08c379a0... ("Error(string)")
```
The first 4 bytes after the selector are the offset; decode the string.

**Custom error (Solidity ≥0.8.4):**
```
0x{4-byte-selector}...
```
Compute possible selectors for known custom errors. Common ones:
- `InsufficientAllowance()` — `0xf4d678b8`
- `InsufficientBalance()` — `0xf4d678b8`
- `SlippageExceeded()` — varies
- `Pausable: paused` (Pausable contracts) — `0xd93c0665`

If the contract is verified on Basescan, fetch its ABI and match the 4-byte selector against the declared errors.

**Panic codes (Solidity ≥0.8.0):**
```
0x4e487b71{32-byte panic code}
```
- `0x01` — assertion failed
- `0x11` — arithmetic overflow/underflow
- `0x12` — divide by zero
- `0x21` — invalid enum cast
- `0x31` — empty array pop
- `0x32` — array out of bounds
- `0x41` — out of memory
- `0x51` — uninitialized function pointer

### Step 4: Identify failing frame

Walk the call tree from the trace and find the deepest revert. Report:
- Which contract reverted
- Which function it was in
- What arguments were passed
- What the revert reason decoded to

### Step 5: Diagnose root cause

Match against common patterns:

| Symptom | Likely cause | Fix |
|---|---|---|
| `TRANSFER_FROM_FAILED` in router | Missing/insufficient ERC20 `approve()` | Approve token to router before swap |
| `InsufficientAllowance` | Same as above | Approve more |
| `STF` in Uniswap | Token's `transferFrom` returned false (often fee-on-transfer tokens) | Use a fee-on-transfer-safe router or set a buffer |
| Slippage error | Price moved more than `amountOutMin` allowed | Increase slippage tolerance or chunk trade |
| `out of gas` | Gas limit too low for the call | Increase gas limit, check for unbounded loops in target |
| `nonce too low` | Tx replaced or already mined | Check nonce vs. account.nonce |
| Pending forever | Gas price below sequencer's minimum | Bump gas price; on Base, sequencer base fee can spike |
| Reverted inside delegate call | Proxy's implementation reverted | Read implementation ABI, not proxy ABI |

### Step 6: Propose the fix

Output:

```markdown
## Transaction Debug — [tx hash]

**Status:** Failed
**Root cause:** [one-line summary]

### Call trace
1. EOA `0xabc...` called `Router.swap(...)` ✅
2. `Router` called `Token.transferFrom(EOA, Router, 1000)` ❌
   → Reverted with: `InsufficientAllowance(currentAllowance: 0, requested: 1000)`

### Why it failed
The token contract's allowance from your wallet to the router is 0. The router needs to `transferFrom` your tokens to perform the swap, but ERC-20 requires you to `approve()` the spender first.

### Fix
Send an `approve()` transaction to the token contract:

```js
token.approve(router.address, ethers.MaxUint256)
```

Or for a single-tx flow, use a router that supports Permit (EIP-2612) signatures.

**Basescan link:** https://basescan.org/tx/{hash}
**Tenderly trace:** https://dashboard.tenderly.co/tx/base/{hash}
```

## Safety rails

- **Never assume.** If you can't pull the trace, say so — don't guess root cause.
- **Don't suggest disabling safety checks.** If the user's tx reverted because of a slippage guard, the fix is rarely "increase slippage to 100%".
- **Flag MEV.** If a swap reverted with slippage AND there's a sandwich pattern in the same block, surface this — many users don't know they were sandwiched.

## Common pitfalls

- Pending txs on Base: the sequencer occasionally has reorgs or rejects low-priority txs. Tell the user to check Basescan for the tx — if it's not there after 60 seconds, it's been dropped.
- Some Base contracts use clones (EIP-1167 minimal proxies). The ABI you need is the implementation's, not the proxy's. Basescan shows both.
- Calldata-truncated errors: a long custom error message can be truncated by some indexers. Use the full hex from `eth_call` revert data.

## Related skills

- `base-deploy-token` — when the failed tx was a token deploy
- `base-airdrop` — when claims are failing
- `base-gas-optimize` — when "out of gas" is the cause
