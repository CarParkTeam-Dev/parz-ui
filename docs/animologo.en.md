# AnimoLogo

`AnimoLogo` is a separate Parz UI component: a text logo where every letter is a small light. Letters toward the center are brighter. It works on its own anywhere, and fits the header’s `logo` slot.

- **appear** — letters float in out of a blur, a highlight runs across them;
- **hover** — a wave of the accent color;
- **press and hold** — letters gather and dim, a line fills underneath, after `holdDuration` they light up in the accent;
- **release** — they spread back out and briefly brighten, nothing abrupt;
- **idle** — a rare soft shimmer.

```tsx
import { ParzMenu, AnimoLogo } from '@carparkteam/parz-ui';

<ParzMenu items={items} desktop={{ logo: <AnimoLogo text="CARPARK" /> }} />

<AnimoLogo text="PARZ" size={22} onClick={() => navigate('/')} onHoldComplete={openAbout} />
```

| Prop | Default | What it does |
|---|---|---|
| `text` | `'PARZ'` | Logo text |
| `size` | `13` | Letter size: px or any CSS value |
| `intro` / `introDelay` | `true` / `150` | Appear animation on mount and its delay, ms |
| `idle` | `true` | Rare shimmer at rest |
| `hoverWave` | `true` | Wave on mouse hover |
| `holdEffect` / `holdDuration` | `true` / `1000` | Press-and-hold effect and how long to hold, ms |
| `onHoldComplete` | — | Held to the end — e.g. open “About” or a hidden menu |
| `onClick` | — | Regular tap or Enter. With it the logo becomes a button |
| `dimColor` / `brightColor` | `#7d7d87` / `#fafafa` | Edge and center letter colors. For a light page swap them |
| `hoverColor` | `#fff` | Color on hover |
| `accent` | `#6ee7a0` | Wave, hold line and glow |
| `spacing` | `0.34` | Letter spacing, em |
| `ariaLabel` | `text` | Screen reader label |

The font is inherited from the parent, weight 700. With the system “reduce motion” setting only color changes remain.
