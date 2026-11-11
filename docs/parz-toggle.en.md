# Parz Toggle

`ParzToggle` is a Parz UI switch with a liquid thumb. When it flips, the thumb stretches toward where it is going, squashes on arrival and settles with a light overshoot — the same feel as Parz Menu. Nothing jumps.

- **tap or click** — flips with the liquid motion;
- **press** — the thumb gently stretches like a drop;
- **drag** — pull the thumb with a finger or mouse; release past the middle to switch;
- **keyboard** — Tab to focus (a visible ring appears), Space or Enter to flip;
- **reduced motion** — with `prefers-reduced-motion` it just slides, no squash.

Under the hood it is a real `<input type="checkbox" role="switch">`, so forms, `name`, screen readers and focus work as usual.

```tsx
import { useState } from 'react';
import { ParzToggle } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

const [on, setOn] = useState(true);

<ParzToggle checked={on} onChange={setOn} label="Wi-Fi" />

// uncontrolled, no visible label
<ParzToggle defaultChecked ariaLabel="Dark theme" size="lg" accent="#7aa7ff" />
```

| Prop | Default | What it does |
|---|---|---|
| `checked` | — | State (controlled mode) |
| `defaultChecked` | `false` | Initial state (uncontrolled mode) |
| `onChange` | — | `(checked: boolean) => void` — on click, keyboard or drag |
| `label` | — | Text or node next to the switch |
| `labelPosition` | `'end'` | `'end'` — label on the right, `'start'` — on the left |
| `ariaLabel` | — | Name for screen readers when there is no visible `label` |
| `disabled` | `false` | Turned off, dimmed, not focusable |
| `size` | `'md'` | `'sm'` (16 px), `'md'` (20 px), `'lg'` (28 px) or track height in px |
| `accent` | `#6ee7a0` | Track color when on |
| `trackColor` | `#2a2a30` | Track color when off. On a light page use something like `#d9dae1` |
| `thumbColor` | `#fff` | Thumb color |
| `draggable` | `true` | Whether the thumb can be dragged |
| `cooldown` | `0` | Minimum pause between switches, ms. A too-frequent attempt is rejected |
| `canChange` | — | `(next) => boolean` — your own check; `false` rejects the switch |
| `onReject` | — | `(next) => void` — called when an attempt was rejected |
| `rejectColor` | `#ff5c5c` | Track color while rejecting |
| `name` / `id` | — | Passed to the inner checkbox |
| `className` / `style` | — | On the root `<label>` |

## Rejected state

Protect from rapid on/off spam (for example, a setting that hits a server): set `cooldown`. If the user flips again too soon, the switch does not change — for a second the track turns red and the thumb gives a short shake, then everything calmly returns. The same happens when `canChange` returns `false`.

```tsx
<ParzToggle checked={on} onChange={setOn} label="Notifications"
  cooldown={1500} onReject={() => toast('Too fast — wait a moment')} />
```

## CSS variables

Colors can also be set from CSS on the root or any parent: `--pz-tg-accent`, `--pz-tg-track`, `--pz-tg-knob`, `--pz-tg-reject`.

```css
.settings { --pz-tg-accent: #ff8a3d; }
```
