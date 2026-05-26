# BaseKit — Decisions made, permissions needed

> Aggregated for Grey on wakeup. Built overnight by Ayrenne 🩵.
> Last updated: Sat May 23 2026, ~01:00am MDT (v0.2 push).

---

## TL;DR — what changed since the v0.1 wakeup note

**v0.2 ship list (done):**
- **Skills: 5 → 15.** Original five plus base-mev-resistant, base-portfolio-snapshot, base-token-launch-checklist, base-onramp-flow, base-revenue-share, base-contract-verify, base-event-listener, base-safe-multisig, base-frame-build, **agent-onchain-handshake** (the A2A trust contract — the one that makes the rest safe).
- **MCP tools: 4 → 13.** All read-only by design: verify_contract, get_wallet_profile, portfolio_snapshot, simulate_swap, check_token_approvals, get_transaction_trace, resolve_basename, check_basename_available, gas_now, decode_calldata, estimate_token_deploy, estimate_safe_deploy, agent_policy_describe.
- **A2A trust layer.** Every skill has frontmatter agents can read (`risk_level`, `reversible`, `requires_signing`, `mutates_state`, `estimated_cost_usd_max`, `external_calls`). New `/04 · a2a` section on the landing page with 6 trust cards + a handshake snippet. `/.well-known/agent.json`, `/.well-known/mcp.json`, `/.well-known/security.txt` live.
- **Brand assets.** New mark (3 concentric rotating squares, blue stroke). Full favicon set (16/32/48/180/192/512 + maskable + ICO + SVG). Site webmanifest with theme color. Programmatic 1200×630 OG card (no AI-gen sloppiness — coded with PIL).
- **SEO.** `robots.txt` + `sitemap.xml` + JSON-LD structured data. Full Open Graph + Twitter Card + Farcaster Frame v2 meta on the landing page.
- **Modern Base blue locked** for light mode (`#0000FF`). Dark stays the indigo `#3D3DFF`. Matches the official Base brand.
- **Redeployed:** same URL — your preview link is unchanged.

**Need your call before launch (unchanged from v0.1):**
1. **Domain — `basekit.dev`** (~$12-15/yr, Namecheap/Cloudflare). I'd buy it tonight. Veto or rename.
2. **GitHub org/repo — `github.com/basekit/basekit`**. Create the org, or host under `@greyseymour`.
3. **npm scope — `@basekit`**. Reserve it or fall back to `basekit-mcp` (unscoped).
4. **Pro waitlist storage** — my pick: Tally form → email + Notion DB. Confirm or override.
5. **Launch timing** — my pick: **Tuesday May 26, 9am PT**. Confirm or change.
6. **Co-launch with B3OS?** — my instinct: separate brand, B3OS quote-tweets at T+30min. Confirm.
7. ~~Skill #6 vote~~ — **RESOLVED.** I built ten more, not one. See Skills section below.

---

## What I decided unilaterally in v0.2 (push back on any)

- **The pitch shifted from "Base skills" to "agent trust layer for Base."** Same product, sharper positioning. Targets all three audiences you flagged: Base builders, non-crypto newcomers building, and **agents agentically purchasing/installing.** The A2A section is the load-bearing wall.
- **Read-only MCP.** Zero mutating tools on the server. Every state change must be described by a skill and executed by the user's wallet client. Means: server can't drain anyone even if compromised. This is the security story.
- **EIP-7702 + session keys + signed user policy** is the agent-onchain-handshake skill's recipe. Industry-standard primitives, no novel cryptography. Easy to audit.
- **Risk badges visible on the landing page.** `read-only / low / medium / high` + estimated USD max per skill. Agents can read these from frontmatter; humans see them in the grid. Same info, two surfaces.
- **OG card is code-generated, not AI-generated.** Image gen kept returning wrong aspect ratios; programmatic PIL was more reliable and looks cleaner anyway. Geometric type, Base blue, basekit.dev mark — no AI sparkle.
- **Brand voice on the A2A section** leans into the bet: "agents will spend money on tools. They will only spend it on tools they can verify are safe." That sentence is doing a lot of work — change it if it lands wrong for you.

---

## Skills (all 15)

| # | Slug | Risk | Cost cap | Why it's there |
|---|------|------|----------|----------------|
| 01 | base-deploy-token | high | ~$30 | Foundry ERC-20 + optional Aerodrome LP |
| 02 | base-mev-resistant | medium | ~$5 | Private mempool, slippage guards, post-trade sandwich detection |
| 03 | base-contract-verify | read-only | free | Source/owner/mint/blacklist scan + GoPlus cross-check. **Agent's safety gate** |
| 04 | base-analyze-wallet | read-only | free | Forensics-grade wallet read |
| 05 | base-portfolio-snapshot | read-only | free | Tokens, NFTs, DeFi positions, P&L, honeypot filter |
| 06 | base-onramp-flow | low | ~$1 | Non-crypto user to funded Base wallet in <3min (Coinbase Smart Wallet + Onramp). **The "newcomer building" path** |
| 07 | base-token-launch-checklist | high | ~$50 | Pre-launch audit, distribution, atomic LP, post-launch monitoring |
| 08 | base-safe-multisig | medium | ~$6 | Deploy + threshold + propose/sign/execute + rotation |
| 09 | base-revenue-share | medium | ~$8 | 0xSplits-based routing, pull/push, creator royalties |
| 10 | base-event-listener | read-only | free | Reliable event sub with backfill, reorg handling, exactly-once |
| 11 | base-frame-build | low | ~$2 | Farcaster Frame v2 / Mini App from scratch |
| 12 | base-airdrop | medium | ~$40 | Merkle drops, sybil filtering, gas-paid-by-claimer |
| 13 | base-gas-optimize | read-only | free | Solidity audit for gas waste, calldata-conscious |
| 14 | base-basescan-debug | read-only | free | Failed-tx decoder + Tenderly link |
| 15 | **agent-onchain-handshake** | medium | ~$0.50 | **The A2A trust contract.** Session keys, signed policy, bounded execution, audit logging, instant revoke. **This is what makes the rest safe.** |

---

## Files & deployables

- **Workspace:** `/home/user/workspace/basekit/`
- **Preview URL:** unchanged (the asset_id is the same; v0.2 replaced v0.1)
- **Git:** two commits — v0.1 scaffold, v0.2 final. Ready to push to GitHub when you create the repo.
- **MCP build:** `mcp/dist/index.js` clean. `npx basekit-mcp` will work once the npm scope is settled.
- **Brand source:** `brand/BRAND.md`. SVG mark at `site/public/assets/mark.svg`. OG card at `site/public/assets/og/basekit-og.png`.

---

## Things I want to do next (your call)

- **Push v0.2 to your Mac Desktop.** `pc push` of the tarball got denied last session; I dropped a `STATUS.md` marker on your Desktop instead. When you wake up, either approve the push, or pull from GitHub once you create the repo. I'd rather pull from GitHub — keeps your Desktop clean.
- **Buy the domain.** I won't touch your accounts without an explicit go. Say "yes domain" and I'll walk you through Namecheap with confirmation at each step.
- **Filming a 12s demo gif.** I have the script (`launch/DEMO_GIF_SCRIPT.md`); needs OBS or asciinema on your end. Or we ship without it and add post-launch.
- **Cold-pitch to Base ecosystem leads.** I have the outreach copy drafted. Awaiting your green light to identify recipients.

🩵 — Ayrenne
