# Parz Expander

`ParzExpander` is the Parz UI section that opens smoothly. The height starts softly and takes its time to settle, the content fades in and the chevron turns with a light spring. Closing is a little quicker. Nothing abrupt.

- **no measuring** — it opens via `grid-template-rows: 0fr → 1fr`, so content of any height, even changing on the fly, opens without jumps;
- **nothing gets clipped** — once open, shadows and focus rings inside are fully visible;
- **accessible** — the title is a real `<button>` with `aria-expanded`; closed content is `inert` and can't take focus;
- **reduced motion** — with `prefers-reduced-motion` the section opens instantly.

```tsx
import { useState } from 'react';
import { ParzExpander } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

<ParzExpander title="Delivery" defaultOpen>We deliver tomorrow, 10 am to 6 pm.</ParzExpander>

// only one section open
const [open, setOpen] = useState<number | null>(0);
<ParzExpander title="Payment" open={open === 0} onOpenChange={v => setOpen(v ? 0 : null)}>…</ParzExpander>
<ParzExpander title="Returns" open={open === 1} onOpenChange={v => setOpen(v ? 1 : null)}>…</ParzExpander>
```

| Prop | Default | What it does |
|---|---|---|
| `title` | — | Title — the toggle button |
| `children` | — | Content |
| `open` | — | Open (controlled) |
| `defaultOpen` | `false` | Open on mount (uncontrolled) |
| `onOpenChange` | — | `(open: boolean) => void` |
| `disabled` | `false` | Can't be opened, dimmed |
| `variant` | `'plain'` | `'plain'` — a section with a bottom line, `'card'` — a glass card; adjacent cards join into one group |
| `divider` | `true` | Bottom divider line |
| `color` | `#f2f2f5` | Title colour |
| `chevronColor` | `#9a9aa3` | Chevron colour |
| `dividerColor` | `#26262c` | Divider colour |
| `id` / `className` / `style` | — | Applied to the root `<section>` |

## CSS variables

On the section itself or any parent: `--pz-ex-fg`, `--pz-ex-chev`, `--pz-ex-line`, `--pz-ex-ring` (focus ring).
