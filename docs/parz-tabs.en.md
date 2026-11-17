# Parz Tabs

`ParzTabs` is the Parz UI segmented control. The selection pill doesn't jump — it flows to the new item: the leading edge goes first, the tail catches up, and for a moment the pill stretches like a drop, just like in Parz Menu.

- **click or tap** — selects an item;
- **keyboard** — Tab focuses the selected item, the arrow keys and Home / End switch (skipping disabled ones);
- **wrapping** — if items don't fit they wrap to a new line, and the pill glides there too;
- **reduced motion** — with `prefers-reduced-motion` the pill moves without animation.

Under the hood it's a `role="radiogroup"` with `role="radio"` buttons, so screen readers announce it as a single choice.

```tsx
import { useState } from 'react';
import { ParzTabs } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

const [tab, setTab] = useState('week');

<ParzTabs
  options={[
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' }
  ]}
  value={tab}
  onChange={setTab}
  ariaLabel="Period"
/>
```

| Prop | Default | What it does |
|---|---|---|
| `options` | — | `{ value, label?, icon?, badge?, badgeColor?, ariaLabel?, disabled? }[]` — the items; `badge` is a number, short text or `'dot'`, `badgePulse` adds a soft pulse |
| `value` | — | Selected value (controlled) |
| `defaultValue` | first enabled | Initial value (uncontrolled) |
| `onChange` | — | `(value) => void` |
| `ariaLabel` | — | Group name for screen readers |
| `size` | `'md'` | `'sm'`, `'md'` or `'lg'` |
| `fullWidth` | `false` | Stretch to full width with equal items |
| `overflow` | `'wrap'` | When items don't fit: `'wrap'` — wrap to a new line, `'more'` — extra items go into “•••” with a menu, `'scroll'` — horizontal scrolling |
| `fadeEdges` | `true` | For `'scroll'`: fade the edges that have more items behind them |
| `scrollButtons` | `false` | For `'scroll'`: small arrows on the edges. With them the selected item isn't scrolled to the centre automatically |
| `badgePlacement` | `'inline'` | Where badges sit: `'inline'` — next to the label, `'corner'` — in the item's top-right corner, without changing its width |
| `moreIcon` | `'more'` | Icon of the button with the other items — built-in, `'ms:name'` or your own element |
| `moreLabel` | `'More'` | Screen-reader label for “•••” |
| `disabled` | `false` | Disable the whole control |
| `background` | `#1c1c21` | Track background |
| `pillColor` | `#fff` | Pill colour |
| `activeColor` | `#000` | Text of the selected item |
| `color` | `#9a9aa3` | Text of the other items |
| `id` / `className` / `style` | — | Applied to the root element |

## When items don't fit

- **`overflow="more"`** — whatever fits stays in the row, the rest goes into “•••”. The button shows a neutral count of hidden items and a red dot if any of them has a badge. Tap “•••” — the pill flows to it and a menu opens; pick an item there and the pill stays on “•••”.
- **`overflow="scroll"`** — items scroll with a finger or the wheel, edges softly fade (`fadeEdges={false}` turns it off). The selected item glides to the centre on its own; with `scrollButtons` arrows appear on the edges and there's no auto-scroll. If you change the size, width or items, the selected item still never stays hidden.

```tsx
<ParzTabs options={opts} value={tab} onChange={setTab} overflow="more" />
<ParzTabs options={opts} value={tab} onChange={setTab} overflow="scroll" scrollButtons />
```

## CSS variables

On the control itself or any parent: `--pz-tabs-bg`, `--pz-tabs-pill`, `--pz-tabs-on`, `--pz-tabs-fg`, `--pz-tabs-sh` (pill shadow), `--pz-tabs-menu-bg`, `--pz-tabs-menu-fg`, `--pz-tabs-ring` (focus ring).
