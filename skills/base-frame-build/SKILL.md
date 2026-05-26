---
name: base-frame-build
version: 0.1.0
description: Build a Farcaster Frame (v2 Mini App) that lives on Base — interactive embeds with onchain actions, wallet auth, and shareable cast distribution.
license: MIT
authors: [BaseKit]
network: base
chain_id: 8453
risk_level: low
reversible: true
requires_signing: optional
mutates_state: optional
estimated_cost_usd_max: 2.00
trust:
  audit_status: community-reviewed
  external_calls: [Farcaster Hub, Neynar, Base RPC]
  pii: fid-only
tags: [farcaster, frame, mini-app, distribution]
signed: false  # v0.2 official, sig at v0.3
---

# Base Frame Build

Frames are the closest thing crypto has to a viral distribution channel — embed an interactive app inside a Farcaster cast, ship state-changing actions in the feed, get pulled into the Base App's native experience.

This skill covers v2 Frames (Mini Apps), which is what Base/Warpcast now prefer.

## When to use

- You have a feature that benefits from being a 1-tap interaction inside a feed
- You want native distribution into the Base App
- Your audience overlaps with Farcaster (builders, onchain natives, art collectors)

## When NOT to use

- The interaction requires full screen, complex multi-step UI → build a proper webapp and link
- Heavy media (large video) → frames have weight limits, host elsewhere

## Project skeleton

```bash
npx create-onchain --template frame your-frame
cd your-frame
npm install @farcaster/frame-sdk @farcaster/auth-client viem
```

Key files:
- `app/page.tsx` — the rendered HTML the Frame loads
- `app/.well-known/farcaster.json` — discovery manifest
- `app/api/frame/route.ts` — Frame action handler (POST endpoint)

## farcaster.json manifest

```json
{
  "accountAssociation": {
    "header": "...",
    "payload": "...",
    "signature": "..."
  },
  "frame": {
    "version": "1",
    "name": "Your Frame",
    "iconUrl": "https://yourframe.xyz/icon.png",
    "homeUrl": "https://yourframe.xyz",
    "imageUrl": "https://yourframe.xyz/og.png",
    "buttonTitle": "Open",
    "splashImageUrl": "https://yourframe.xyz/splash.png",
    "splashBackgroundColor": "#0A0A0F",
    "webhookUrl": "https://yourframe.xyz/api/webhook"
  }
}
```

Generate `accountAssociation` from the Warpcast manifest tool — it cryptographically binds the frame to your Farcaster account.

## Onchain action in a Frame

Use the Frame SDK to request a wallet connection and send a tx:

```tsx
import { sdk } from '@farcaster/frame-sdk';
import { useAccount, useSendTransaction } from 'wagmi';

export default function Page() {
  const { address } = useAccount();
  const { sendTransaction } = useSendTransaction();

  useEffect(() => { sdk.actions.ready(); }, []);

  return (
    <button onClick={() => sendTransaction({
      to: CONTRACT,
      data: encodeFunctionData({ abi, functionName: 'claim', args: [] }),
    })}>
      Claim
    </button>
  );
}
```

The Frame inherits the user's Base App wallet — no separate connect step.

## OG image (the thumbnail)

This is the most important asset. The image is what makes someone tap.

- 1200×630, < 256KB
- Render dynamically per state: pre-action, success, failure
- Use a vector style or generated illustration; avoid stock or AI clichés
- Include 1 number (price, count, % filled) — numbers drive clicks

Generate via `@vercel/og` or static asset.

## Notifications (the real superpower)

After a user has interacted with your frame, you can request notification permission. Use sparingly:
- Confirmation of an action they took
- A meaningful state change in something they followed
- Never marketing

```ts
await sdk.actions.requestNotificationPermission();
// Then POST to webhookUrl when relevant
```

## Distribution playbook

1. Deploy frame
2. Cast a launch announcement with the frame URL — Warpcast auto-renders
3. DM 5-10 power users with a personal note and the frame
4. Get listed in @farcasterxyz mini-app directory
5. Cross-cast in /base channel (high signal-to-noise on Base-specific frames)

## A2A note for autonomous agents

Agents typically **consume** Frames more than build them, but for builder agents:
- Frame creation is safe (no signing required for deploy unless you mint NFTs in the flow)
- Frame interactions on behalf of a user require the user's connected wallet — agent should never auto-tap action buttons
- Treat Frame manifest signing as a privileged operation requiring human confirmation

## Sources

- [Farcaster Frame v2 spec](https://docs.farcaster.xyz/developers/frames/v2/getting-started)
- [Base Mini Apps](https://docs.base.org/cookbook/base-app/mini-apps)
- [Frame SDK](https://github.com/farcasterxyz/frames)
- [Neynar Frame API](https://docs.neynar.com)
