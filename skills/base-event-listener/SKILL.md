---
name: base-event-listener
version: 0.1.0
description: Subscribe to onchain events on Base with reliable backfill, reorg handling, and exactly-once delivery to a webhook or queue.
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
  external_calls: [Base RPC, Alchemy, optional webhook]
  pii: none
tags: [indexing, events, webhooks, real-time]
signed: false  # v0.2 official, sig at v0.3
---

# Base Event Listener

Wire any Base contract event into your stack — a webhook, a queue, a database — with the properties that production systems actually need: backfill from a starting block, reorg handling, exactly-once delivery, and graceful catchup after downtime.

## When to use

- You need to react to onchain activity (mints, swaps, transfers, custom events)
- You want a feed of historical events from block X onward
- You're building an agent that triggers off chain state

## When NOT to use

- One-off historical query (just call `eth_getLogs` once)
- You need sub-second latency (use a dedicated streaming provider like Goldsky or QuickNode Streams)

## Two-mode design

### Mode A — Pull (recommended default)

A loop that polls `eth_getLogs` in chunks. Most reliable; works against any RPC.

```ts
import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({ chain: base, transport: http() });
const ABI = parseAbi(['event Transfer(address indexed from, address indexed to, uint256 value)']);

const CHUNK = 2000n;   // Base allows up to ~10k; 2k is safe + fast
const CONFIRMATIONS = 5n;  // Base reorgs are rare but happen at sequencer issues

async function tick(state: { lastBlock: bigint }) {
  const tip = await client.getBlockNumber();
  const safe = tip - CONFIRMATIONS;
  if (safe <= state.lastBlock) return;

  for (let from = state.lastBlock + 1n; from <= safe; from += CHUNK) {
    const to = from + CHUNK - 1n > safe ? safe : from + CHUNK - 1n;
    const logs = await client.getLogs({
      address: CONTRACT,
      events: ABI,
      fromBlock: from,
      toBlock: to,
    });
    for (const log of logs) await deliver(log);
    state.lastBlock = to;
    await persist(state);
  }
}
```

Run on a 10-15s interval.

### Mode B — WebSocket subscribe

Lower latency, more fragile. Use as a complement to Mode A, not a replacement.

```ts
const unwatch = client.watchEvent({
  address: CONTRACT,
  event: ABI[0],
  onLogs: async (logs) => {
    for (const log of logs) await deliver(log);
  },
});
```

When WS disconnects, fall back to Mode A from `state.lastBlock` until it reconnects.

## Exactly-once delivery

Maintain a dedupe set in your sink: `(blockHash, logIndex)` is unique and stable until a reorg.

For reorg safety, only deliver events at depth ≥ 5 (the `CONFIRMATIONS` above). For Base specifically, sequencer outages have historically reorganized < 10 blocks deep, so 5 is sufficient for non-financial flows. Use 32 for treasury-level reliability.

## Webhook delivery contract

When forwarding to a webhook:
- Sign each request with HMAC-SHA256 using a per-customer secret
- Header: `X-BaseKit-Signature: t=<unix>,v1=<hmac>`
- Retry policy: 5s → 30s → 5m → 30m → 4h → 24h (drop after)
- Body is a single event; never batch unless the consumer opts in

## Schema

Every delivered event has:
```json
{
  "id": "0xblockhash-logIndex",
  "chain_id": 8453,
  "block_number": 18450923,
  "block_hash": "0x...",
  "tx_hash": "0x...",
  "log_index": 42,
  "contract": "0x...",
  "event": "Transfer",
  "args": { "from": "0x...", "to": "0x...", "value": "1000000" },
  "raw": { "topics": [...], "data": "0x..." },
  "timestamp": 1716480000
}
```

## A2A note for autonomous agents

This skill is **safe to run continuously**. Recommended as the foundation for any agent that needs to react to onchain state — e.g., "claim my rewards when they exceed $50", "snipe an NFT when this address mints", "DCA when ETH crosses $X".

Agents should pair this with a budget governor — never let an event handler trigger a tx without:
- Confirming the event is real (re-read the log from RPC)
- Confirming the trigger condition (re-read state)
- Checking the agent's remaining budget

## Sources

- [viem getLogs](https://viem.sh/docs/actions/public/getLogs.html)
- [Alchemy Base Webhooks](https://docs.alchemy.com/reference/notify-api-quickstart)
- [Goldsky Mirror](https://docs.goldsky.com/mirror/introduction) (for managed alternative)
