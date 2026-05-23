# BaseKit — Strategy & Monetization

> Last updated: build session, May 22-23 2026

## Positioning

**BaseKit is the Helius-for-Base.** Helius did it for Solana with one install that bundles MCP server + skills + CLI ([Helius for Agents](https://www.helius.dev/blog/helius-for-agents)). Base has the primitives (Base MCP, AgentKit) but nobody has shipped the *opinionated playbook layer* sitting on top. We do.

### One-line pitch
> The agent skill kit for Base. Drop it into any coding environment — Claude Code, Cursor, Codex, Windsurf — and your agent ships onchain.

### Tagline candidates
1. **"Ship onchain in one prompt."** ← lead
2. "Base, fluent in agent."
3. "An agent that speaks Base."

## The Wedge

Existing options force devs to choose between:
- **Base MCP** (raw tools, no playbooks)
- **AgentKit** (SDK, requires custom integration code)
- **Random GitHub gists** (untrusted, stale)

BaseKit ships **playbooks as skills** — Claude/Cursor/etc. auto-load the right skill when the user's task matches. Progressive disclosure means even a 50-skill catalog stays cheap on context.

## Why this wins
1. **Distribution gap.** `claudemarketplaces.com` (170k monthly devs) has a Blockchain & Web3 category that's currently thin ([Claude Code Plugin Marketplace](https://claudemarketplaces.com)).
2. **Base is faster-growing than Solana on the agentic side** with AI agents projected to outnumber humans onchain — Brian Armstrong publicly. Base MCP exists but is bare-bones.
3. **Skill standard is portable.** SKILL.md spec is adopted by Claude Code, OpenAI Codex, Cursor, Gemini CLI ([Snyk on Claude Skills](https://snyk.io/articles/top-claude-skills-finance-quantitative-developers/)). Write once, ship everywhere.
4. **Top-of-funnel for B3OS.** Every install is a qualified lead for B3OS automation work.

## Product surface

```
basekit/
├── core (free, open source)              # Discovery + adoption layer
│   ├── 5 SKILL.md skills
│   ├── MCP server (wraps Base MCP + AgentKit primitives w/ ergonomics)
│   ├── Plugin manifest (one-command install)
│   └── /agents.txt, /llms.txt, /skill.md endpoints
│
└── pro (paid, $29/mo or $79 one-time)    # Revenue layer
    ├── 10+ advanced skills (deep playbooks)
    ├── Hosted indexing (faster wallet/contract lookups)
    ├── MEV-resistant deploy templates
    ├── Multi-sig deploy + treasury playbooks
    └── Priority support
```

## Marketplaces — listing plan

Priority order (start with the first 4, expand to all 8 by end of week 2):

| Rank | Marketplace | What we ship | Why |
|---|---|---|---|
| 1 | **claudemarketplaces.com** | Plugin manifest (free) → Pro upsell | 170K monthly devs; Blockchain & Web3 category is thin |
| 2 | **mcp.so + Smithery + PulseMCP** | MCP server (free) | Default registry for any MCP-compatible client; community-run, near-instant submission |
| 3 | **Agensi** | Free + Pro skill bundle ($15-19) | 80/20 split; sweet spot pricing for crypto devs |
| 4 | **SkillHQ** | Pro Domain-Expertise bundle ($79+) | 85% to seller; their "Specialized Domain Expertise" tier reportedly does $79+ |
| 5 | GitHub (awesome-mcp-servers, awesome-agent-skills) | PRs to both lists | Free SEO via repos with 26K+ stars |
| 6 | Hugging Face Spaces | Demo "BaseKit playground" | Default OSS storefront; high-intent leads |
| 7 | Vercel Agent Gallery | Showcase listing | Credibility signal in Next.js ecosystem |
| 8 | Replit Agent Market | Full agent ("Base Builder Agent") | Highest revenue-per-listing for productized agents |

## Pricing — recommended model

Research-backed numbers ([Agensi pricing 2026](https://www.agensi.io/learn/how-to-price-skill-md-skills), [SkillHQ Reddit data](https://www.reddit.com/r/PromptEngineering/comments/1sm660j/i_built_a_marketplace_for_selling_claude_code/)):

| Tier | Price | Where | What's included |
|---|---|---|---|
| **Open Source** | $0 | GitHub, mcp.so, claudemarketplaces, Agensi free | 5 core skills + MCP server. Forever free. |
| **BaseKit Pro (one-time)** | $79 | SkillHQ, Agensi Pro bundle | 10 advanced skills, full doc reference, lifetime updates |
| **BaseKit Pro (subscription)** | $19/mo or $190/yr | basekit.dev direct + Pro plan flag | Everything in one-time + hosted indexing API, priority support, monthly new-skill drops |
| **Team / Studio** | $99/mo | basekit.dev direct | 5 seats, shared org keys, slack support |
| **Enterprise** | Custom | Direct outreach | White-label skills, custom playbooks, B3OS services attach |

### Why this pricing
- **$0 core = distribution.** Free skill drives marketplace installs, which drive ranking, which drives lead-gen. Every installer becomes a candidate for Pro.
- **$79 one-time = impulse-buy ceiling.** SkillHQ's domain-expertise tier sells at this exact price. Crypto devs have budget, hate subscriptions for tools.
- **$19/mo subscription = recurring revenue.** Devs who want hosted indexing convert here. This is the autopilot revenue engine.
- **$99/mo Team = predictable MRR.** Small studios building on Base will buy this.

### Revenue model math (conservative)
With 1000 free installs in month 1 (very achievable for a well-positioned skill):
- 3% convert to $79 one-time = 30 × $79 × 0.85 (SkillHQ) = **$2,015**
- 1.5% convert to $19/mo = 15 × $19 = **$285 MRR** = **$3,420 ARR**
- Cross-sell to 2 Team accounts = **$198 MRR** = **$2,376 ARR**

Year 1 trajectory at 20% MoM growth in installs: **$30-50K ARR is realistic from BaseKit alone**, plus an unmeasured amount of B3OS lead-gen.

## Discovery & SEO

Three layers:
1. **Marketplace SEO** — keyword-rich SKILL.md descriptions ("Use this skill when deploying ERC-20 tokens on Base") — descriptions matter for skill activation, not just discovery.
2. **basekit.dev SEO** — landing page targets "Base MCP", "Base agent skill", "deploy ERC-20 Base", "Base Coinbase agent"
3. **GitHub topic seeding** — `base`, `mcp-server`, `agent-skills`, `claude-skill`, `web3-agent`

## Launch sequence

1. Ship core skills + MCP to GitHub, public repo, MIT license ✅ (this session)
2. Submit to mcp.so + Smithery + PulseMCP (instant) ✅ (this session)
3. Ship landing page basekit.dev (or pplx.app preview) ✅ (this session)
4. Post in r/ClaudeAI, r/mcp, r/web3, Base Discord (build in public) (Grey to approve copy)
5. Submit to claudemarketplaces.com (PR-based) (Grey to approve)
6. Tweet thread + Farcaster cast (Grey to send)
7. List paid versions on Agensi + SkillHQ once free version has 50+ installs

## What we are NOT doing (yet)
- ❌ Custom token / onchain monetization (overcomplicates; do later)
- ❌ Hosted dashboard SaaS (out of scope for weekend)
- ❌ Mobile app (Base App is enough)
- ❌ GPT Store listing (negligible revenue below top 1000)
