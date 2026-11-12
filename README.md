# Parz UI

**English** · [Հայերեն](README.hy.md) · [Русский](README.ru.md)

React components with liquid motion — springy, smooth, nothing abrupt. Crafted by **CarPark Team** & **Dev.CarPark**.

| Component | What it is | Docs |
|---|---|---|
| `ParzMenu` | Navigation bar: the highlight flows between tabs like a drop, round buttons bounce; on desktop it becomes a header with search | [docs](docs/parz-menu.en.md) |
| `ParzToggle` | Switch with a liquid thumb that stretches, squashes and can be dragged; optional “too fast” rejected state | [docs](docs/parz-toggle.en.md) |
| `ParzCheckbox` | Checkbox where color spreads like a drop and the tick draws itself; indeterminate and error states | [docs](docs/parz-checkbox.en.md) |
| `ParzSlider` | Slider whose thumb stretches with the speed of your drag | [docs](docs/parz-slider.en.md) |
| `ParzRange` | Range slider with 2 to 5 thumbs on one track | [docs](docs/parz-slider.en.md) |
| `AnimoLogo` | Living text logo: letters float in, catch a wave on hover, light up when held | [docs](docs/animologo.en.md) |

## Installation

```bash
npm install @carparkteam/parz-ui
```

Or straight from GitHub:

```bash
npm install github:CarParkTeam-Dev/parz-ui
```

Requires React 18 or newer.

## Usage

Import the styles once (for example, in your app entry), then use any component:

```tsx
import { useState } from 'react';
import { ParzMenu, ParzToggle, ParzCheckbox, ParzSlider, ParzRange, AnimoLogo } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

export function Settings() {
  const [wifi, setWifi] = useState(true);
  const [agree, setAgree] = useState(false);
  const [volume, setVolume] = useState(60);
  const [price, setPrice] = useState([20, 70]);

  return (
    <>
      <ParzToggle checked={wifi} onChange={setWifi} label="Wi-Fi" />
      <ParzCheckbox checked={agree} onChange={setAgree} label="I accept the terms" />
      <ParzSlider value={volume} onChange={setVolume} label="Volume" formatValue={v => `${v}%`} />
      <ParzRange value={price} onChange={setPrice} label="Price" />
    </>
  );
}
```

Everything is written in TypeScript, the types ship with the package. All components work with the keyboard and screen readers, look right on phones and desktops, and respect the system “reduce motion” setting.

## Playground

The repository includes a site with a live editor for every component: tweak the settings and copy ready-made code.

```bash
git clone https://github.com/CarParkTeam-Dev/parz-ui.git
cd parz-ui
npm install
npm run dev
```

It opens at `http://localhost:5280`. The live site is at [dev.carpark.am/parz-ui](https://dev.carpark.am/parz-ui). `npm run build` builds this playground into `build/` for any static hosting.

## Development

| Command | What it does |
|---|---|
| `npm run dev` | Playground with hot reload |
| `npm run build:lib` | Builds the package into `dist/` (JS, CSS, types) |
| `npm run build` | Builds the playground into `build/` |
| `npm run typecheck` | Type check |
| `npm run release -- patch` | Release a new version (add `--beta` for a pre-release, `--dry-run` to preview) |

## License

Parz UI is free to use, including in commercial projects, under the [Parz UI License](LICENSE) — MIT with one extra condition:

**any product that uses Parz UI must show its users the text “Components by CarPark Team” as a link to [dev.carpark.am/parz-ui](https://dev.carpark.am/parz-ui)** — in the footer, an “About” or “Credits” screen, or the settings. It must be readable and not hidden. The words “Components by” may be translated.

The easiest way is the ready-made `ParzCredit` component:

```tsx
import { ParzCredit } from '@carparkteam/parz-ui';

<footer>
  © 2026 My App · <ParzCredit />
</footer>

// in your product's language
<ParzCredit prefix="Компоненты от" />
```

© 2026 CarPark Team & Dev.CarPark
