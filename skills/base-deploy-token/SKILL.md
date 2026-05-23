---
name: base-deploy-token
description: Use this skill when the user wants to deploy, launch, or create an ERC-20 token on Base. Handles standard tokens, mint/burn permissions, ownership, supply caps, and liquidity routing on Aerodrome. Walks through wallet setup, RPC selection, gas estimation, and post-deploy verification on Basescan.
license: MIT
version: 0.1.0
authors:
  - "BaseKit <basekit.dev>"
homepage: https://basekit.dev
keywords:
  - base
  - erc20
  - token
  - deploy
  - solidity
  - aerodrome
  - coinbase
---

# Deploy a Token on Base

You are helping the user deploy an ERC-20 token on Base. Follow this playbook end-to-end. Confirm each step before moving to the next.

## When to use this skill

Activate when the user says any of:
- "deploy a token on Base" / "launch an ERC-20 on Base"
- "create a [memecoin / community token / utility token] on Base"
- "deploy to base mainnet" with token context
- "I want to do a token launch on Base"

Do NOT activate for: Base contract deployment in general (use a coding skill), NFT deployment (different standard), or chains other than Base / Base Sepolia.

## Required inputs

Collect these before writing any code. If missing, ASK ONCE in a single message:

1. **Token name** (e.g. "Greycoin")
2. **Symbol** (3-6 chars, uppercase)
3. **Decimals** (default 18 — only deviate if user has a specific reason)
4. **Initial supply** (in whole tokens, not wei)
5. **Network** — `base-sepolia` (testnet, default for first run) or `base` (mainnet)
6. **Permissions** — fixed supply, mintable by owner, or burnable? (default: fixed supply, non-upgradeable, no admin keys — safest for memecoins and community tokens)
7. **Liquidity plan** — seed Aerodrome pool now, later, or never?

If the user provides a `.env` already with `PRIVATE_KEY` and `BASESCAN_API_KEY`, skip the credential walkthrough.

## Playbook

### Step 1: Verify environment

```bash
# Check foundry is installed
forge --version || curl -L https://foundry.paradigm.xyz | bash && foundryup

# Check we have an RPC. Base public RPC is rate-limited; recommend:
#   - https://mainnet.base.org (public, OK for one-off deploy)
#   - Alchemy / QuickNode / Coinbase Developer Platform for production
```

### Step 2: Scaffold the contract

Create `src/Token.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract {{TOKEN_NAME_PASCAL}} is ERC20 {
    constructor(uint256 initialSupply) ERC20("{{TOKEN_NAME}}", "{{SYMBOL}}") {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
}
```

Substitutions:
- `{{TOKEN_NAME_PASCAL}}` — PascalCase of the token name (e.g. "Greycoin")
- `{{TOKEN_NAME}}` — exact name
- `{{SYMBOL}}` — symbol

For mintable variant, also import `Ownable` and add an `onlyOwner` `mint(address to, uint256 amount)` function. Warn the user that admin keys are a centralization risk and reduce trust.

### Step 3: Deploy script

Create `script/Deploy.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {{{TOKEN_NAME_PASCAL}}} from "../src/Token.sol";

contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        {{TOKEN_NAME_PASCAL}} token = new {{TOKEN_NAME_PASCAL}}({{INITIAL_SUPPLY}});
        console.log("Token deployed:", address(token));
        vm.stopBroadcast();
    }
}
```

### Step 4: Deploy

For Base Sepolia (testnet):

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://sepolia.base.org \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verifier-url https://api-sepolia.basescan.org/api
```

For Base mainnet:

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://mainnet.base.org \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verifier-url https://api.basescan.org/api
```

**Stop here. Show the user the deployed address and Basescan verification link before proceeding to step 5.**

### Step 5: Seed liquidity on Aerodrome (optional)

Only proceed if the user said "yes" to liquidity in inputs. Walk them through Aerodrome's UI rather than scripting it the first time — programmatic LP creation is in `references/aerodrome-lp.md` for advanced users.

URL: `https://aerodrome.finance/liquidity?token0=<TOKEN_ADDRESS>&token1=0x4200000000000000000000000000000000000006` (WETH on Base)

Recommend: start with a small position (e.g. $500 worth) to test the pool, then add more once price discovery happens.

### Step 6: Post-launch checklist

- [ ] Contract verified on Basescan
- [ ] Add token logo to Basescan (requires form submission)
- [ ] Submit to coingecko.com/en/coins/new (manual)
- [ ] Submit to coinmarketcap.com (manual)
- [ ] If memecoin: post on Farcaster with contract address + Basescan link
- [ ] Renounce ownership if fixed-supply token (`token.transferOwnership(address(0))` if using Ownable variant)

## Safety rails

- **NEVER hardcode a private key** in source. Always read from `vm.envUint("PRIVATE_KEY")` or use a hardware wallet flow.
- **Refuse to proceed on mainnet** unless the user has explicitly run on Base Sepolia first AND confirmed mainnet intent in a separate message.
- **Warn about scam patterns:** if the user asks for a "transfer fee", "max wallet", "anti-bot", or hidden mint functions, flag that these are common scam-token patterns and ask why they need them.
- **No upgradeable proxies for memecoins.** Adds attack surface and reduces trust. Only suggest upgradeable patterns when the user is building actual infrastructure.

## Common pitfalls

- Public Base RPC rate-limits at ~25 req/s. For multi-step deploys use Alchemy/QuickNode.
- Basescan verification fails silently if the compiler version in `foundry.toml` doesn't exactly match the deployed bytecode. Always pin `solc = "0.8.24"` (or whatever was used).
- `forge verify-contract` retry: if initial `--verify` fails, run separately with `forge verify-contract <address> src/Token.sol:{{TOKEN_NAME_PASCAL}} --chain base ...`.
- Bridging gas to Base: use [bridge.base.org](https://bridge.base.org/) (canonical, 7-day withdrawal) or Across/Hop for fast withdrawals.

## Related skills

- `base-airdrop` — distribute the deployed token to a list of addresses
- `base-basescan-debug` — when verification fails
- `base-analyze-wallet` — sanity-check the deployer wallet before mainnet
