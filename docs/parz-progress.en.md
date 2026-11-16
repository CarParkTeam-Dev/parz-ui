# Parz Progress

`ParzProgress` is a Parz UI progress indicator — a bar or a ring. When the value changes, the fill flows to it on a soft spring instead of jumping. Nothing is abrupt.

- **value changes** — the fill and the percentage flow to the new value;
- **sheen** — a soft highlight slowly drifts along the bar fill;
- **unknown duration** — without `value` (or with `indeterminate`) a liquid drop flows along the bar, or the ring arc breathes and turns;
- **100%** — the track softly glows once (`celebrate`);
- **reduced motion** — with `prefers-reduced-motion` the value is shown at once and the unknown mode just pulses.

It has `role="progressbar"` with `aria-valuenow`, so screen readers announce the progress.

```tsx
import { ParzProgress } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

<ParzProgress value={progress} label="Uploading" />

<ParzProgress variant="ring" value={progress} size="lg" />

// unknown duration
<ParzProgress indeterminate label="Please wait…" />
```

| Prop | Default | What it does |
|---|---|---|
| `value` | — | Current value. Without it the progress is in the unknown-duration mode |
| `max` | `100` | Maximum |
| `indeterminate` | `false` | Unknown duration: a drop flows along the bar, the ring arc turns |
| `variant` | `'bar'` | `'bar'` or `'ring'` |
| `size` | `'md'` | Bar height `'sm'` (4 px), `'md'` (8 px), `'lg'` (12 px); ring `28`, `44`, `68` px |
| `label` | — | Text above the bar; next to or below the ring |
| `labelPosition` | `'end'` | Ring only: `'end'` — right of the ring, `'start'` — left, `'bottom'` — below |
| `showValue` | `true` with `value` | Show the value: right of the label, or in the ring center (not for `sm` ring) |
| `formatValue` | percent | `(value, max) => ReactNode` |
| `status` | `'default'` | `'success'`, `'warning'` (the fill gently breathes), `'error'` (one soft shake), `'paused'` (muted, the motion stops where it is). Success, error and paused show a check, `!` or pause icon instead of the number |
| `successMorph` | `false` | **Beta.** At 100% with `status="success"` the bar pulls into a drop and turns into a circle with a check; the ring fills with color and shows a check. Reverses smoothly |
| `celebrate` | `true` | Soft glow when it reaches the end |
| `accent` | `#6ee7a0` | Fill color |
| `trackColor` | translucent gray | Track color |
| `ariaLabel` | — | Name for screen readers when there is no `label` |
| `className` / `style` | — | On the root element |

## CSS variables

`--pz-pg-accent` (fill), `--pz-pg-success`, `--pz-pg-warning`, `--pz-pg-error`, `--pz-pg-paused` (status colors), `--pz-pg-track` (track), `--pz-pg-h` (bar height).

```css
.uploads { --pz-pg-accent: #7aa7ff; --pz-pg-h: 6px; }
```
