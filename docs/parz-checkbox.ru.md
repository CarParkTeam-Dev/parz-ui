# Parz Checkbox

`ParzCheckbox` — чекбокс Parz UI с жидкой анимацией. При отметке цвет растекается из центра каплей и чуть перелетает, квадратик сплющивается и отпружинивает, а галочка дорисовывается штрихом. При снятии всё мягко втягивается обратно. Ничего резкого.

- **нажатие или клик** — по квадратику или по подписи;
- **удержание** — квадратик мягко поджимается;
- **клавиатура** — Tab ставит фокус (появляется заметное кольцо), Пробел или Enter переключают;
- **частично выбрано** — `indeterminate` показывает чёрточку, например у «Выбрать все»;
- **ошибка** — `invalid` красит рамку и заливку в красный;
- **меньше движения** — при `prefers-reduced-motion` остаются только короткие переходы цвета.

Внутри — настоящий `<input type="checkbox">`, поэтому формы, `name` / `value`, экранные дикторы и фокус работают как обычно.

```tsx
import { useState } from 'react';
import { ParzCheckbox } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

const [on, setOn] = useState(false);

<ParzCheckbox checked={on} onChange={setOn} label="Запомнить меня" />

// «Выбрать все» над списком
const all = items.every(i => i.on), some = items.some(i => i.on);
<ParzCheckbox checked={all} indeterminate={some && !all} onChange={selectAll} label="Выбрать все" />

// обязательное согласие
<ParzCheckbox checked={agree} onChange={setAgree} invalid={submitted && !agree}
  label="Принимаю условия" description="Без этого продолжить нельзя" />
```

| Проп | По умолчанию | Что делает |
|---|---|---|
| `checked` | — | Состояние (управляемый режим) |
| `defaultChecked` | `false` | Начальное состояние (неуправляемый режим) |
| `onChange` | — | `(checked: boolean) => void` — при клике или с клавиатуры |
| `indeterminate` | `false` | Частично выбрано — чёрточка вместо галочки |
| `label` | — | Текст или элемент рядом с флажком |
| `description` | — | Мелкий поясняющий текст под подписью |
| `labelPosition` | `'end'` | `'end'` — подпись справа, `'start'` — слева |
| `ariaLabel` | — | Имя для экранных дикторов, если нет видимой `label` |
| `disabled` | `false` | Отключён, приглушён, не получает фокус |
| `invalid` | `false` | Ошибка: красная рамка и заливка, `aria-invalid` |
| `size` | `'md'` | `'sm'` (16 px), `'md'` (20 px), `'lg'` (26 px) или сторона квадрата в px |
| `radius` | около трети размера | Скругление углов, px |
| `accent` | `#6ee7a0` | Цвет заливки, когда отмечен |
| `borderColor` | `#4a4a55` | Рамка, когда не отмечен. На светлой странице — например, `#b9bac6` |
| `checkColor` | `#04130a` | Цвет галочки |
| `name` / `value` / `id` | — | Передаются во внутренний чекбокс |
| `className` / `style` | — | На корневой `<label>` |

## CSS-переменные

Цвета можно задать и из CSS — на самом флажке или любом родителе: `--pz-cb-accent`, `--pz-cb-border`, `--pz-cb-check`, `--pz-cb-invalid`.

```css
.form { --pz-cb-accent: #7aa7ff; --pz-cb-check: #fff; }
```
