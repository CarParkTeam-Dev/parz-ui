# Parz Number Flow

`ParzNumberFlow` is a number or short text where each character changes on its own. The old digit slides out and dissolves with a blur, the new one slides in from the other side on a spring. Characters that didn't change stay put.

- **direction**: the number grows — digits move up, it shrinks — they move down (`direction="auto"`); or force `'up'` / `'down'`;
- **strings**: pass a ready string — `'08:30'`, `'14:05:09'`, `'-12°'`;
- **words**: short ones (up to 8 letters) change letter by letter, rolling through the alphabet — English, Russian or Armenian; long ones change in 3-letter chunks; `words` — force `'letters'` or `'chunks'`;
- **format**: `locale` and `formatOptions` (Intl.NumberFormat) — currency, percent, separators; or your own `format` function;
- **width**: equal-width digits (`tabular`), and when the number gains or loses characters the row widens smoothly;
- **ParzProvider**: the spring follows the `calm` / `bouncy` / `snappy` preset;
- **reduced motion**: with `prefers-reduced-motion` the value changes instantly;
- **accessibility**: screen readers read the whole value; `live` announces every change.

```tsx
import { ParzProvider, ParzNumberFlow } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

<ParzProvider motion="bouncy">
  <ParzNumberFlow value={count} />
  <ParzNumberFlow value={price} locale="en-US" formatOptions={{ style: 'currency', currency: 'USD' }} />
  <ParzNumberFlow value="08:30" />
</ParzProvider>
```

| Prop | Default | What it does |
|---|---|---|
| `value` | — | Number or string |
| `format` | — | `(n) => string` — your own number formatting |
| `locale` | browser language | Locale for the number |
| `formatOptions` | — | `Intl.NumberFormat` options |
| `direction` | `'auto'` | `'auto'`, `'up'`, `'down'` |
| `tabular` | `true` | Equal-width digits |
| `blur` | `6` | Motion blur, px; `0` — none |
| `words` | `'auto'` | How words change: `'auto'`, `'letters'`, `'chunks'` |
| `motion` | from `ParzProvider` | `'calm'`, `'bouncy'`, `'snappy'` |
| `live` | `false` | `aria-live="polite"` |
| `className`, `style` | — | Font size, color and weight are inherited from the parent |
