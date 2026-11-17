# Parz Color Picker

`ParzColorPicker` is the Parz UI color picker. The saturation and brightness field has a liquid thumb: drag it fast and it stretches along the motion; tap another spot and it springs over. Below the field are the hue and opacity sliders, a color preview, an input field and ready-made swatches.

- **two modes**: right on the page (`mode="inline"`) or a swatch button that opens a popover (`mode="popover"`);
- **formats**: HEX, RGB and HSL — switched in the input field; `onChange` uses the same format;
- **opacity**: a slider over a checkerboard, `#rrggbbaa` / `rgba()` / `hsla()`; `alpha={false}` turns it off;
- **eyedropper**: picks a color from the screen where the browser supports it (Chrome, Edge);
- **keyboard**: arrows move the thumb by 1%, with Shift by 10%; Home / End jump to the edge;
- **forms**: `name` sends the color with the form;
- **ParzProvider**: thumb and popover springs follow the `calm` / `bouncy` / `snappy` preset;
- **reduced motion**: with `prefers-reduced-motion` the thumb lands instantly.

```tsx
import { useState } from 'react';
import { ParzProvider, ParzColorPicker } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

const [color, setColor] = useState('#7a5cff');

<ParzProvider motion="bouncy">
  <ParzColorPicker value={color} onChange={setColor} />
  <ParzColorPicker value={color} onChange={setColor} mode="popover" label="Color" />
</ParzProvider>
```

| Prop | Default | What it does |
|---|---|---|
| `value` | — | Color (controlled): `'#7a5cff'`, `'#7a5cff80'`, `'rgb(…)'`, `'rgba(…)'`, `'hsl(…)'` |
| `defaultValue` | `'#7a5cff'` | Initial color (uncontrolled) |
| `onChange` | — | `(value, color)` — a string in the current format and the color in every form: `hex`, `rgb`, `hsl`, `hsv`, `css` |
| `onChangeEnd` | — | The same when the thumb is released, a swatch is picked or the input is confirmed |
| `format` | `'hex'` | `'hex'`, `'rgb'`, `'hsl'` |
| `onFormatChange` | — | Format change in the input field |
| `alpha` | `true` | Opacity slider |
| `showInput` | `true` | Input field with a format switch |
| `swatches` | `PARZ_COLOR_SWATCHES` | Ready-made colors; `[]` hides them |
| `eyeDropper` | `true` | Eyedropper where the browser supports it |
| `mode` | `'inline'` | `'inline'` or `'popover'` |
| `label` | — | Label next to the swatch in `popover` mode |
| `theme` | `'dark'` | `'dark'` or `'light'` |
| `motion` | from `ParzProvider` | `'calm'`, `'bouncy'`, `'snappy'` |
| `name` | — | Form field name |
| `labels` | English | `area`, `hue`, `alpha`, `eyeDropper`, `input`, `swatch` (`'Color {c}'`), `open` |
| `ariaLabel` | — | Name for screen readers |
| `disabled` | `false` | Disabled |

An invalid value in the input is not applied: the field gives a short shake and returns to the current color. `parseColor(string)` from the library parses the same formats.
