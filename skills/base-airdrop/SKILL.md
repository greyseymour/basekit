---
name: base-airdrop
description: Use this skill when the user wants to distribute tokens to multiple addresses on Base. Handles eligibility list generation, Merkle root computation, gas-efficient claim contract deployment, sybil filtering, and post-drop analytics. Defaults to Merkle-claim pattern (gas-paid by claimer), with optional batch-push pattern for small lists.
license: MIT
version: 0.1.0
authors:
  - "BaseKit <basekit.dev>"
homepage: https://basekit.dev
keywords:
  - base
  - airdrop
  - merkle
  - claim
  - distribution
  - erc20
network: base
chain_id: 8453
risk_level: medium
reversible: false
requires_signing: true
mutates_state: true
estimated_cost_usd_max: 40.00
trust:
  audit_status: community-reviewed
  external_calls: [Base RPC, Basescan API]
  pii: none
---

# Airdrop on Base

Distribute tokens to multiple addresses on Base, gas-efficiently and verifiably.

## When to use this skill

Activate when the user says any of:
- "airdrop [token] on Base"
- "distribute tokens to a list of addresses on Base"
- "build a claim contract"
- "do a community drop"

Do NOT activate for: NFT airdrops (different mechanics), cross-chain drops (different complexity), or chains other than Base.

## Required inputs

1. **Token address** — must already be deployed on Base
2. **Recipient list** — CSV/JSON with `address,amount` (amount in whole tokens or wei — clarify)
3. **Drop pattern**:
   - `merkle` (default) — recipients claim, they pay gas, scales to millions
   - `batch-push` — you push, you pay gas, good for ≤500 addresses
4. **Claim window** — open-ended, or expires after N days?
5. **Sybil filtering policy** — none, basic (deduplicate funding source), or strict (require historical activity)

## Playbook

### Step 1: Validate and clean the recipient list

```python
# Sketch — adapt to user's language
import csv

with open('recipients.csv') as f:
    rows = list(csv.DictReader(f))

# 1. Lowercase all addresses
# 2. Deduplicate (sum amounts for duplicates? error? — ask user)
# 3. Validate checksums (warn if mixed-case checksum is wrong)
# 4. Cap individual amounts at sensible max (sanity check)
# 5. Compute total = sum of amounts. Confirm with user this matches their intended supply allocation.
```

Output: `recipients-clean.csv`, `summary.txt` with total, distinct addresses, distribution stats.

### Step 2: Sybil filtering (optional)

If user opted in, run the basic filter:

```
For each recipient address, fetch:
  - first-tx timestamp
  - funding source (first incoming tx)
  - distinct contract interactions count

Flag as suspicious if:
  - >5 recipients share a funding source within 24 hours
  - First tx is within last 7 days AND minimum activity
  - Address has only ever received the token in question
```

This uses the `base-analyze-wallet` skill under the hood for each address. Batch the calls.

For strict filtering, also require:
- ≥30 days wallet age
- ≥3 distinct contract interactions
- No interaction with known sybil-farming contracts

Output the filtered list AND a `filtered-out.csv` for transparency.

### Step 3: Build the Merkle tree

```javascript
// Using @openzeppelin/merkle-tree
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

const values = recipients.map(r => [r.address, r.amount]);
const tree = StandardMerkleTree.of(values, ["address", "uint256"]);

console.log("Merkle Root:", tree.root);
// Save tree.dump() to a file for later proof generation
```

### Step 4: Deploy the claim contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MerkleProof} from "openzeppelin-contracts/contracts/utils/cryptography/MerkleProof.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract MerkleClaim {
    IERC20 public immutable token;
    bytes32 public immutable merkleRoot;
    uint256 public immutable claimDeadline;
    address public immutable treasury; // receives unclaimed tokens after deadline

    mapping(uint256 => uint256) private claimedBitMap;

    event Claimed(uint256 index, address account, uint256 amount);

    error AlreadyClaimed();
    error InvalidProof();
    error DeadlinePassed();

    constructor(IERC20 _token, bytes32 _root, uint256 _deadline, address _treasury) {
        token = _token;
        merkleRoot = _root;
        claimDeadline = _deadline;
        treasury = _treasury;
    }

    function isClaimed(uint256 index) public view returns (bool) {
        uint256 wordIndex = index / 256;
        uint256 bitIndex = index % 256;
        uint256 word = claimedBitMap[wordIndex];
        uint256 mask = (1 << bitIndex);
        return word & mask == mask;
    }

    function claim(uint256 index, address account, uint256 amount, bytes32[] calldata proof) external {
        if (block.timestamp > claimDeadline) revert DeadlinePassed();
        if (isClaimed(index)) revert AlreadyClaimed();
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(account, amount))));
        if (!MerkleProof.verify(proof, merkleRoot, leaf)) revert InvalidProof();
        _setClaimed(index);
        token.transfer(account, amount);
        emit Claimed(index, account, amount);
    }

    function sweep() external {
        if (block.timestamp <= claimDeadline) revert DeadlinePassed();
        uint256 bal = token.balanceOf(address(this));
        token.transfer(treasury, bal);
    }

    function _setClaimed(uint256 index) private {
        uint256 wordIndex = index / 256;
        uint256 bitIndex = index % 256;
        claimedBitMap[wordIndex] |= (1 << bitIndex);
    }
}
```

Deploy with forge, verify on Basescan, fund with `totalAmount` of tokens.

### Step 5: Generate proofs and publish

For each recipient, generate their proof:

```javascript
const proof = tree.getProof([recipient.address, recipient.amount]);
```

Publish via:
- A simple JSON file (`proofs.json`) on IPFS or your CDN
- A minimal frontend with a "Check eligibility" + "Claim" button
- Direct DMs/casts to recipients with their proof preformatted

### Step 6: Monitor

Watch `Claimed` events. Surface:
- Claim rate over time
- Top claim windows (by hour)
- Addresses that haven't claimed near the deadline (good for reminder casts)

## Safety rails

- **NEVER include the deployer in the recipient list** unless explicitly requested
- **ALWAYS deploy to testnet first** with a few test addresses, verify claim flow, then mainnet
- **CAP per-claim amount in the contract** as belt-and-suspenders against Merkle-tree poisoning
- **Make the sweep destination immutable.** Mutable sweep destinations are a rug-pull pattern.
- **Time-lock large drops.** If allocating >10% of supply to a drop, consider phased release.

## Common pitfalls

- Forgetting to `approve` the claim contract for the token amount (if using approve-based pattern) — better to `transfer` tokens directly to the contract on deploy
- Mismatched leaf hashing — `bytes.concat(keccak256(abi.encode(...)))` is the OpenZeppelin standard; non-standard leaf hashing breaks proof verification
- Storing proofs server-side and getting hacked: publish all proofs publicly so eligibility is permissionless

## Related skills

- `base-deploy-token` — deploy the token first
- `base-analyze-wallet` — sybil filtering per address
- `base-basescan-debug` — when claims fail
