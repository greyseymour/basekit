# v0.2.5 — Base MCP interop launch

**Trigger:** Quote-cast / quote-tweet of Base's Base MCP announcement.
**Source post:** https://x.com/base/status/2059305907385704529
**Posted:** [pending]
**Channels:** Farcaster (home + /base + /ai), X (quote-tweet)

---

## Primary cast (the one-liner)

> Base MCP gives your agent a wallet.
> BaseKit gives it the playbook.
>
> 16 SKILL.md skills + 13 read-only tools. MIT. Install from source today.
> Stack with Base MCP — they sign, we plan. 🩵
>
> github.com/greyseymour/basekit

[attach: screenshot of Together flow diagram from /00 stack section]

---

## Alt versions

### Tighter (X char-budget aware, 280)

> Base MCP gives your agent a wallet. BaseKit gives it the playbook.
>
> 16 skills, 13 read-only tools, MIT. Stack them — Base MCP signs, BaseKit plans.
>
> github.com/greyseymour/basekit 🩵

### Builder voice (Farcaster /dev or /builders)

> shipped v0.2.5 of basekit today. coordination layer for running it alongside @base's new MCP.
>
> base-mcp-bridge skill = the explicit deferral contract. wallet ops route to base-mcp, deploy/verify/audit/mev-defense stay here.
>
> not competitive. complementary. read the interop doc:
> basekit.dev/docs/BASE-MCP-INTEROP.md

### Anti-establishment (no hype, just receipts)

> base shipped MCP this morning. closed-source, wallet-layer.
>
> we shipped basekit v0.2.5 this afternoon. open-source, planning-layer.
>
> they sign. we plan. install both. 🩵
>
> github.com/greyseymour/basekit

---

## Reply chain (post under primary)

### Reply 1 — the division of labor

> the rule is simple:
>
> base mcp owns wallet ops — send, swap, sign, execute, x402 stablecoin micropays.
> basekit owns the playbooks — deploy, verify, audit, mev defense, multisig, airdrops, frames, a2a trust.
>
> overlap on portfolio reads & basenames. either works.

### Reply 2 — the bridge skill

> the new skill is `base-mcp-bridge`. it's a deferral contract, not code.
>
> 4-phase routing: PLAN → PREFLIGHT → CONFIRM → EXECUTE → AUDIT.
> basekit drafts and verifies. base-mcp signs. agent-onchain-handshake writes the audit trail.
>
> github.com/greyseymour/basekit/blob/master/skills/base-mcp-bridge/SKILL.md

### Reply 3 — install both

> ```json
> {
>   "mcpServers": {
>     "base-mcp": { "command": "npx", "args": ["-y", "@base-org/base-mcp"] },
>     "basekit":  { "command": "npx", "args": ["-y", "@basekit/mcp"] }
>   }
> }
> ```
>
> both servers run side-by-side in claude desktop. the bridge skill handles the routing.

### Reply 4 — invitation

> if you're building agents on base, drop the agent.json link or a github repo.
>
> i'll wire interop_with declarations into basekit's discovery layer. open standard, not a walled garden.

---

## Posting checklist

- [ ] Primary cast goes out as **quote-cast** of Base's announcement — context first
- [ ] Attach screenshot of `/00` stack section "Together" flow diagram
- [ ] Crosspost to `/base`, `/ai`, `/dev`, `/builders` channels on Farcaster
- [ ] X version: quote-tweet of https://x.com/base/status/2059305907385704529
- [ ] Pin reply chain on profile for 24h
- [ ] DM @jessepollak / @brianarmstrong only if reply chain hits >50 recasts (don't force)
- [ ] No tagging Coinbase/Base accounts on launch — let it stand on its own merits
