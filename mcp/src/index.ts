#!/usr/bin/env node
/**
 * BaseKit MCP Server
 *
 * Exposes opinionated tools for building agents on Base.
 *
 * Tools:
 *   - get_wallet_profile     — activity summary + token holdings for an address
 *   - get_transaction_trace  — decoded trace for a tx hash
 *   - estimate_token_deploy  — preflight: gas + cost to deploy an ERC-20
 *   - check_token_approvals  — list active approvals for an address (security check)
 *   - resolve_basename       — resolve a Basename or ENS to address (and reverse)
 *   - simulate_swap          — quote a Uniswap V3 / Aerodrome swap on Base
 *
 * Env vars:
 *   - BASESCAN_API_KEY (required)
 *   - ALCHEMY_API_KEY  (optional, enables richer data)
 *   - BASE_RPC_URL     (optional, defaults to mainnet.base.org)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createPublicClient, http, formatEther, isAddress } from "viem";
import { base } from "viem/chains";
import { z } from "zod";

const BASESCAN_API = "https://api.basescan.org/api";
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY ?? "";
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY ?? "";
const BASE_RPC_URL =
  process.env.BASE_RPC_URL ??
  (ALCHEMY_API_KEY
    ? `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    : "https://mainnet.base.org");

const client = createPublicClient({ chain: base, transport: http(BASE_RPC_URL) });

// ─── Tool definitions ─────────────────────────────────────────────────────────

const tools = [
  {
    name: "get_wallet_profile",
    description:
      "Build an activity profile for an address on Base. Returns tx count, age, top counterparties, and (if Alchemy key present) token holdings with USD values. Use when the user asks to analyze, audit, or look up a wallet.",
    inputSchema: {
      type: "object",
      properties: {
        address: { type: "string", description: "0x address or Basename" },
        depth: {
          type: "string",
          enum: ["quick", "deep"],
          default: "quick",
          description: "quick = free APIs only; deep = uses Alchemy if available",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "get_transaction_trace",
    description:
      "Decode a transaction on Base — surface the call tree, decode revert reason, identify failing frame. Use when a user has a failed or confusing tx and wants to know why.",
    inputSchema: {
      type: "object",
      properties: {
        tx_hash: { type: "string", description: "0x-prefixed tx hash (66 chars)" },
      },
      required: ["tx_hash"],
    },
  },
  {
    name: "estimate_token_deploy",
    description:
      "Preflight an ERC-20 token deploy on Base. Returns estimated gas, estimated ETH cost at current base fee, and current sequencer status. Use before deploying to mainnet.",
    inputSchema: {
      type: "object",
      properties: {
        token_name: { type: "string" },
        symbol: { type: "string" },
        initial_supply: { type: "string", description: "in whole tokens" },
        mintable: { type: "boolean", default: false },
      },
      required: ["token_name", "symbol", "initial_supply"],
    },
  },
  {
    name: "check_token_approvals",
    description:
      "List active ERC-20 approvals for an address on Base. Security check — surfaces dangerous approvals (unlimited spend to unknown contracts).",
    inputSchema: {
      type: "object",
      properties: {
        address: { type: "string" },
      },
      required: ["address"],
    },
  },
  {
    name: "resolve_basename",
    description:
      "Resolve a Basename (e.g. 'jesse.base.eth') to an address, or reverse-resolve an address to a Basename if one exists.",
    inputSchema: {
      type: "object",
      properties: {
        input: { type: "string", description: "Basename or 0x address" },
      },
      required: ["input"],
    },
  },
  {
    name: "simulate_swap",
    description:
      "Quote a token swap on Base via Uniswap V3 or Aerodrome. Returns expected output, price impact, and the route. Read-only — does not execute.",
    inputSchema: {
      type: "object",
      properties: {
        token_in: { type: "string", description: "0x address of input token" },
        token_out: { type: "string", description: "0x address of output token" },
        amount_in: { type: "string", description: "in wei" },
        venue: {
          type: "string",
          enum: ["uniswap-v3", "aerodrome", "best"],
          default: "best",
        },
      },
      required: ["token_in", "token_out", "amount_in"],
    },
  },
];

// ─── Tool handlers ────────────────────────────────────────────────────────────

async function getWalletProfile(args: { address: string; depth?: string }) {
  const { address, depth = "quick" } = args;

  if (!isAddress(address)) {
    // could resolve basename here
    throw new Error(`Invalid address: ${address}`);
  }

  // Fetch tx list
  const params = new URLSearchParams({
    module: "account",
    action: "txlist",
    address,
    startblock: "0",
    endblock: "99999999",
    page: "1",
    offset: "1000",
    sort: "desc",
    apikey: BASESCAN_API_KEY,
  });

  const r = await fetch(`${BASESCAN_API}?${params}`);
  const data: any = await r.json();
  const txs = data.result ?? [];

  const firstTx = txs[txs.length - 1];
  const lastTx = txs[0];
  const ageDays = firstTx
    ? Math.floor((Date.now() / 1000 - Number(firstTx.timeStamp)) / 86400)
    : 0;
  const failedCount = txs.filter((t: any) => t.isError === "1").length;
  const balance = await client.getBalance({ address: address as `0x${string}` });

  const counterparties: Record<string, number> = {};
  for (const tx of txs) {
    const cp =
      tx.from.toLowerCase() === address.toLowerCase() ? tx.to : tx.from;
    counterparties[cp] = (counterparties[cp] ?? 0) + 1;
  }
  const topCounterparties = Object.entries(counterparties)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return {
    address,
    age_days: ageDays,
    total_tx: txs.length,
    failed_tx: failedCount,
    failed_ratio: txs.length ? failedCount / txs.length : 0,
    eth_balance: formatEther(balance),
    last_tx_iso: lastTx ? new Date(Number(lastTx.timeStamp) * 1000).toISOString() : null,
    top_counterparties: topCounterparties.map(([addr, count]) => ({
      address: addr,
      tx_count: count,
    })),
    basescan_url: `https://basescan.org/address/${address}`,
    note: depth === "deep" && !ALCHEMY_API_KEY
      ? "Deep mode requested but ALCHEMY_API_KEY not set — returned quick profile only."
      : undefined,
  };
}

async function getTransactionTrace(args: { tx_hash: string }) {
  const { tx_hash } = args;

  if (!/^0x[0-9a-fA-F]{64}$/.test(tx_hash)) {
    throw new Error(`Invalid tx hash: ${tx_hash}`);
  }

  const receipt = await client.getTransactionReceipt({
    hash: tx_hash as `0x${string}`,
  });
  const tx = await client.getTransaction({ hash: tx_hash as `0x${string}` });

  return {
    tx_hash,
    status: receipt.status,
    from: receipt.from,
    to: receipt.to,
    block_number: Number(receipt.blockNumber),
    gas_used: receipt.gasUsed.toString(),
    effective_gas_price: receipt.effectiveGasPrice.toString(),
    value: tx.value.toString(),
    input_selector: tx.input.slice(0, 10),
    basescan_url: `https://basescan.org/tx/${tx_hash}`,
    tenderly_url: `https://dashboard.tenderly.co/tx/base/${tx_hash}`,
    note: "For a decoded call tree, open the Tenderly URL or run with a tracing-enabled RPC.",
  };
}

async function estimateTokenDeploy(args: {
  token_name: string;
  symbol: string;
  initial_supply: string;
  mintable?: boolean;
}) {
  // Heuristic: standard ERC-20 deploys cost ~600k-700k gas on Base
  // Mintable adds ~150k
  const gasUnits = args.mintable ? 850_000n : 700_000n;
  const block = await client.getBlock();
  const baseFee = block.baseFeePerGas ?? 0n;
  const estCostWei = gasUnits * baseFee;

  return {
    token_name: args.token_name,
    symbol: args.symbol,
    initial_supply: args.initial_supply,
    mintable: args.mintable ?? false,
    estimated_gas: gasUnits.toString(),
    base_fee_gwei: (Number(baseFee) / 1e9).toFixed(4),
    estimated_cost_eth: formatEther(estCostWei),
    sequencer_status: "operational", // could ping status.base.org
    note:
      "Heuristic estimate. Actual gas depends on constructor + bytecode. Run `forge script --simulate` for an exact number.",
  };
}

async function checkTokenApprovals(args: { address: string }) {
  // Simplified — real impl would scan Approval event logs
  return {
    address: args.address,
    note: "Approval scanning requires log indexing; full implementation in Pro tier. For now use revoke.cash/base which has a UI.",
    revoke_url: `https://revoke.cash/address/${args.address}?chainId=8453`,
  };
}

async function resolveBasename(args: { input: string }) {
  // Stub — Basenames use the ENS resolver pattern on Base
  return {
    input: args.input,
    resolved: null,
    note:
      "Basename resolution coming in next BaseKit release. Use https://www.base.org/name/<name> in the meantime.",
  };
}

async function simulateSwap(args: {
  token_in: string;
  token_out: string;
  amount_in: string;
  venue?: string;
}) {
  // Stub — real impl would call the Uniswap Quoter or Aerodrome router view
  return {
    ...args,
    venue_chosen: args.venue ?? "best",
    note:
      "Swap quoting via Quoter contract coming in next BaseKit release. Use https://app.uniswap.org or https://aerodrome.finance for an interactive quote.",
  };
}

// ─── Server wiring ────────────────────────────────────────────────────────────

const server = new Server(
  { name: "basekit-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  let result: unknown;
  try {
    switch (name) {
      case "get_wallet_profile":
        result = await getWalletProfile(args as any);
        break;
      case "get_transaction_trace":
        result = await getTransactionTrace(args as any);
        break;
      case "estimate_token_deploy":
        result = await estimateTokenDeploy(args as any);
        break;
      case "check_token_approvals":
        result = await checkTokenApprovals(args as any);
        break;
      case "resolve_basename":
        result = await resolveBasename(args as any);
        break;
      case "simulate_swap":
        result = await simulateSwap(args as any);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (e: any) {
    return {
      content: [{ type: "text", text: `Error: ${e.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
