# BaseKit — Decisions made, permissions needed

> Aggregated for Grey on wakeup. Built overnight by Ayrenne 🩵.
> Last updated: Sat May 23 2026, ~12:15am MDT.

---

## TL;DR — what's done, what needs you

**Shipped while you slept:**
- Strategy + brand + 5 SKILL.md playbooks + MCP server scaffolded
- Landing page built and deployed to a preview URL (dark default, liquid glass, Doto display hero, "speaks Base." in Base Blue — you'll see)
- /llms.txt /agents.txt /skill.md /plugin.json all live
- README, LICENSE (MIT), tweet thread, Farcaster cast, demo gif script, marketplace listing copy
- Pricing locked: Free / $19 / $99 / Enterprise

**Need your call before launch:**
1. **Domain — `basekit.dev`** ($12-15/yr, Namecheap/Cloudflare). I held off. Decide & buy, or veto and pick a different domain.
2. **GitHub org/repo — `github.com/basekit/basekit`**. Create the org, or tell me to host under `@greyseymour`.
3. **npm scope — `@basekit`**. Reserve it or I'll fall back to `basekit-mcp` (unscoped).
4. **Pro waitlist storage** — Dub link → Notion form, or a Tally/Typeform? (Cheap to set up either way.)
5. **Launch timing** — Tuesday 9am PT post-coffee feels right, but you tell me.
6. **Co-launch with B3OS?** — Cross-promote on @b3os.xyz, or keep BaseKit visually separate? (My instinct: separate brand, B3OS quote-tweets later.)
7. **Skill #6 vote** — what's next after the core 5? (Candidates inside.)

Everything else I decided unilaterally and noted below. Push back on any.

---

## Permission asks (do these when you can)

### 1. Buy the domain `basekit.dev`

- **Why dev:** matches `claudemarketplaces.com`'s aesthetic, signals "for builders," and `.dev` enforces HTTPS by default.
- **Cost:** ~$12-15/yr (Namecheap or Cloudflare Registrar — Cloudflare is at-cost).
- **Alternative:** `basekit.xyz` (~$2 first-year, cheaper renewal $10). Slightly less SaaS-y; more onchain-native.
- **My pick:** `basekit.dev`.
- **Blocker for:** Pointing the preview at a real URL, the OG meta tags, the launch tweet.

### 2. Create the GitHub repo

- **Recommendation:** `github.com/basekit/basekit` (new org).
- **Why org over personal:** signals "this is a project, not a side experiment," and lets contributors get push access without flooding your personal repo perms.
- **Alternative:** `github.com/greyseymour/basekit` — faster but worse signal.
- **Blocker for:** All the install commands (`git clone`, `claude plugin install`), every README badge, the launch tweet's CTA.

### 3. Reserve the npm scope

- **Recommendation:** `@basekit` (npm scope, register at npmjs.com/~basekit).
- **Why:** Lets us ship `@basekit/mcp`, `@basekit/skills`, `@basekit/cli` without name clashes.
- **Fallback:** Unscoped `basekit-mcp` and `basekit-skills` — works but uglier.
- **Cost:** $0.
- **Blocker for:** `npx -y @basekit/mcp` install path in every coding-env snippet on the site.

### 4. Choose the Pro waitlist form provider

I held off so we don't accidentally end up paying for something we use once.
- **Option A — Tally** (free, fast, embed-friendly). My pick.
- **Option B — Typeform** (prettier, free tier capped, slower).
- **Option C — Just a `mailto:` link** ("email hello@basekit.dev with subject 'pro'"). Lowest friction, captures less data.

### 5. Set the launch date + channels

- **My pick:** Tuesday May 26, 9am PT.
- **Why Tues 9 PT:** post-Monday-inbox, pre-standup, hits the West Coast crypto crowd at coffee time, EU at end of workday, no holiday conflicts.
- **Channels in order:** X main thread → Farcaster `/base` channel → mcp.so + Smithery + PulseMCP submissions → claudemarketplaces.com → awesome-* PRs.
- **Defer:** SkillHQ + Agensi onboarding (these take a few days, do post-launch).

### 6. Co-launch with B3OS?

- **My pick:** Separate brand identity for BaseKit. B3OS quote-tweets the launch with a "👀 the team also built this" frame the day after.
- **Why:** Lets BaseKit live or die on its own merit. If it lands, it backflows to B3OS organically. If it doesn't, it doesn't drag the B3OS brand.
- **Veto reason that would change my mind:** if you want BaseKit positioned explicitly as a B3OS product line. Then we flip the framing to "B3OS presents BaseKit" and lean on the existing B3OS audience.

### 7. Vote: which skill ships sixth?

The five core skills are deliberately MVP-shaped. The next one defines the Pro tier. Candidates:

| Candidate | Pitch | Pro tier fit |
|---|---|---|
| `base-deploy-nft` | ERC-721/1155, lazy mint, metadata pin to IPFS via Lighthouse, OpenSea preview. | Solid. Wide audience. |
| `base-treasury` | Multi-sig spend plan + Gnosis Safe tx batching + executor flow. | High value, narrower audience. |
| `base-prediction-market` | Polymarket-style binary market on Aerodrome rails. | Spicy, on-trend, narrow. |
| `base-mev-resistant` | Private mempool deploys via flashbots-on-base + commit-reveal patterns. | Premium, signals "Pro is real." My pick. |

**My pick:** `base-mev-resistant`. Strongest signal that Pro is differentiated from Free. Also it's a "thing only crypto natives know to ask for," which is exactly the audience that pays.

---

## Decisions I made unilaterally (push back on any)

### Brand & visual

- **Name:** BaseKit. Confirmed unique on npm + GitHub + .dev (you'll verify when you buy).
- **Wordmark:** lowercase `basekit` in Inter Tight, tight letter-spacing.
- **Mark:** Code brackets framing a Base-style filled square. SVG, single color, scales 24px → 200px.
- **Palette:** Locked.
  - Accent (light mode): `#0000FF` (modern Base Blue — your call from the kickoff)
  - Accent (dark mode): `#3D3DFF` (Base Blue brightened ~12% for dark surfaces)
  - Surfaces: warm-tinted near-black (#0A0A0F) → mid (#16161D) → border (#26262E)
  - Light: pure white surfaces, charcoal text
- **Fonts:**
  - Hero display: **Doto** (dot-matrix retro-tech — the iconic moment is the "speaks Base." line in Doto + Base Blue)
  - Body & UI: **Inter Tight** (matches Base's own fallback)
  - Code & terminal: **JetBrains Mono**
- **Motion:** All curves use `cubic-bezier(0.4, 0, 0.2, 1)`, durations 120-240ms snap, sequences ≤800ms, ≤10° distortion — matches Base's published motion brand.

### Architecture

- **Skill format:** Open SKILL.md spec (Claude's standard) — works in Claude Code, Cursor, Codex, Windsurf, any SKILL.md-compatible runtime.
- **MCP server:** Node 20+, TypeScript, viem under the hood, `@modelcontextprotocol/sdk`. Six tools, all read-only. Read-only is deliberate — writes happen via the SKILL.md playbooks that walk the user through signing locally.
- **Plugin manifest:** Claude's `plugin.json` format. Bundles all five skills + the MCP server. One install for the whole kit.
- **Discovery endpoints:** `/llms.txt`, `/agents.txt`, `/skill.md`, `/plugin.json`, `/.well-known/mcp.json` — all at predictable paths so an agent can crawl and install without a human.

### Pricing

| Tier | Price | What you get |
|---|---|---|
| Open Source | $0 forever | 5 core skills + MCP + MIT |
| Pro | $19/mo or $190/yr or $79 one-time on SkillHQ | 10+ advanced skills, hosted indexing (no Alchemy key needed), monthly drops, priority support |
| Studio | $99/mo | 5 seats, shared org keys, Slack channel, 1 custom skill request/mo, onboarding session |
| Enterprise | Custom | White-label, SLA, custom skills, training |

**Rationale:** The $19 Pro price is anchor-low so the wedge is "just install and try"; Studio at $99 captures the actual team-budget purchase signal; Enterprise exists to catch large customers without you needing to publish a number.

### Marketplace strategy

Submitting in this order: mcp.so → Smithery → PulseMCP → claudemarketplaces.com → Agensi → SkillHQ. The first four are free SEO, second two are revenue.

### Repo layout

- `/skills/*/SKILL.md` — the five playbooks (~150 lines each)
- `/mcp/` — Node TS MCP server, `@basekit/mcp` published to npm
- `/plugin.json` — Claude plugin manifest (root)
- `/site/public/` — the landing page (deployed to preview, will move to basekit.dev once domain is yours)
- `/brand/`, `/docs/`, `/launch/` — supporting docs

### Voice & tone for all copy

- Lowercase casual but precise.
- One small wink per surface ("🩵 by builders on Base", rotator strip, `gm` easter egg).
- Anti-AI rules enforced everywhere: no purple/teal gradients, no glowing orbs, no chatbot on the marketing site, no "Welcome to the future" copy.
- Doto hero font is the one moment of personality — everything else is restrained Inter Tight + mono.

---

## What's still TODO when you're awake

In rough priority order:

1. **You buy the domain + create the GitHub repo + reserve the npm scope** (15 min, unblocks everything).
2. **I push the workspace to your Mac at `~/Desktop/BaseKit`** (last step in the build).
3. **You skim the site preview**, tell me what to change (color hue, type weight, copy line that doesn't land).
4. **Together we record the demo gif** — 8 seconds, asciinema script ready in `launch/DEMO_GIF_SCRIPT.md`.
5. **You publish the GitHub repo + npm package + DNS** (with my help over the shoulder).
6. **Schedule the launch tweet thread for Tues 9am PT.**
7. **Submit to mcp.so / Smithery / PulseMCP** (Tuesday late morning, post-launch).
8. **Start building skill #6** (your vote determines which) for the Pro waitlist drop in two weeks.

---

## Open questions I can't answer for you

- Do you want me to write the actual MCP tool implementations beyond the scaffold? (Currently `mcp/src/index.ts` has the tool schemas + stubs. Real viem calls are ~1-2 hours of work, want me to push on those next or table for after launch?)
- Do you want first-class **Coinbase Smart Wallet** support baked into `base-deploy-token`? (My take: yes, it's the most under-marketed Base advantage. Default to it after sepolia path works.)
- **Telegram bot vs Slack channel for Studio tier support?** I'm leaning Telegram (matches the crypto-native customer; Slack feels more SaaS-CTO than onchain-builder).

---

## Files Grey should open first (in this order)

1. `/site/public/index.html` — the landing page (see it deployed via the preview)
2. `/docs/STRATEGY.md` — positioning, monetization, marketplace plan
3. `/skills/base-deploy-token/SKILL.md` — the flagship skill, sets the bar for the others
4. `/launch/TWEET_THREAD.md` — read the hook tweet, tell me if it slaps
5. `/README.md` — the public face of the repo
6. (this file)

Built it for us 🩵
