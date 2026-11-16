# Parz Button

`ParzButton` is a Parz UI button with liquid motion. When pressed it gently squeezes and springs back, and a drop spreads from the exact point you touched. Nothing jumps.

- **press** — the button softly shrinks and bounces back on release;
- **drop** — a ripple flows out from the touch point (from the center when pressed with the keyboard);
- **hold** — the button stays squeezed, the drop keeps growing and a gradient slowly flows under the label; release and everything melts back;
- **content change** — when the label or icon changes, the old one dissolves, the new one appears and the width flows to its new size;
- **loading** — the label fades out, live dots take its place, the width stays the same; `aria-busy` is set;
- **hover** — only the color changes, the button never lifts;
- **keyboard** — Tab to focus (a visible ring appears), Enter or Space to press;
- **reduced motion** — with `prefers-reduced-motion` there is no squeeze or drop, the dots just pulse.

It is a real `<button>`, or `<a>` when `href` is set, so forms, links and screen readers work as usual.

```tsx
import { ParzButton } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

<ParzButton onClick={save} iconEnd="ms:arrow_forward">Continue</ParzButton>

<ParzButton variant="soft" loading={saving} loadingText="Saving">Save</ParzButton>

<ParzButton variant="glass" icon="ms:favorite" iconOnly ariaLabel="Add to favorites" />

<ParzButton variant="outline" href="/docs">Read the docs</ParzButton>
```

| Prop | Default | What it does |
|---|---|---|
| `children` | — | Label |
| `variant` | `'solid'` | `'solid'`, `'soft'`, `'outline'`, `'ghost'` or `'glass'` |
| `size` | `'md'` | `'sm'` (34 px), `'md'` (42 px), `'lg'` (52 px) |
| `shape` | `'pill'` | `'pill'`, `'rounded'` or `'square'` |
| `icon` / `iconEnd` | — | Icon before / after the label: built-in name, `'ms:name'`, `'mi:name'` or your own node |
| `iconOnly` | `false` | Square button with just the icon. Set `ariaLabel` too |
| `ariaLabel` | — | Name for screen readers |
| `loading` | `false` | Shows live dots instead of the label; the button cannot be pressed |
| `loadingText` | — | Text next to the dots while loading |
| `disabled` | `false` | Dimmed, cannot be pressed |
| `fullWidth` | `false` | Stretches to the full width |
| `href` / `target` / `rel` | — | Renders a link `<a>` |
| `type` | `'button'` | `type` of the `<button>` |
| `onClick` | — | Click handler; not called while `disabled` or `loading` |
| `onLongPress` | — | Press and hold: while held, a slowly flowing gradient fills the button; when the drop has filled it, this is called instead of `onClick` |
| `longPressDelay` | `600` | How long to hold for `onLongPress`, ms |
| `accent` | `#6ee7a0` | Main color |
| `textColor` | — | Text and icon color |
| `ripple` | `true` | Drop from the press point |
| `id` / `name` / `value` | — | Passed to the element |
| `className` / `style` | — | On the root element |

## CSS variables

Set them on the button or any parent: `--pz-btn-accent` (main color), `--pz-btn-fg` (text color), `--ltb-icon` (icon size), `--pz-btn-shade` — how much to darken the text of `soft`, `outline` and `ghost` (`0%` by default; on a light page set about `45%` so a light accent stays readable).

```css
.checkout { --pz-btn-accent: #ff8a3d; }
.light-page { --pz-btn-shade: 45%; }
```
