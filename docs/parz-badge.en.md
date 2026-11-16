# Parz Badge

`ParzBadge` is a Parz UI label or counter. It appears like a drop, the digits roll when the number changes and the width flows to fit — nothing jumps. Use it on its own or put it in the corner of a button, avatar or icon.

- **appear** — swells from a small drop, gently squashes and settles;
- **number changes** — the old number slides out, the new one slides in (up when it grows, down when it shrinks), the width flows;
- **disappear** — when `count` becomes 0 (or the badge is removed) it pulls into a drop and fades;
- **pulse** — a soft ring spreads and melts, handy for an “online” or “recording” dot;
- **reduced motion** — with `prefers-reduced-motion` it changes without movement.

Text and digits are centered on the pixel grid in every size.

```tsx
import { ParzBadge, ParzButton } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

<ParzBadge label="New" />
<ParzBadge label="Beta" variant="soft" color="#7aa7ff" />

// in the corner of a button
<ParzBadge count={unread} ariaLabel={`${unread} new messages`}>
  <ParzButton icon="ms:notifications" iconOnly ariaLabel="Notifications" />
</ParzBadge>

// online dot
<ParzBadge dot pulse color="#38c172" ariaLabel="Online">
  <Avatar />
</ParzBadge>
```

| Prop | Default | What it does |
|---|---|---|
| `label` | — | Text: “New”, “Beta”… |
| `count` | — | Number. Above `max` shows `max+`; `0` hides the badge |
| `max` | `99` | Maximum for `count` |
| `showZero` | `false` | Show `0` instead of hiding |
| `dot` | `false` | A dot without text |
| `pulse` | `false` | Soft pulsing ring |
| `icon` | — | Icon before the text: built-in name, `'ms:name'`, `'mi:name'` or your own node |
| `variant` | `'solid'` | `'solid'`, `'soft'`, `'outline'` or `'glass'` |
| `size` | `'md'` | `'sm'` (15 px), `'md'` (20 px), `'lg'` (24 px) |
| `color` | `#ff4d5e` | Main color |
| `textColor` | — | Text color |
| `children` | — | Element the badge sits on. Without it the badge is inline |
| `placement` | `'top-end'` | Corner: `'top-end'`, `'top-start'`, `'bottom-end'`, `'bottom-start'` |
| `ariaLabel` | — | Text for screen readers, for example “3 new messages” |
| `className` / `style` | — | On the badge (or on the wrapper when there are `children`) |

## CSS variables

`--pz-bd-color` (main color), `--pz-bd-fg` (text), `--pz-bd-ring` (thin outline around a badge in a corner — set it to your background color).

```css
.toolbar { --pz-bd-ring: #101014; }
```
