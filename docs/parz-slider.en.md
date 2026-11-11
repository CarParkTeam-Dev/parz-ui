# Parz Slider & Parz Range

Two Parz UI sliders with one liquid core.

- **`ParzSlider`** — a single value: volume, brightness, size.
- **`ParzRange`** — an interval with **2 to 5 thumbs** on one track: price “from–to”, working hours with a break, several zones.

How they move:

- **drag** — the thumb grows a little and stretches with the speed of your movement, then rounds back with a soft spring;
- **tap the track** — the nearest thumb slides over with a light overshoot, the fill catches up;
- **value bubble** — pops up above the thumb while you drag or focus it;
- **keyboard** — Tab to a thumb, arrows ±`step`, PageUp/PageDown ±10%, Home/End to the edges;
- **reduced motion** — with `prefers-reduced-motion` only short plain moves remain.

In `ParzRange` thumbs never jump over each other, and `minDistance` keeps a gap between neighbours.

```tsx
import { useState } from 'react';
import { ParzSlider, ParzRange } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

const [volume, setVolume] = useState(60);
<ParzSlider value={volume} onChange={setVolume} label="Volume" formatValue={v => `${v}%`} />

const [price, setPrice] = useState([2000, 7000]);
<ParzRange value={price} onChange={setPrice} min={0} max={10000} step={500}
  label="Price" formatValue={v => `$${v}`} onChangeEnd={loadResults} />

// four thumbs: work 9–13, break, work 14–18
<ParzRange defaultValue={[9, 13, 14, 18]} min={0} max={24} minDistance={1} fill="pairs" formatValue={v => `${v}:00`} />
```

## Shared props

| Prop | Default | What it does |
|---|---|---|
| `min` / `max` / `step` | `0` / `100` / `1` | Bounds and step |
| `label` | — | Caption above the slider |
| `showOutput` | `true` if `label` | Current value on the right of the caption |
| `formatValue` | — | How to print a number, e.g. ``v => `${v} km` `` |
| `showValue` | `'auto'` | Bubble above the thumb: `'auto'` — while dragging or focused, `'always'`, `'never'` |
| `marks` | — | `true` — a dot at every step, or a list: `[0, 50, { value: 100, label: 'Max' }]` |
| `size` | `'md'` | `'sm'` (16 px), `'md'` (20 px), `'lg'` (26 px) or thumb diameter in px |
| `disabled` | `false` | Turned off and dimmed |
| `accent` | `#6ee7a0` | Fill color |
| `trackColor` | `#2a2a30` | Track color. On a light page use something like `#d9dae1` |
| `thumbColor` | `#fff` | Thumb color |
| `name` | — | Values are sent with a form as hidden inputs |
| `className` / `style` | — | On the root element |

## ParzSlider

| Prop | Default | What it does |
|---|---|---|
| `value` / `defaultValue` | — / `min` | Value (controlled / uncontrolled) |
| `onChange` | — | `(value: number) => void` — on every move |
| `onChangeEnd` | — | `(value: number) => void` — when released or after a key press |
| `ariaLabel` | — | Name for screen readers when there is no `label` |

## ParzRange

| Prop | Default | What it does |
|---|---|---|
| `value` / `defaultValue` | — / 25% and 75% | Values in ascending order, **from 2 to 5**. Extra ones are cut, missing ones are added at `max` |
| `onChange` | — | `(value: number[]) => void` |
| `onChangeEnd` | — | `(value: number[]) => void` — good place to load results |
| `minDistance` | `0` | Minimum gap between neighbouring thumbs |
| `fill` | `'span'` | `'span'` — fill from the first to the last thumb, `'pairs'` — only pairs 1–2, 3–4 (work — break — work) |
| `ariaLabels` | — | Screen-reader names for thumbs, e.g. `['From', 'To']` |

The limits are exported too: `RANGE_MIN_THUMBS` (2) and `RANGE_MAX_THUMBS` (5).

## CSS variables

`--pz-sl-accent`, `--pz-sl-track`, `--pz-sl-knob`, `--pz-sl-tip-bg`, `--pz-sl-tip-fg` — on the slider or any parent.
