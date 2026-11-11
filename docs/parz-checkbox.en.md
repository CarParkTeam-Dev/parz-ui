# Parz Checkbox

`ParzCheckbox` is a Parz UI checkbox with liquid motion. When checked, color spreads from the center like a drop and slightly overshoots, the box squashes and springs back, and the tick draws itself in. When unchecked, everything gently pulls back in. Nothing jumps.

- **tap or click** — on the box or on its label;
- **press** — the box softly squeezes;
- **keyboard** — Tab to focus (a visible ring appears), Space or Enter to toggle;
- **partly selected** — `indeterminate` shows a dash, e.g. for “Select all”;
- **error** — `invalid` paints the border and fill red;
- **reduced motion** — with `prefers-reduced-motion` only short fades remain.

Under the hood it is a real `<input type="checkbox">`, so forms, `name` / `value`, screen readers and focus work as usual.

```tsx
import { useState } from 'react';
import { ParzCheckbox } from '@parz/ui';
import '@parz/ui/style.css';

const [on, setOn] = useState(false);

<ParzCheckbox checked={on} onChange={setOn} label="Remember me" />

// "Select all" over a list
const all = items.every(i => i.on), some = items.some(i => i.on);
<ParzCheckbox checked={all} indeterminate={some && !all} onChange={selectAll} label="Select all" />

// must agree
<ParzCheckbox checked={agree} onChange={setAgree} invalid={submitted && !agree}
  label="I accept the terms" description="Required to continue" />
```

| Prop | Default | What it does |
|---|---|---|
| `checked` | — | State (controlled mode) |
| `defaultChecked` | `false` | Initial state (uncontrolled mode) |
| `onChange` | — | `(checked: boolean) => void` — on click or keyboard |
| `indeterminate` | `false` | Partly selected — a dash instead of the tick |
| `label` | — | Text or node next to the box |
| `description` | — | Small helper text under the label |
| `labelPosition` | `'end'` | `'end'` — label on the right, `'start'` — on the left |
| `ariaLabel` | — | Name for screen readers when there is no visible `label` |
| `disabled` | `false` | Turned off, dimmed, not focusable |
| `invalid` | `false` | Error state: red border and fill, `aria-invalid` |
| `size` | `'md'` | `'sm'` (16 px), `'md'` (20 px), `'lg'` (26 px) or box side in px |
| `radius` | about a third of size | Corner radius, px |
| `accent` | `#6ee7a0` | Fill color when checked |
| `borderColor` | `#4a4a55` | Border when unchecked. On a light page use something like `#b9bac6` |
| `checkColor` | `#04130a` | Tick color |
| `name` / `value` / `id` | — | Passed to the inner checkbox |
| `className` / `style` | — | On the root `<label>` |

## CSS variables

Colors can also be set from CSS on the checkbox or any parent: `--pz-cb-accent`, `--pz-cb-border`, `--pz-cb-check`, `--pz-cb-invalid`.

```css
.form { --pz-cb-accent: #7aa7ff; --pz-cb-check: #fff; }
```
