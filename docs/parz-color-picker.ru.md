# Parz Color Picker

`ParzColorPicker` — выбор цвета Parz UI. В поле насыщенности и яркости стоит жидкий бегунок: если тянуть его быстро, он вытягивается по направлению движения, а при нажатии в другое место поля перелетает туда пружиной. Под полем — ползунки оттенка и прозрачности, превью цвета, поле ввода и готовые образцы.

- **два режима**: прямо на странице (`mode="inline"`) или кружок-образец, по нажатию которого всплывает окно (`mode="popover"`);
- **форматы**: HEX, RGB и HSL — переключаются в поле ввода, в этом же формате приходит `onChange`;
- **прозрачность**: ползунок на шахматке, `#rrggbbaa` / `rgba()` / `hsla()`; `alpha={false}` — без неё;
- **пипетка**: берёт цвет с экрана, где браузер это поддерживает (Chrome, Edge);
- **клавиатура**: стрелки двигают бегунок на 1%, с Shift — на 10%; Home / End — к краю;
- **форма**: `name` — цвет уйдёт с формой;
- **ParzProvider**: пружины бегунков и окна — из пресета `calm` / `bouncy` / `snappy`;
- **меньше движения**: при `prefers-reduced-motion` бегунок встаёт на место сразу.

```tsx
import { useState } from 'react';
import { ParzProvider, ParzColorPicker } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

const [color, setColor] = useState('#7a5cff');

<ParzProvider motion="bouncy">
  <ParzColorPicker value={color} onChange={setColor} />
  <ParzColorPicker value={color} onChange={setColor} mode="popover" label="Цвет" />
</ParzProvider>
```

| Проп | По умолчанию | Что делает |
|---|---|---|
| `value` | — | Цвет (управляемый режим): `'#7a5cff'`, `'#7a5cff80'`, `'rgb(…)'`, `'rgba(…)'`, `'hsl(…)'` |
| `defaultValue` | `'#7a5cff'` | Начальный цвет (неуправляемый режим) |
| `onChange` | — | `(value, color)` — строка в текущем формате и цвет во всех видах: `hex`, `rgb`, `hsl`, `hsv`, `css` |
| `onChangeEnd` | — | То же, когда отпустили бегунок, выбрали образец или подтвердили ввод |
| `format` | `'hex'` | `'hex'`, `'rgb'`, `'hsl'` |
| `onFormatChange` | — | Смена формата в поле ввода |
| `alpha` | `true` | Ползунок прозрачности |
| `showInput` | `true` | Поле ввода с переключателем формата |
| `swatches` | `PARZ_COLOR_SWATCHES` | Готовые цвета; `[]` — без образцов |
| `eyeDropper` | `true` | Пипетка, если браузер её поддерживает |
| `mode` | `'inline'` | `'inline'` или `'popover'` |
| `label` | — | Подпись рядом с кружком в режиме `popover` |
| `theme` | `'dark'` | `'dark'` или `'light'` |
| `motion` | из `ParzProvider` | `'calm'`, `'bouncy'`, `'snappy'` |
| `name` | — | Имя поля формы |
| `labels` | английские | `area`, `hue`, `alpha`, `eyeDropper`, `input`, `swatch` (`'Color {c}'`), `open` |
| `ariaLabel` | — | Имя для экранных дикторов |
| `disabled` | `false` | Отключён |

Неверное значение в поле ввода не применяется: поле коротко встряхивается и возвращает текущий цвет. `parseColor(строка)` из библиотеки разбирает те же форматы.
