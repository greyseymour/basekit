# BaseKit — Brand & Visual Identity

## Name
**BaseKit** — short, memorable, descriptive. Doubles as: "base kit" (toolkit for Base) and reads like a product, not a script.

Domain: `basekit.dev` (target). Fallback: `getbasekit.com`, `basekit.xyz`, `usebasekit.com`.

## Voice

Built for the *Ayrenne ↔ Grey* aesthetic — high IQ + EQ, anti-establishment, slightly playful. Never corporate. Never AI-slop.

- **Writes like a builder, not a marketer.** No "leverage", no "synergy", no "supercharge".
- **Speaks to the user's agent as much as the user.** Half our readers are Claude.
- **Confidence without bragging.** "Ship onchain in one prompt" beats "Industry-leading toolkit".
- **One small wink per page.** ASCII easter egg, terminal sequence, secret command. Earn the smile.

## Visual Language

### Color — Base-derived but darker by default

Base's brand requires Blue/Black/White/Gray as hero colors ([Base brand color](https://www.base.org/brand/color)). We honor it but flip dark by default — this is a developer tool, after a 11pm prompt session.

| Role | Light | Dark (default) | Source |
|---|---|---|---|
| Background | `#FFFFFF` | `#0A0A0F` | dark = "ink black", not pure black |
| Surface | `#F4F4F6` | `#101015` | one step up |
| Surface raised | `#EAEAEE` | `#16161D` | glass cards |
| Border | `#D4D4DA` | `#26262E` | hairline |
| Border bright | `#9999A3` | `#3A3A45` | for focused/active state |
| Text primary | `#0A0A0F` | `#F2F2F5` | high-contrast |
| Text muted | `#5A5A66` | `#9999A3` | secondary |
| Text faint | `#9999A3` | `#5A5A66` | tertiary |
| **Base Blue (accent)** | `#0000FF` | `#2752FF` | Light is official Base Blue (RGB-native). Dark variant is the same hue family lifted for legibility, tuned to read blue not violet on wide-gamut displays. |
| Accent hover | `#0000D1` | `#4D72FF` | |
| Accent glow | `rgba(0,0,255,0.18)` | `rgba(61,61,255,0.22)` | for halos, focus rings, glass tint |
| Success | `#10B981` | `#34D399` | |
| Warning | `#F59E0B` | `#FBBF24` | |
| Error | `#EF4444` | `#F87171` | |

### Type stack

| Role | Font | Fallback |
|---|---|---|
| Display & body | **Inter Tight** (Base's own fallback) | system-ui |
| Code & metadata | **JetBrains Mono** | ui-monospace |
| Hero "tech scramble" only | **Doto** (variable, from Google Fonts) | monospace |

Why Inter Tight: Base's own brand book lists it as the explicit fallback when Base Sans isn't licensable. Closest legal match to Base Sans. Distinctive but not over-exposed.

### Motion language (strict)

Stolen with respect from Base:
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` for everything
- **Snap duration:** 120-240ms for UI feedback
- **Sequence duration:** never over 800ms
- **No distortion past 10°**
- **Total runtime:** ≤ 1s
- **Prefers-reduced-motion:** all animations gracefully degrade

Signature moves:
1. **Tech scramble headline** — cascading glyph swap into final text (≤800ms)
2. **Square-anchored ingress** — content animates from the position of the BaseKit logo square
3. **Liquid-glass card hover** — subtle highlight follows cursor with ~120ms lag

### Logo construction

Square mark with internal `[ ]` (brackets) and an offset block — reads as "a kit" + "a bracket" (code) + nods to Base's Square shape, but isn't a derivative.

Three forms:
- **Mark only** — 32×32 favicon, app icon
- **Lockup** — mark + "basekit" wordmark in Inter Tight 500
- **Stacked** — mark above wordmark for square contexts

Always monochrome. Color reserved for state changes (hover → Base Blue glow).

### Anti-AI-look rules

We follow ALL of these. Always.
- ❌ No purple/teal gradient backgrounds (the #1 AI-slop tell)
- ❌ No "glowing orb" hero illustrations
- ❌ No generic mesh gradients
- ❌ No stock floating shapes/blobs
- ❌ No "AI sparkle" emoji or icon
- ❌ No three-line "Lorem ipsum"-flavor body copy
- ❌ No bullet lists with random emoji prefixes
- ❌ No "Welcome to the future" copy
- ❌ No `AI-` prefix anywhere
- ✅ Yes: typographic restraint, real product screenshots, terminal output, one wink per page
- ✅ Yes: liquid glass executed *minimally* — frosted layer over real content, not as decoration
- ✅ Yes: neumorphism only on tactile buttons (install commands), never on text or content cards
