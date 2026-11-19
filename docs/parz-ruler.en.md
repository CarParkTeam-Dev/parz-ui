# Parz Ruler

`ParzRuler` is a tick scale under a fixed pointer. Drag it with a finger or the mouse: after a flick it glides with inertia and springs onto the nearest tick. Above it sits a number powered by `ParzNumberFlow`, whose digits flip with a blur. Ticks near the pointer are brighter, and the scale fades towards the edges.

- **values**: `min`, `max`, `step` — one tick per step; `formatValue` — how to show the value (e.g. minutes → `'08:30'`);
- **input**: drag with inertia, mouse wheel and trackpad, tap a tick; past the ends the scale stretches with resistance;
- **keyboard**: arrows — one step (Shift — 10), PageUp / PageDown — a tenth of the scale, Home / End — to the end;
- **look**: `tickGap` — space between ticks, `majorEvery` — every N-th tick is longer, `accent` — pointer color, `theme`;
- **the pointer** spreads a little at speed, like a drop;
- **ParzProvider**: the spring follows the `calm` / `bouncy` / `snappy` preset;
- **reduced motion**: with `prefers-reduced-motion` the scale snaps into place instantly;
- **forms**: `name` — the value is submitted with the form;
- **exclusions**: `exclude` — the scale skips these values and stops on the nearest allowed one (mouse and keyboard);
- **text**: `labels={['Ani', 'Mark', …]}` — each long tick stands for a name, short ticks fill the gaps (`minorTicks`), the name shows above.

```tsx
import { useState } from 'react';
import { ParzProvider, ParzRuler } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

const hhmm = (m: number) => `${String(m / 60 | 0).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const [minutes, setMinutes] = useState(430);

<ParzProvider motion="bouncy">
  <ParzRuler value={minutes} onChange={setMinutes} min={0} max={1430} step={10} formatValue={hhmm} ariaLabel="Time" />
</ParzProvider>
```

| Prop | Default | What it does |
|---|---|---|
| `value` | — | Value (controlled) |
| `defaultValue` | `min` | Initial value (uncontrolled) |
| `onChange` | — | Every new value, including while the scale glides |
| `onChangeEnd` | — | When the scale has stopped |
| `min`, `max`, `step` | `0`, `100`, `1` | Bounds and step |
| `tickGap` | `16` | Space between ticks, px |
| `majorEvery` | `0` | Every N-th tick is longer |
| `minorTicks` | `0`, with `labels` — `3` | Decorative short ticks between steps |
| `exclude` | — | Values the scale won't stop on: `[720, 730]` or `(v) => boolean` |
| `labels` | — | Text scale: each long tick is a name, the value is its index |
| `showValue` | `true` | Number above the scale |
| `formatValue` | — | `(v) => string` |
| `accent` | `'#ff453a'` | Pointer color |
| `theme` | `'dark'` | `'dark'` or `'light'` |
| `motion` | from `ParzProvider` | `'calm'`, `'bouncy'`, `'snappy'` |
| `name` | — | Form field name |
| `ariaLabel` | — | Name for screen readers |
| `disabled` | `false` | Disabled |
