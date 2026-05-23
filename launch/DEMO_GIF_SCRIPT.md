# Demo GIF script

> 8 seconds. Loop seamlessly. Black terminal, white text, blue accent.
> Tool: `asciinema` → `agg --theme=monokai` → `ffmpeg` to gif, 800px wide, 12fps.

## Frames

**0.0 - 0.6s** — terminal cold open, blinking cursor on empty prompt

```
$ █
```

**0.6 - 1.4s** — typed install command (auto-type, ~50ms per char)

```
$ claude plugin install basekit
```

**1.4 - 2.4s** — install output streams

```
→ resolving manifest from basekit.dev/plugin.json
→ installing 5 skills, 1 MCP server
  ✓ base-deploy-token
  ✓ base-analyze-wallet
  ✓ base-gas-optimize
  ✓ base-airdrop
  ✓ base-basescan-debug
ready · try: "deploy an ERC-20 on Base sepolia called Greycoin"
```

**2.4 - 3.6s** — user prompt typed into Claude Code

```
> deploy an ERC-20 on Base sepolia called Greycoin, supply 1B
```

**3.6 - 5.6s** — agent works (compact summarized output)

```
[skill: base-deploy-token]
✓ loaded foundry template
✓ compiling Greycoin.sol
✓ estimating gas: 1,123,847 wei (≈ $0.04 at 0.04 gwei)
deploy? [y/N] y
✓ tx: 0x8f3e...
✓ verified on Basescan ↗
```

**5.6 - 7.2s** — final result card

```
┌────────────────────────────────┐
│ Greycoin (GREY) deployed       │
│ Base Sepolia · 1,000,000,000   │
│ 0xA8C4…2f9E  ↗ basescan        │
└────────────────────────────────┘
```

**7.2 - 8.0s** — fade to BaseKit wordmark + URL

```
basekit.dev — ship onchain in one prompt
```

## Notes

- Use real Doto font in terminal recording for visual continuity with site
- Caret blinks at 50% duty cycle, 1Hz
- All blue accents use #3D3DFF (dark mode site accent)
- Export: 800x500, 12fps, ~1.2MB target for X / Farcaster embed
