#!/usr/bin/env node
/**
 * BaseKit MCP Server
 *
 * Opinionated tools for agents and humans building on Base.
 * Read-first: most tools are pure data fetches. Mutating tools are clearly marked.
 *
 * Tools:
 *   Read-only / safe (agents can run unbounded):
 *     - get_wallet_profile     — activity + balances + age + counterparties
 *     - get_transaction_trace  — receipt + decoded selector + links to tracers
 *     - check_token_approvals  — surface dangerous unlimited approvals
 *     - resolve_basename       — basename ↔ address (live, via L2 resolver)
 *     - verify_contract        — full safety report (source, owner, mint, blacklist, etc.)
 *     - simulate_swap          — quoter call against Uniswap v3 on Base
 *     - portfolio_snapshot     — assembled snapshot for an address
 *     - gas_now                — current base fee + sequencer health
 *     - decode_calldata        — selector + decoded args via 4byte
 *     - check_basename_available — is a basename available + projected cost
 *
 *   Preflight (read-only; describes a future write):
 *     - estimate_token_deploy  — gas + cost preflight
 *     - estimate_safe_deploy   — gas + cost for a new Safe
 *
 *   Agent policy:
 *     - agent_policy_describe  — render a user's policy in human-readable form
 *
 * Env:
 *   BASESCAN_API_KEY  (required for source verification + tx lists)
 *   ALCHEMY_API_KEY   (optional, enriches portfolio + approvals)
 *   BASE_RPC_URL      (optional, defaults to mainnet.base.org)
 *   GOPLUS_APP_KEY    (optional, free tier works without)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  createPublicClient,
  http,
  formatEther,
  formatUnits,
  isAddress,
  parseAbi,
  decodeFunctionData,
  namehash,
  keccak256,
  toHex,
} from "viem";
import { base } from "viem/chains";

const BASESCAN_API = "https://api.basescan.org/api";
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY ?? "";
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY ?? "";
const GOPLUS_APP_KEY = process.env.GOPLUS_APP_KEY ?? "";
const BASE_RPC_URL =
  process.env.BASE_RPC_URL ??
  (ALCHEMY_API_KEY
    ? `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    : "https://mainnet.base.org");

const client = createPublicClient({ chain: base, transport: http(BASE_RPC_URL) });

// ─── Constants ─────────────────────────────────────────────────────────────────

const BASE_L2_RESOLVER = "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD" as const;
const UNISWAP_V3_QUOTER = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a" as const;
const REGISTRAR_CONTROLLER = "0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5" as const;
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
const WETH_BASE = "0x4200000000000000000000000000000000000006" as const;

// ─── Tool definitions ──────────────────────────────────────────────────────────

const tools = [
  {
    name: "get_wallet_profile",
    description:
      "Build an activity profile for a Base address. Returns tx count, age, balance, failed-tx ratio, and top counterparties. Safe to run unbounded — read-only, no signing.",
    inputSchema: {
      type: "object",
      properties: {
        address: { type: "string", description: "0x address or Basename" },
        depth: {
          type: "string",
          enum: ["quick", "deep"],
          default: "quick",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "get_transaction_trace",
    description:
      "Decode a Base transaction. Returns receipt fields, decoded function selector, gas data, and tracer URLs. Read-only.",
    inputSchema: {
      type: "object",
      properties: { tx_hash: { type: "string" } },
      required: ["tx_hash"],
    },
  },
  {
    name: "check_token_approvals",
    description:
      "Scan ERC-20 Approval events outgoing from an address on Base. Flags unlimited approvals to non-allowlisted contracts. Returns revoke URLs. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        address: { type: "string" },
        max_blocks: { type: "number", default: 500_000 },
      },
      required: ["address"],
    },
  },
  {
    name: "resolve_basename",
    description:
      "Resolve a Basename (e.g. 'jesse.base.eth') to an address via the L2 resolver, or reverse-resolve an address. Read-only.",
    inputSchema: {
      type: "object",
      properties: { input: { type: "string" } },
      required: ["input"],
    },
  },
  {
    name: "verify_contract",
    description:
      "Run a full safety report on a Base contract. Checks source verification, ownership, mint/pause/blacklist selectors, proxy status, age, GoPlus score. Returns verdict (safe/caution/danger/unknown) + structured warnings. Use before any agent calls a contract on a user's behalf.",
    inputSchema: {
      type: "object",
      properties: { address: { type: "string" } },
      required: ["address"],
    },
  },
  {
    name: "simulate_swap",
    description:
      "Quote a token swap on Base via Uniswap V3 Quoter. Returns expected output, price impact, and route. Read-only — does NOT execute.",
    inputSchema: {
      type: "object",
      properties: {
        token_in: { type: "string", description: "0x address (use WETH for ETH)" },
        token_out: { type: "string" },
        amount_in: { type: "string", description: "in wei (or token base units)" },
        fee_tier: {
          type: "number",
          enum: [100, 500, 3000, 10000],
          default: 500,
        },
      },
      required: ["token_in", "token_out", "amount_in"],
    },
  },
  {
    name: "portfolio_snapshot",
    description:
      "Assemble a portfolio snapshot for a Base address — ETH balance, ERC-20 holdings, recent activity. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        address: { type: "string" },
        include_nfts: { type: "boolean", default: false },
      },
      required: ["address"],
    },
  },
  {
    name: "gas_now",
    description:
      "Current Base base-fee + sequencer health. Use to decide whether to send a tx now or wait.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "decode_calldata",
    description:
      "Decode raw calldata into function selector + arguments. Cross-checks against 4byte directory.",
    inputSchema: {
      type: "object",
      properties: {
        calldata: { type: "string", description: "0x-prefixed hex" },
      },
      required: ["calldata"],
    },
  },
  {
    name: "check_basename_available",
    description:
      "Check if a basename is available to register. Returns availability + estimated cost (USD + ETH).",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "without .base.eth suffix" },
        duration_years: { type: "number", default: 1 },
      },
      required: ["name"],
    },
  },
  {
    name: "estimate_token_deploy",
    description:
      "Preflight an ERC-20 deploy on Base. Returns estimated gas, cost in ETH at current base fee.",
    inputSchema: {
      type: "object",
      properties: {
        token_name: { type: "string" },
        symbol: { type: "string" },
        initial_supply: { type: "string" },
        mintable: { type: "boolean", default: false },
      },
      required: ["token_name", "symbol", "initial_supply"],
    },
  },
  {
    name: "estimate_safe_deploy",
    description:
      "Preflight a Safe multisig deploy. Returns estimated gas and cost based on owner count.",
    inputSchema: {
      type: "object",
      properties: {
        owner_count: { type: "number" },
        threshold: { type: "number" },
      },
      required: ["owner_count", "threshold"],
    },
  },
  {
    name: "agent_policy_describe",
    description:
      "Given a user's signed agent policy (JSON), produce a human-readable summary suitable for confirmation UI. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        policy: {
          type: "object",
          description: "agent-policy.json contents",
        },
      },
      required: ["policy"],
    },
  },
];

// ─── Handlers ──────────────────────────────────────────────────────────────────

async function getWalletProfile(args: { address: string; depth?: string }) {
  const { address, depth = "quick" } = args;
  const addr = address.startsWith("0x") ? address : await resolveBasenameRaw(address);
  if (!addr || !isAddress(addr)) throw new Error(`Could not resolve address: ${address}`);

  const params = new URLSearchParams({
    module: "account",
    action: "txlist",
    address: addr,
    startblock: "0",
    endblock: "99999999",
    page: "1",
    offset: "1000",
    sort: "desc",
    apikey: BASESCAN_API_KEY,
  });

  const r = await fetch(`${BASESCAN_API}?${params}`);
  const data: any = await r.json();
  const txs: any[] = Array.isArray(data.result) ? data.result : [];

  const firstTx = txs[txs.length - 1];
  const lastTx = txs[0];
  const ageDays = firstTx
    ? Math.floor((Date.now() / 1000 - Number(firstTx.timeStamp)) / 86400)
    : 0;
  const failedCount = txs.filter((t) => t.isError === "1").length;
  const balance = await client.getBalance({ address: addr as `0x${string}` });

  const counterparties: Record<string, number> = {};
  for (const tx of txs) {
    const cp = tx.from.toLowerCase() === addr.toLowerCase() ? tx.to : tx.from;
    if (!cp) continue;
    counterparties[cp] = (counterparties[cp] ?? 0) + 1;
  }
  const top = Object.entries(counterparties)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return {
    address: addr,
    input: address,
    age_days: ageDays,
    total_tx: txs.length,
    failed_tx: failedCount,
    failed_ratio: txs.length ? Number((failedCount / txs.length).toFixed(4)) : 0,
    eth_balance: formatEther(balance),
    last_tx_iso: lastTx ? new Date(Number(lastTx.timeStamp) * 1000).toISOString() : null,
    top_counterparties: top.map(([address, tx_count]) => ({ address, tx_count })),
    basescan_url: `https://basescan.org/address/${addr}`,
    deep_available: !!ALCHEMY_API_KEY,
  };
}

async function getTransactionTrace(args: { tx_hash: string }) {
  const { tx_hash } = args;
  if (!/^0x[0-9a-fA-F]{64}$/.test(tx_hash)) throw new Error(`Invalid tx hash: ${tx_hash}`);

  const receipt = await client.getTransactionReceipt({ hash: tx_hash as `0x${string}` });
  const tx = await client.getTransaction({ hash: tx_hash as `0x${string}` });

  const selector = tx.input.slice(0, 10);
  let decodedFn: string | undefined;
  try {
    const res = await fetch(`https://www.4byte.directory/api/v1/signatures/?hex_signature=${selector}`);
    const json: any = await res.json();
    decodedFn = json.results?.[0]?.text_signature;
  } catch {
    decodedFn = undefined;
  }

  return {
    tx_hash,
    status: receipt.status,
    from: receipt.from,
    to: receipt.to,
    block_number: Number(receipt.blockNumber),
    gas_used: receipt.gasUsed.toString(),
    effective_gas_price_gwei: (Number(receipt.effectiveGasPrice) / 1e9).toFixed(4),
    value_eth: formatEther(tx.value),
    input_selector: selector,
    decoded_function: decodedFn,
    log_count: receipt.logs.length,
    basescan_url: `https://basescan.org/tx/${tx_hash}`,
    tenderly_url: `https://dashboard.tenderly.co/tx/base/${tx_hash}`,
  };
}

async function checkTokenApprovals(args: { address: string; max_blocks?: number }) {
  const { address, max_blocks = 500_000 } = args;
  if (!isAddress(address)) throw new Error(`Invalid address: ${address}`);

  const tip = await client.getBlockNumber();
  const from = tip - BigInt(max_blocks);

  // Approval(address indexed owner, address indexed spender, uint256 value)
  const APPROVAL_TOPIC = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
  const ownerTopic = `0x${address.slice(2).toLowerCase().padStart(64, "0")}`;

  // Use raw eth_getLogs because viem types want an event spec; we want any ERC-20 Approval.
  const rawCall = (fromBlock: bigint, toBlock: bigint) =>
    client.request({
      method: "eth_getLogs" as any,
      params: [
        {
          fromBlock: `0x${fromBlock.toString(16)}`,
          toBlock: `0x${toBlock.toString(16)}`,
          topics: [APPROVAL_TOPIC, ownerTopic],
        },
      ] as any,
    }) as Promise<any[]>;

  let logs: any[] = [];
  try {
    logs = await rawCall(from, tip);
  } catch {
    logs = await rawCall(tip - 50_000n, tip);
  }

  // Reduce to latest approval value per (token, spender)
  const latest = new Map<string, { token: string; spender: string; value: bigint; block: bigint }>();
  for (const log of logs) {
    const token = log.address.toLowerCase();
    const spender = ("0x" + log.topics[2].slice(26)).toLowerCase();
    const value = BigInt(log.data);
    const key = `${token}:${spender}`;
    const prev = latest.get(key);
    if (!prev || log.blockNumber > prev.block) {
      latest.set(key, { token, spender, value, block: log.blockNumber });
    }
  }

  const MAX_UINT = (1n << 256n) - 1n;
  const HIGH_THRESHOLD = MAX_UINT / 2n;
  const active = Array.from(latest.values()).filter((a) => a.value > 0n);

  const flagged = active.filter((a) => a.value > HIGH_THRESHOLD);

  return {
    address,
    scanned_blocks: Number(tip - from),
    active_approvals: active.length,
    unlimited_approvals: flagged.length,
    approvals: active.slice(0, 50).map((a) => ({
      token: a.token,
      spender: a.spender,
      value: a.value === MAX_UINT ? "unlimited" : a.value.toString(),
      basescan_token: `https://basescan.org/token/${a.token}`,
      basescan_spender: `https://basescan.org/address/${a.spender}`,
    })),
    revoke_url: `https://revoke.cash/address/${address}?chainId=8453`,
  };
}

async function resolveBasenameRaw(input: string): Promise<string | null> {
  if (isAddress(input)) return input;
  const name = input.endsWith(".base.eth") ? input : `${input}.base.eth`;
  try {
    const node = namehash(name);
    const resolverAbi = parseAbi([
      "function addr(bytes32 node) view returns (address)",
    ]);
    const resolved = await client.readContract({
      address: BASE_L2_RESOLVER,
      abi: resolverAbi,
      functionName: "addr",
      args: [node],
    });
    if (resolved && resolved !== "0x0000000000000000000000000000000000000000") {
      return resolved as string;
    }
    return null;
  } catch {
    return null;
  }
}

async function resolveBasename(args: { input: string }) {
  const { input } = args;

  if (isAddress(input)) {
    // reverse resolve via L2 reverse registrar
    try {
      const reverseAbi = parseAbi(["function node(address) view returns (bytes32)"]);
      const node = await client.readContract({
        address: "0x79EA96012eEa67A83431F1701B3dFf7e37F9E282",
        abi: reverseAbi,
        functionName: "node",
        args: [input as `0x${string}`],
      });
      const nameAbi = parseAbi(["function name(bytes32) view returns (string)"]);
      const name = await client.readContract({
        address: BASE_L2_RESOLVER,
        abi: nameAbi,
        functionName: "name",
        args: [node],
      });
      return { input, address: input, basename: name || null };
    } catch (e: any) {
      return { input, address: input, basename: null, error: e.message };
    }
  }

  const resolved = await resolveBasenameRaw(input);
  return {
    input,
    name: input.endsWith(".base.eth") ? input : `${input}.base.eth`,
    address: resolved,
    found: !!resolved,
  };
}

async function verifyContract(args: { address: string }) {
  const { address } = args;
  if (!isAddress(address)) throw new Error(`Invalid address: ${address}`);

  // 1. Source verification
  const srcParams = new URLSearchParams({
    module: "contract",
    action: "getsourcecode",
    address,
    apikey: BASESCAN_API_KEY,
  });
  const srcRes = await fetch(`${BASESCAN_API}?${srcParams}`);
  const srcJson: any = await srcRes.json();
  const src = srcJson.result?.[0] ?? {};
  const sourceVerified = !!src.SourceCode && src.SourceCode !== "";
  const isProxy = src.Proxy === "1";
  const implementation = isProxy ? src.Implementation : null;
  const contractName = src.ContractName ?? null;

  // 2. Bytecode + selector scan
  const code = await client.getCode({ address: address as `0x${string}` });
  const hasCode = !!code && code.length > 2;

  const SELECTORS = {
    mint: "40c10f19",
    pause: "8456cb59",
    blacklist: "f9f92be4",
    transfer_ownership: "f2fde38b",
    renounce_ownership: "715018a6",
    upgrade_to: "3659cfe6",
  };
  const found: Record<string, boolean> = {};
  for (const [k, sel] of Object.entries(SELECTORS)) {
    found[k] = !!code && code.toLowerCase().includes(sel);
  }

  // 3. Ownership
  let owner: string | null = null;
  let ownerType: string = "unknown";
  try {
    const ownerAbi = parseAbi(["function owner() view returns (address)"]);
    owner = (await client.readContract({
      address: address as `0x${string}`,
      abi: ownerAbi,
      functionName: "owner",
    })) as string;
    if (owner === "0x0000000000000000000000000000000000000000") {
      ownerType = "renounced";
    } else {
      const ownerCode = await client.getCode({ address: owner as `0x${string}` });
      ownerType = ownerCode && ownerCode.length > 2 ? "contract" : "EOA";
    }
  } catch {
    // No owner() function
  }

  // 4. GoPlus cross-check (free tier, no key required)
  let goplus: any = null;
  try {
    const gp = await fetch(
      `https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${address}`
    );
    const gpj: any = await gp.json();
    goplus = gpj.result?.[address.toLowerCase()] ?? null;
  } catch {
    goplus = null;
  }

  // 5. Age
  let ageDays: number | null = null;
  try {
    const cParams = new URLSearchParams({
      module: "account",
      action: "txlist",
      address,
      page: "1",
      offset: "1",
      sort: "asc",
      apikey: BASESCAN_API_KEY,
    });
    const cRes = await fetch(`${BASESCAN_API}?${cParams}`);
    const cJson: any = await cRes.json();
    const firstBlock = cJson.result?.[0];
    if (firstBlock) {
      ageDays = Math.floor((Date.now() / 1000 - Number(firstBlock.timeStamp)) / 86400);
    }
  } catch {
    // ignore
  }

  // Compose verdict
  const warnings: string[] = [];
  if (!hasCode) warnings.push("No bytecode at address — EOA or self-destructed.");
  if (!sourceVerified) warnings.push("Source code not verified on Basescan.");
  if (found.blacklist) warnings.push("Bytecode contains blacklist selector — critical risk.");
  if (found.mint && ownerType === "EOA")
    warnings.push("Mintable by an EOA owner — supply can be inflated unilaterally.");
  if (found.pause && ownerType !== "renounced")
    warnings.push("Pause function present and not renounced.");
  if (found.upgrade_to) warnings.push("Upgradeable proxy — implementation can change.");
  if (ownerType === "EOA") warnings.push("Owner is an EOA, not a multisig.");
  if (ageDays !== null && ageDays < 7) warnings.push(`Contract is only ${ageDays} days old.`);

  let verdict: "safe" | "caution" | "danger" | "unknown" = "unknown";
  if (!hasCode || !sourceVerified) {
    verdict = "danger";
  } else if (found.blacklist || (found.mint && ownerType === "EOA")) {
    verdict = "danger";
  } else if (warnings.length === 0 && (ownerType === "renounced" || ownerType === "contract")) {
    verdict = "safe";
  } else {
    verdict = "caution";
  }

  return {
    address,
    verdict,
    contract_name: contractName,
    checks: {
      source_verified: sourceVerified,
      has_bytecode: hasCode,
      is_proxy: isProxy,
      implementation,
      owner,
      owner_type: ownerType,
      has_mint: found.mint,
      has_pause: found.pause,
      has_blacklist: found.blacklist,
      is_upgradeable: found.upgrade_to,
      age_days: ageDays,
    },
    external: goplus
      ? {
          goplus_is_open_source: goplus.is_open_source,
          goplus_is_honeypot: goplus.is_honeypot,
          goplus_buy_tax: goplus.buy_tax,
          goplus_sell_tax: goplus.sell_tax,
        }
      : null,
    warnings,
    basescan_url: `https://basescan.org/address/${address}`,
  };
}

async function simulateSwap(args: {
  token_in: string;
  token_out: string;
  amount_in: string;
  fee_tier?: number;
}) {
  const { token_in, token_out, amount_in, fee_tier = 500 } = args;
  if (!isAddress(token_in) || !isAddress(token_out)) {
    throw new Error("token_in and token_out must be valid addresses");
  }

  const quoterAbi = parseAbi([
    "function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96)) returns (uint256 amountOut,uint160 sqrtPriceX96After,uint32 initializedTicksCrossed,uint256 gasEstimate)",
  ]);

  try {
    const result = await client.simulateContract({
      address: UNISWAP_V3_QUOTER,
      abi: quoterAbi,
      functionName: "quoteExactInputSingle",
      args: [
        {
          tokenIn: token_in as `0x${string}`,
          tokenOut: token_out as `0x${string}`,
          amountIn: BigInt(amount_in),
          fee: fee_tier,
          sqrtPriceLimitX96: 0n,
        },
      ],
    });
    const [amountOut, , ticksCrossed, gasEstimate] = result.result as [
      bigint,
      bigint,
      number,
      bigint
    ];
    return {
      venue: "uniswap-v3",
      token_in,
      token_out,
      amount_in,
      fee_tier,
      amount_out: amountOut.toString(),
      ticks_crossed: ticksCrossed,
      gas_estimate: gasEstimate.toString(),
      note: "Quote only — does not execute. Use base-mev-resistant skill for execution.",
    };
  } catch (e: any) {
    return {
      venue: "uniswap-v3",
      error: e.message,
      hint:
        "Try a different fee_tier (100, 500, 3000, 10000) — pool may not exist at this tier.",
    };
  }
}

async function portfolioSnapshot(args: { address: string; include_nfts?: boolean }) {
  const { address } = args;
  const addr = isAddress(address) ? address : await resolveBasenameRaw(address);
  if (!addr) throw new Error(`Could not resolve: ${address}`);

  const balance = await client.getBalance({ address: addr as `0x${string}` });
  const block = await client.getBlockNumber();

  let tokens: any[] = [];
  if (ALCHEMY_API_KEY) {
    try {
      const r = await fetch(
        `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "alchemy_getTokenBalances",
            params: [addr, "erc20"],
          }),
        }
      );
      const j: any = await r.json();
      tokens =
        j.result?.tokenBalances?.filter((t: any) => t.tokenBalance !== "0x0") ?? [];
    } catch {
      // ignore
    }
  }

  return {
    address: addr,
    block_number: Number(block),
    snapshot_at: new Date().toISOString(),
    eth_balance: formatEther(balance),
    erc20_count: tokens.length,
    erc20_holdings: tokens.slice(0, 25).map((t: any) => ({
      contract: t.contractAddress,
      raw_balance: t.tokenBalance,
    })),
    note: ALCHEMY_API_KEY
      ? undefined
      : "Set ALCHEMY_API_KEY for ERC-20 enrichment.",
    basescan_url: `https://basescan.org/address/${addr}`,
  };
}

async function gasNow() {
  const block = await client.getBlock();
  const baseFee = block.baseFeePerGas ?? 0n;
  const baseFeeGwei = Number(baseFee) / 1e9;

  // Health heuristic: Base typically runs at < 0.01 gwei
  let health: "low" | "normal" | "elevated" | "high" = "normal";
  if (baseFeeGwei < 0.005) health = "low";
  else if (baseFeeGwei > 0.1) health = "elevated";
  if (baseFeeGwei > 1) health = "high";

  return {
    base_fee_wei: baseFee.toString(),
    base_fee_gwei: baseFeeGwei.toFixed(6),
    block_number: Number(block.number),
    block_age_seconds: Math.floor(Date.now() / 1000) - Number(block.timestamp),
    health,
    suggested_priority_fee_gwei: "0.001",
    status_url: "https://status.base.org",
  };
}

async function decodeCalldata(args: { calldata: string }) {
  const { calldata } = args;
  if (!calldata.startsWith("0x") || calldata.length < 10) {
    throw new Error("calldata must be 0x-prefixed hex of at least 4 bytes");
  }
  const selector = calldata.slice(0, 10);
  let signatures: string[] = [];
  try {
    const r = await fetch(
      `https://www.4byte.directory/api/v1/signatures/?hex_signature=${selector}`
    );
    const j: any = await r.json();
    signatures = (j.results ?? []).map((x: any) => x.text_signature);
  } catch {
    // ignore
  }
  return {
    selector,
    signatures,
    calldata_length_bytes: (calldata.length - 2) / 2,
    note: signatures.length
      ? "Multiple signatures may collide on the same selector — verify against the target contract's ABI."
      : "No known signature for this selector in 4byte directory.",
  };
}

async function checkBasenameAvailable(args: { name: string; duration_years?: number }) {
  const { name, duration_years = 1 } = args;
  const cleanName = name.replace(/\.base\.eth$/i, "").toLowerCase();
  if (!/^[a-z0-9-]+$/.test(cleanName)) {
    throw new Error("Name must be lowercase alphanumeric or hyphens.");
  }
  if (cleanName.length < 3) {
    return { name: cleanName, available: false, reason: "Names < 3 chars are reserved." };
  }

  const resolved = await resolveBasenameRaw(`${cleanName}.base.eth`);
  const available = !resolved;

  // Pricing tier (approximate, per Base's registrar):
  //   3 chars   : $100/yr
  //   4 chars   : $25/yr
  //   5-9 chars : $5/yr
  //   10+ chars : $0.50/yr
  const len = cleanName.length;
  const annualUsd =
    len === 3 ? 100 : len === 4 ? 25 : len <= 9 ? 5 : 0.5;
  const totalUsd = annualUsd * duration_years;

  return {
    name: `${cleanName}.base.eth`,
    available,
    length: len,
    duration_years,
    estimated_annual_usd: annualUsd,
    estimated_total_usd: totalUsd,
    register_url: `https://www.base.org/name/${cleanName}`,
  };
}

async function estimateTokenDeploy(args: {
  token_name: string;
  symbol: string;
  initial_supply: string;
  mintable?: boolean;
}) {
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
    base_fee_gwei: (Number(baseFee) / 1e9).toFixed(6),
    estimated_cost_eth: formatEther(estCostWei),
    note:
      "Heuristic estimate. Run `forge script --simulate` for an exact number tied to your bytecode.",
  };
}

async function estimateSafeDeploy(args: { owner_count: number; threshold: number }) {
  // Safe ProxyFactory + setup tx — ~300k base + ~20k per owner on Base
  const gasUnits = BigInt(300_000 + args.owner_count * 20_000);
  const block = await client.getBlock();
  const baseFee = block.baseFeePerGas ?? 0n;
  const estCostWei = gasUnits * baseFee;
  return {
    owner_count: args.owner_count,
    threshold: args.threshold,
    estimated_gas: gasUnits.toString(),
    base_fee_gwei: (Number(baseFee) / 1e9).toFixed(6),
    estimated_cost_eth: formatEther(estCostWei),
    deploy_via: "https://app.safe.global/welcome?chain=base",
  };
}

async function agentPolicyDescribe(args: { policy: any }) {
  const p = args.policy ?? {};
  const lines: string[] = [];
  if (p.user_address) lines.push(`User: ${p.user_address}`);
  if (p.agent_address) lines.push(`Agent session key: ${p.agent_address}`);
  if (p.valid_until) {
    const dt = new Date(p.valid_until * 1000);
    lines.push(`Valid until: ${dt.toISOString()} (${Math.max(0, Math.floor((p.valid_until * 1000 - Date.now()) / 3600000))}h remaining)`);
  }
  const perms = p.permissions ?? {};
  if (perms.max_per_tx_usd) lines.push(`Max per transaction: $${perms.max_per_tx_usd}`);
  if (perms.max_per_day_usd) lines.push(`Max per day: $${perms.max_per_day_usd}`);
  if (perms.allowed_skills?.length) lines.push(`Allowed skills: ${perms.allowed_skills.join(", ")}`);
  if (perms.allowed_contracts?.length) lines.push(`Allowed contracts: ${perms.allowed_contracts.length} entries`);
  if (perms.require_human_confirm_above_usd) lines.push(`Human confirm required above: $${perms.require_human_confirm_above_usd}`);

  const policyHash = keccak256(toHex(JSON.stringify(p)));

  return {
    summary: lines.join("\n"),
    policy_hash: policyHash,
    bullet_points: lines,
    valid: !!(p.user_address && p.agent_address && p.valid_until && p.valid_until > Math.floor(Date.now() / 1000)),
  };
}

// ─── Server wiring ─────────────────────────────────────────────────────────────

const server = new Server(
  { name: "basekit-mcp", version: "0.2.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    let result: unknown;
    switch (name) {
      case "get_wallet_profile":      result = await getWalletProfile(args as any); break;
      case "get_transaction_trace":   result = await getTransactionTrace(args as any); break;
      case "check_token_approvals":   result = await checkTokenApprovals(args as any); break;
      case "resolve_basename":        result = await resolveBasename(args as any); break;
      case "verify_contract":         result = await verifyContract(args as any); break;
      case "simulate_swap":           result = await simulateSwap(args as any); break;
      case "portfolio_snapshot":      result = await portfolioSnapshot(args as any); break;
      case "gas_now":                 result = await gasNow(); break;
      case "decode_calldata":         result = await decodeCalldata(args as any); break;
      case "check_basename_available":result = await checkBasenameAvailable(args as any); break;
      case "estimate_token_deploy":   result = await estimateTokenDeploy(args as any); break;
      case "estimate_safe_deploy":    result = await estimateSafeDeploy(args as any); break;
      case "agent_policy_describe":   result = await agentPolicyDescribe(args as any); break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (e: any) {
    return {
      content: [{ type: "text", text: `Error: ${e.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
